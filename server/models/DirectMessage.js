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
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);
