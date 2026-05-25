const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true,
  },
  category: {
    type: String,
    enum: ['bug', 'authentication', 'other'],
    required: true,
  },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 500 },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  communityHandle: { type: String, default: '' },
  communityName: { type: String, default: '' },
  appLink: { type: String, default: '', maxlength: 500 },
  attachmentNames: [{ type: String, maxlength: 200 }],
  closedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

SupportTicketSchema.index({ userId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
