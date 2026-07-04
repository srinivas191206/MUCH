import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Memory } from '../models/Memory.js';

const router = express.Router();

// GET all memories for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const memories = await Memory.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(memories);
  } catch (err) {
    console.error('Error fetching memories:', err);
    res.status(500).json({ error: 'Failed to fetch memories.' });
  }
});

// POST create memory
router.post('/', verifyToken, async (req, res) => {
  const { content } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Memory content is required.' });
  }

  try {
    const memory = new Memory({
      content: content.trim(),
      userId: req.userId
    });

    await memory.save();
    res.status(201).json(memory);
  } catch (err) {
    console.error('Error creating memory:', err);
    res.status(500).json({ error: 'Failed to create memory.' });
  }
});

// DELETE memory
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Memory.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Memory not found.' });
    }
    res.json({ message: 'Memory successfully deleted.' });
  } catch (err) {
    console.error('Error deleting memory:', err);
    res.status(500).json({ error: 'Failed to delete memory.' });
  }
});

export default router;
