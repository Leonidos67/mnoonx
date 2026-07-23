const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['mention', 'post', 'event', 'community', 'system', 'engagement'],
    default: 'system',
  },
  /** Sub-kind for engagement: follow | like | comment | repost */
  kind: {
    type: String,
    enum: ['follow', 'like', 'comment', 'repost'],
    default: undefined,
  },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  link: { type: String, default: '' },
  /**
   * Dedupes repeated engagement (e.g. like → unlike → like on same post).
   * Unique per user when set.
   */
  dedupeKey: { type: String, default: null, trim: true },
  /** Stable key for welcome/onboarding seeds — prevents duplicate inserts on race. */
  seedKey: { type: String, default: null, trim: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

NotificationSchema.index(
  { userId: 1, seedKey: 1 },
  {
    unique: true,
    partialFilterExpression: { seedKey: { $type: 'string' } },
  }
);

NotificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: 'string' } },
  }
);

NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
