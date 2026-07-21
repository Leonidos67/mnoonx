const mongoose = require('mongoose');

/** Прогресс AI-онбординга участника в экземпляре Community AI */
const CommunityAiOnboardingSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },
    completedStepIds: { type: [String], default: [] },
    welcomeMessage: { type: String, default: '', maxlength: 8000 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommunityAiOnboardingSchema.index(
  { community: 1, appInstanceId: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model('CommunityAiOnboarding', CommunityAiOnboardingSchema);
