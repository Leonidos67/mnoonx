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
    enum: ['mention', 'post', 'event', 'community', 'system'],
    default: 'system',
  },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  link: { type: String, default: '' },
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

module.exports = mongoose.model('Notification', NotificationSchema);
