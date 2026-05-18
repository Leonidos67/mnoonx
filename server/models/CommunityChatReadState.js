const mongoose = require('mongoose');

/** Курсор прочтения чата для пользователя (для непрочитанных и read receipts). */
const CommunityChatReadStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    chatInstanceId: {
      type: String,
      required: true,
      index: true,
    },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

CommunityChatReadStateSchema.index({ user: 1, community: 1, chatInstanceId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityChatReadState', CommunityChatReadStateSchema);
