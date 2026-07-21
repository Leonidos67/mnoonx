const mongoose = require('mongoose');

/** История диалога / анализов в панели Community AI */
const CommunityAiMessageSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 16000 },
    kind: { type: String, enum: ['chat', 'analysis', 'onboarding'], default: 'chat' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    /** Для kind=onboarding — привязка к конкретному участнику */
    onboardingUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true }
);

CommunityAiMessageSchema.index({ community: 1, appInstanceId: 1, createdAt: 1 });

module.exports = mongoose.model('CommunityAiMessage', CommunityAiMessageSchema);
