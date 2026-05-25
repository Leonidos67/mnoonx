const mongoose = require('mongoose');

const SupportTicketMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true,
  },
  senderType: {
    type: String,
    enum: ['user', 'assistant', 'support'],
    required: true,
  },
  body: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('SupportTicketMessage', SupportTicketMessageSchema);
