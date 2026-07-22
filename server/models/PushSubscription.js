const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 300,
    },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
