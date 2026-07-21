const mongoose = require('mongoose');

const CommunityChatMessageSchema = new mongoose.Schema({
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
    index: true,
  },
  /** Поток чата внутри сообщества (несколько установок Chat) */
  chatInstanceId: {
    type: String,
    default: 'default',
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000,
  },
  /** Сообщение от Community AI (author = owner, отображается botName) */
  isAiBot: {
    type: Boolean,
    default: false,
  },
  aiBotName: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CommunityChatMessage', CommunityChatMessageSchema);
