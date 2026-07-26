const mongoose = require('mongoose');

const CollaborationRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    /** Who should be primary owner when accepted: inviter (fromUser) or partner (toUser) */
    primaryCreator: {
      type: String,
      enum: ['inviter', 'partner'],
      default: 'inviter',
    },
    /** Optional face communities (owned by fromUser / toUser respectively) */
    fromDisplayCommunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    toDisplayCommunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
  },
  { timestamps: true }
);

CollaborationRequestSchema.index(
  { fromUser: 1, toUser: 1, status: 1 },
  { partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('CollaborationRequest', CollaborationRequestSchema);
