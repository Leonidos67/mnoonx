const mongoose = require('mongoose');

const DirectMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  senderType: {
    type: String,
    enum: ['user', 'system'],
    required: true,
  },
  senderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  body: { type: String, required: true },
  /**
   * Support bot UI: { nodeId, actions: [{ id, label }], expectInput?, ticketCategory?, consumed? }
   */
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  /** Links mirrored copies in DM inboxes (sender + recipient). */
  clientMessageId: {
    type: String,
    default: null,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
  deletedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);
