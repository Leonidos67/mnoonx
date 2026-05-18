const mongoose = require('mongoose');

const CommunityEventSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    appInstanceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      default: '',
      maxlength: 8000,
    },
    imageUrl: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'Europe/Moscow',
      maxlength: 120,
    },
    repeatRule: {
      type: String,
      default: 'none',
      maxlength: 80,
    },
    locationType: {
      type: String,
      enum: ['place', 'online'],
      default: 'online',
    },
    locationLabel: {
      type: String,
      default: 'Google Meet (Online)',
      maxlength: 200,
    },
    locationAddress: {
      type: String,
      default: '',
      maxlength: 500,
    },
    hostUserId: {
      type: String,
      required: true,
    },
    allowRsvp: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CommunityEventSchema.index({ community: 1, appInstanceId: 1, startsAt: 1 });

module.exports = mongoose.model('CommunityEvent', CommunityEventSchema);
