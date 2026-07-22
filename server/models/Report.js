const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: ['post', 'user', 'community', 'comment'],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'hate', 'scam', 'nsfw', 'other'],
      default: 'other',
    },
    details: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'dismissed', 'actioned'],
      default: 'open',
      index: true,
    },
    adminNote: { type: String, default: '', maxlength: 1000 },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
