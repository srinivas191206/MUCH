import express from 'express';
import { Chat } from '../models/Chat.js';
import { Folder } from '../models/Folder.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth protection globally to all routes in this router
router.use(verifyToken);

// ==========================================================================
// Folders API
// ==========================================================================

// Get all folders
router.get('/folders', async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.userId });
    res.json(folders);
  } catch (error) {
    console.error('Fetch folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders.' });
  }
});

// Upsert folder (Create or update name)
router.post('/folders', async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Folder id and name are required.' });
    }

    const folder = await Folder.findOneAndUpdate(
      { id, userId: req.userId },
      { name },
      { new: true, upsert: true }
    );

    res.json(folder);
  } catch (error) {
    console.error('Upsert folder error:', error);
    res.status(500).json({ error: 'Failed to save folder.' });
  }
});

// Delete folder
router.delete('/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Folder.deleteOne({ id, userId: req.userId });
    
    // Unlink chats that belong to this folder
    await Chat.updateMany({ folderId: id, userId: req.userId }, { folderId: null });

    res.json({ message: 'Folder deleted successfully.' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder.' });
  }
});

// ==========================================================================
// Chats API
// ==========================================================================

// Get all chats
router.get('/chats', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Fetch chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats.' });
  }
});

// Upsert chat (Create or update complete messages/title)
router.post('/chats', async (req, res) => {
  try {
    const { id, title, folderId, messages } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Chat id is required.' });
    }

    const updatedData = {
      title: title || 'New Conversation',
      folderId: folderId || null,
      messages: messages || [],
      updatedAt: new Date()
    };

    const chat = await Chat.findOneAndUpdate(
      { id, userId: req.userId },
      updatedData,
      { new: true, upsert: true }
    );

    res.json(chat);
  } catch (error) {
    console.error('Upsert chat error:', error);
    res.status(500).json({ error: 'Failed to save chat.' });
  }
});

// Delete chat
router.delete('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Chat.deleteOne({ id, userId: req.userId });
    res.json({ message: 'Chat deleted successfully.' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat.' });
  }
});

export default router;
