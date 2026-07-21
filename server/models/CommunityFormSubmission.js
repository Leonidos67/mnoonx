const mongoose = require('mongoose');

const CommunityFormSubmissionSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    answers: {
      type: [
        {
          fieldId: { type: String, required: true },
          value: { type: String, default: '', maxlength: 4000 },
        },
      ],
      default: [],
    },
    submitterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'archived'],
      default: 'new',
    },
  },
  { timestamps: true }
);

CommunityFormSubmissionSchema.index({ community: 1, appInstanceId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityFormSubmission', CommunityFormSubmissionSchema);
