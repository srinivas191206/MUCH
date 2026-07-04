import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, default: '' },
  fileAttachment: {
    name: { type: String },
    size: { type: Number },
    text: { type: String }
  },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Conversation'
  },
  folderId: {
    type: String,
    default: null
  },
  messages: [MessageSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const Chat = mongoose.model('Chat', ChatSchema);
