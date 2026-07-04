import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Agent } from '../models/Agent.js';

const router = express.Router();

// GET all custom agents for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const agents = await Agent.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(agents);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ error: 'Failed to fetch agents.' });
  }
});

// POST create custom agent
router.post('/', verifyToken, async (req, res) => {
  const { name, description, systemPrompt, avatar, provider, model } = req.body;
  
  if (!name || !systemPrompt || !provider || !model) {
    return res.status(400).json({ error: 'Name, systemPrompt, provider, and model are required.' });
  }

  try {
    const agent = new Agent({
      name,
      description,
      systemPrompt,
      avatar: avatar || '🤖',
      provider,
      model,
      userId: req.userId
    });

    await agent.save();
    res.status(201).json(agent);
  } catch (err) {
    console.error('Error creating agent:', err);
    res.status(500).json({ error: 'Failed to create agent.' });
  }
});

// PUT update custom agent
router.put('/:id', verifyToken, async (req, res) => {
  const { name, description, systemPrompt, avatar, provider, model } = req.body;

  try {
    const agent = await Agent.findOne({ _id: req.params.id, userId: req.userId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    if (name) agent.name = name;
    if (description !== undefined) agent.description = description;
    if (systemPrompt) agent.systemPrompt = systemPrompt;
    if (avatar) agent.avatar = avatar;
    if (provider) agent.provider = provider;
    if (model) agent.model = model;
    
    agent.updatedAt = Date.now();

    await agent.save();
    res.json(agent);
  } catch (err) {
    console.error('Error updating agent:', err);
    res.status(500).json({ error: 'Failed to update agent.' });
  }
});

// DELETE custom agent
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Agent.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Agent not found.' });
    }
    res.json({ message: 'Agent successfully deleted.' });
  } catch (err) {
    console.error('Error deleting agent:', err);
    res.status(500).json({ error: 'Failed to delete agent.' });
  }
});

export default router;
