import { spawn } from 'child_process';
import { McpServer } from '../models/McpServer.js';

// Cache active servers
// Schema of activeServers[name]: { config, process, status, tools, stdoutBuffer, pendingRequests }
const activeServers = {};
let requestIdCounter = 1;

/**
 * Handle incoming JSON-RPC responses from a spawned server
 */
function handleResponse(server, response) {
  const { id, result, error } = response;
  if (id === undefined) return; // Ignore notifications/unsolicited events
  
  const key = `${server.config.name}:${id}`;
  const pending = server.pendingRequests.get(key);
  if (pending) {
    clearTimeout(pending.timer);
    server.pendingRequests.delete(key);
    if (error) {
      pending.reject(new Error(error.message || 'MCP JSON-RPC call error'));
    } else {
      pending.resolve(result);
    }
  }
}

/**
 * Send JSON-RPC request to a server
 */
function sendRequest(server, method, params = {}) {
  const id = requestIdCounter++;
  return new Promise((resolve, reject) => {
    if (!server.process || !['connecting', 'connected'].includes(server.status)) {
      return reject(new Error(`MCP Server ${server.config.name} is not active (status: ${server.status}).`));
    }

    const timer = setTimeout(() => {
      server.pendingRequests.delete(`${server.config.name}:${id}`);
      reject(new Error(`MCP Request timed out for method: ${method}`));
    }, 15000); // 15-second response limit

    server.pendingRequests.set(`${server.config.name}:${id}`, { resolve, reject, timer });

    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    try {
      server.process.stdin.write(JSON.stringify(payload) + '\n');
    } catch (err) {
      clearTimeout(timer);
      server.pendingRequests.delete(`${server.config.name}:${id}`);
      reject(new Error(`Failed to write to stdio stream: ${err.message}`));
    }
  });
}

/**
 * Connect to an MCP server configuration
 */
export async function connectServer(config) {
  const name = config.name;
  
  if (config.type === 'stdio' && process.env.NODE_ENV === 'production') {
    throw new Error('Local terminal processes (stdio) are disabled in production environment for security. Please use SSE endpoint URLs instead.');
  }
  
  // Terminate existing process if active
  if (activeServers[name]) {
    await disconnectServer(name);
  }

  const server = {
    config,
    process: null,
    status: 'connecting',
    tools: [],
    stdoutBuffer: '',
    pendingRequests: new Map()
  };

  activeServers[name] = server;

  if (config.type === 'stdio') {
    try {
      const envVars = {};
      if (config.env) {
        config.env.forEach((val, key) => {
          envVars[key] = val;
        });
      }

      console.log(`Spawning MCP stdio process for [${name}]:`, config.command, config.args);
      
      const child = spawn(config.command, config.args, {
        env: { ...process.env, ...envVars },
        shell: true
      });

      server.process = child;

      // Handle standard outputs
      child.stdout.on('data', (chunk) => {
        server.stdoutBuffer += chunk.toString();
        const lines = server.stdoutBuffer.split('\n');
        server.stdoutBuffer = lines.pop(); // Hold onto incomplete lines

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            handleResponse(server, parsed);
          } catch (err) {
            console.error(`[MCP Server ${name} stdout error]:`, err.message, `Line data: ${trimmed}`);
          }
        }
      });

      // Handle standard errors
      child.stderr.on('data', (chunk) => {
        console.warn(`[MCP Server ${name} stderr]:`, chunk.toString().trim());
      });

      // Handle termination
      child.on('close', (code) => {
        console.log(`MCP Server [${name}] process terminated with code: ${code}`);
        server.status = 'disconnected';
        // Reject all outstanding requests
        server.pendingRequests.forEach(p => {
          clearTimeout(p.timer);
          p.reject(new Error('Process terminated.'));
        });
        server.pendingRequests.clear();
      });

      child.on('error', (err) => {
        console.error(`MCP Server [${name}] spawn error:`, err);
        server.status = 'error';
      });

      // Run JSON-RPC handshake
      console.log(`Initiating JSON-RPC handshake with [${name}]...`);
      
      const initResult = await sendRequest(server, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'much-workspace', version: '1.0.0' }
      });

      console.log(`[${name}] initialize result:`, initResult.serverInfo);

      // Send initialized notification (notification doesn't expect a response)
      try {
        child.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        }) + '\n');
      } catch (err) {
        throw new Error('Failed to notify initialized: ' + err.message);
      }

      // Fetch tools list
      console.log(`Fetching tools list from [${name}]...`);
      const toolsResponse = await sendRequest(server, 'tools/list');
      server.tools = toolsResponse.tools || [];
      server.status = 'connected';
      console.log(`[${name}] handshake complete. Exposed ${server.tools.length} tool(s).`);

    } catch (err) {
      console.error(`Failed to launch MCP server [${name}]:`, err.message);
      server.status = 'error';
      if (server.process) {
        try { server.process.kill(); } catch (e) {}
      }
    }
  } else {
    // SSE connection (stubbed/mocked as remote endpoint)
    server.status = 'disconnected';
    console.warn(`SSE type configured for [${name}], remote transport is not running.`);
  }

  return server;
}

/**
 * Disconnect an active server
 */
export async function disconnectServer(name) {
  const server = activeServers[name];
  if (!server) return;

  console.log(`Disconnecting MCP Server [${name}]...`);
  
  if (server.process) {
    try {
      server.process.kill();
    } catch (err) {
      console.error(`Failed to terminate process [${name}]:`, err.message);
    }
  }

  // Reject all pending promises
  server.pendingRequests.forEach(p => {
    clearTimeout(p.timer);
    p.reject(new Error('Server disconnected.'));
  });
  server.pendingRequests.clear();

  delete activeServers[name];
}

/**
 * Initialize all enabled servers on startup
 */
export async function initialize() {
  console.log('Initializing Model Context Protocol (MCP) Manager...');
  
  try {
    // Seed default mock server if database config is empty
    const count = await McpServer.countDocuments();
    if (count === 0) {
      console.log('No MCP servers configured. Registering default math-calculator mock...');
      await McpServer.create({
        name: 'calculator-mcp',
        type: 'stdio',
        command: 'node',
        args: ['server/mockMcpServer.js'],
        enabled: true
      });
    }

    const configs = await McpServer.find({ enabled: true });
    console.log(`Found ${configs.length} enabled MCP server configurations.`);

    for (const config of configs) {
      // Connect asynchronously to avoid blocking server boot
      connectServer(config).catch(err => {
        console.error(`Failed to connect to configured MCP server [${config.name}]:`, err.message);
      });
    }
  } catch (err) {
    console.error('Error loading MCP server list on boot:', err.message);
  }
}

/**
 * List all active tools from all connected servers
 */
export function listTools() {
  const tools = [];
  for (const [serverName, server] of Object.entries(activeServers)) {
    if (server.status === 'connected') {
      tools.push(...(server.tools || []).map(t => ({
        ...t,
        serverName
      })));
    }
  }
  return tools;
}

/**
 * Call a tool on a connected server
 */
export async function callTool(serverName, toolName, args) {
  const server = activeServers[serverName];
  if (!server || server.status !== 'connected') {
    throw new Error(`MCP Server "${serverName}" is not connected.`);
  }

  console.log(`Executing tool [${toolName}] on [${serverName}] with args:`, args);
  return await sendRequest(server, 'tools/call', {
    name: toolName,
    arguments: args
  });
}

/**
 * Get active connection statuses
 */
export function getStatuses() {
  const statuses = {};
  for (const [name, server] of Object.entries(activeServers)) {
    statuses[name] = {
      status: server.status,
      toolsCount: server.tools.length,
      tools: server.tools
    };
  }
  return statuses;
}
