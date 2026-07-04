import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const tools = [
  {
    name: 'calculate',
    description: 'A math calculator tool. Performs arithmetic operations like addition, subtraction, multiplication, and division.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { 
          type: 'string', 
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'The arithmetic operation to perform.' 
        },
        a: { type: 'number', description: 'First numeric operand' },
        b: { type: 'number', description: 'Second numeric operand' }
      },
      required: ['operation', 'a', 'b']
    }
  },
  {
    name: 'get_system_time',
    description: 'Returns the current local date and time of the host system.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  
  try {
    const request = JSON.parse(trimmed);
    const { id, method, params } = request;
    
    if (method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'mock-math-server',
            version: '1.0.0'
          }
        }
      };
      console.log(JSON.stringify(response));
      return;
    }
    
    if (method === 'notifications/initialized') {
      return; // Handshake notifications require no response
    }
    
    if (method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          tools
        }
      };
      console.log(JSON.stringify(response));
      return;
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      let resultText = '';
      
      if (name === 'calculate') {
        const { operation, a, b } = args;
        let res = 0;
        if (operation === 'add') res = a + b;
        else if (operation === 'subtract') res = a - b;
        else if (operation === 'multiply') res = a * b;
        else if (operation === 'divide') res = b !== 0 ? a / b : 'Error: Division by zero';
        
        resultText = `Calculation result: ${a} ${operation} ${b} = ${res}`;
      } else if (name === 'get_system_time') {
        resultText = `Local host system time: ${new Date().toLocaleString()}`;
      } else {
        resultText = `Error: Tool ${name} not found.`;
      }
      
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: resultText
            }
          ]
        }
      };
      console.log(JSON.stringify(response));
      return;
    }
    
    // Fallback response for unsupported calls
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method ${method} not found`
      }
    };
    console.log(JSON.stringify(response));
    
  } catch (err) {
    console.error('Mock MCP server JSON parse error:', err.message);
  }
});
