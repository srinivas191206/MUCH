import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Preset } from '../models/Preset.js';

const router = express.Router();

// GET all presets for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const presets = await Preset.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(presets);
  } catch (err) {
    console.error('Error fetching presets:', err);
    res.status(500).json({ error: 'Failed to fetch presets.' });
  }
});

// POST create preset
router.post('/', verifyToken, async (req, res) => {
  const { title, provider, model, temperature, maxTokens, topP } = req.body;
  
  if (!title || !provider || !model) {
    return res.status(400).json({ error: 'Title, provider, and model are required.' });
  }

  try {
    const preset = new Preset({
      title,
      provider,
      model,
      temperature: temperature !== undefined ? temperature : 0.7,
      maxTokens: maxTokens !== undefined ? maxTokens : 2048,
      topP: topP !== undefined ? topP : 0.9,
      userId: req.userId
    });

    await preset.save();
    res.status(201).json(preset);
  } catch (err) {
    console.error('Error creating preset:', err);
    res.status(500).json({ error: 'Failed to create preset.' });
  }
});

// DELETE preset
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Preset.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Preset not found.' });
    }
    res.json({ message: 'Preset successfully deleted.' });
  } catch (err) {
    console.error('Error deleting preset:', err);
    res.status(500).json({ error: 'Failed to delete preset.' });
  }
});

export default router;
