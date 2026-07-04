import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { McpServer } from '../models/McpServer.js';
import * as mcpManager from '../services/mcpManager.js';

const router = express.Router();

// Get all configured MCP servers with active statuses (All authenticated users can list)
router.get('/servers', verifyToken, async (req, res) => {
  try {
    const configs = await McpServer.find({});
    const liveStatuses = mcpManager.getStatuses();

    const merged = configs.map(config => {
      const live = liveStatuses[config.name] || { status: 'disconnected', toolsCount: 0, tools: [] };
      return {
        _id: config._id,
        name: config.name,
        type: config.type,
        command: config.command,
        args: config.args,
        url: config.url,
        env: config.env,
        enabled: config.enabled,
        status: config.enabled ? live.status : 'disabled',
        toolsCount: live.toolsCount,
        tools: live.tools
      };
    });

    res.json(merged);
  } catch (error) {
    console.error('Fetch MCP configs error:', error);
    res.status(500).json({ error: 'Server error listing MCP configs.' });
  }
});

// Get list of all tools exposed by connected servers (All authenticated users can view)
router.get('/tools', verifyToken, async (req, res) => {
  try {
    const tools = mcpManager.listTools();
    res.json(tools);
  } catch (error) {
    console.error('Fetch MCP tools error:', error);
    res.status(500).json({ error: 'Server error listing active tools.' });
  }
});

// Create new MCP server configuration
router.post('/servers', verifyToken, async (req, res) => {
  try {
    const { name, type, command, args, url, env, enabled } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Server name is required.' });
    }

    if (type === 'stdio' && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Local terminal processes (stdio) are disabled in cloud production. Please use SSE endpoint URLs instead.' });
    }

    const exists = await McpServer.findOne({ name });
    if (exists) {
      return res.status(400).json({ error: 'An MCP server with this name already exists.' });
    }

    const newConfig = new McpServer({
      name,
      type: type || 'stdio',
      command,
      args: args || [],
      url,
      env: env || {},
      enabled: enabled !== undefined ? enabled : true
    });

    await newConfig.save();

    // Spawn server process asynchronously if enabled
    if (newConfig.enabled) {
      mcpManager.connectServer(newConfig).catch(err => {
        console.error(`Failed to launch server [${name}] after creation:`, err.message);
      });
    }

    res.status(201).json(newConfig);
  } catch (error) {
    console.error('Create MCP config error:', error);
    res.status(500).json({ error: 'Server error creating MCP configuration.' });
  }
});

// Update MCP server configuration
router.put('/servers/:id', verifyToken, async (req, res) => {
  try {
    const { name, type, command, args, url, env, enabled } = req.body;

    const config = await McpServer.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'MCP configuration not found.' });
    }

    // Capture old name in case name changed (needed to terminate old process)
    const oldName = config.name;

    config.name = name || config.name;
    config.type = type || config.type;
    config.command = command !== undefined ? command : config.command;
    config.args = args || config.args;
    config.url = url !== undefined ? url : config.url;
    config.env = env || config.env;
    config.enabled = enabled !== undefined ? enabled : config.enabled;

    await config.save();

    // Restart process
    if (oldName !== config.name) {
      await mcpManager.disconnectServer(oldName);
    }

    if (config.enabled) {
      mcpManager.connectServer(config).catch(err => {
        console.error(`Failed to reconnect MCP server [${config.name}]:`, err.message);
      });
    } else {
      await mcpManager.disconnectServer(config.name);
    }

    res.json(config);
  } catch (error) {
    console.error('Update MCP config error:', error);
    res.status(500).json({ error: 'Server error updating MCP configuration.' });
  }
});

// Toggle MCP server enabled state
router.put('/servers/:id/toggle', verifyToken, async (req, res) => {
  try {
    const config = await McpServer.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'MCP configuration not found.' });
    }

    config.enabled = !config.enabled;
    await config.save();

    if (config.enabled) {
      mcpManager.connectServer(config).catch(err => {
        console.error(`Failed to reconnect MCP server [${config.name}] on toggle:`, err.message);
      });
    } else {
      await mcpManager.disconnectServer(config.name);
    }

    res.json({ message: `Server ${config.enabled ? 'enabled' : 'disabled'} successfully.`, enabled: config.enabled });
  } catch (error) {
    console.error('Toggle MCP state error:', error);
    res.status(500).json({ error: 'Server error toggling MCP connection.' });
  }
});

// Delete MCP server configuration
router.delete('/servers/:id', verifyToken, async (req, res) => {
  try {
    const config = await McpServer.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'MCP configuration not found.' });
    }

    // Kill connection first
    await mcpManager.disconnectServer(config.name);
    
    // Delete database model
    await McpServer.findByIdAndDelete(req.params.id);

    res.json({ message: 'MCP server configuration deleted successfully.' });
  } catch (error) {
    console.error('Delete MCP config error:', error);
    res.status(500).json({ error: 'Server error deleting MCP configuration.' });
  }
});

export default router;
