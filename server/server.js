import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routers
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/chats.js';
import aiRoutes from './routes/ai.js';
import agentRoutes from './routes/agents.js';
import presetRoutes from './routes/presets.js';
import memoryRoutes from './routes/memories.js';
import adminRoutes from './routes/admin.js';
import mcpRoutes from './routes/mcp.js';
import imageRoutes from './routes/image.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as mcpManager from './services/mcpManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/much-database';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    mcpManager.initialize().catch(err => console.error('MCP boot error:', err));
  })
  .catch((err) => console.error('MongoDB database connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/image', imageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Much Backend is running smoothly.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
