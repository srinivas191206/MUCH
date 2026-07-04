import mongoose from 'mongoose';

const McpServerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['stdio', 'sse'], 
    default: 'stdio' 
  },
  command: { 
    type: String, 
    trim: true 
  }, // For stdio: e.g. "npx" or "node"
  args: { 
    type: [String], 
    default: [] 
  }, // For stdio: e.g. ["-y", "@modelcontextprotocol/server-filesystem", "/Users"]
  url: { 
    type: String, 
    trim: true 
  }, // For sse: e.g. "http://localhost:3001/sse"
  env: { 
    type: Map, 
    of: String, 
    default: {} 
  }, // Environment variables JSON dictionary
  enabled: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export const McpServer = mongoose.model('McpServer', McpServerSchema);
