const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  kind: {
    type: String,
    enum: ['system_mnoonx', 'system_support', 'dm'],
    required: true,
  },
  peerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lastMessageText: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

ConversationSchema.index(
  { ownerUserId: 1, kind: 1 },
  {
    unique: true,
    partialFilterExpression: { kind: { $in: ['system_mnoonx', 'system_support'] } },
  }
);

ConversationSchema.index(
  { ownerUserId: 1, kind: 1, peerUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { kind: 'dm' },
  }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
