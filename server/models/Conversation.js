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
  lastMessageSenderType: {
    type: String,
    enum: ['user', 'system'],
    default: null,
  },
  lastMessageSenderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  /** When set, hidden from this user's inbox (soft delete) */
  hiddenAt: { type: Date, default: null },
  /**
   * Support bot pending state, e.g.
   * { expectInput: 'ticket_description', ticketCategory: 'bug', locale: 'ru' }
   */
  botState: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
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
