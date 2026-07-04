import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  systemPrompt: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '🤖'
  },
  provider: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
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

export const Agent = mongoose.model('Agent', AgentSchema);
