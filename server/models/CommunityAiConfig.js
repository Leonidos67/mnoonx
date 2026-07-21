const mongoose = require('mongoose');

/** Настройки AI-приложения на экземпляр (API-ключ владельца + поведение бота) */
const CommunityAiConfigSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    /** Gemini или OpenAI API key — только на сервере, клиенту отдаём маску */
    apiKey: { type: String, default: '', select: false },
    provider: { type: String, enum: ['gemini', 'openai'], default: 'gemini' },
    model: { type: String, default: 'gemini-2.0-flash-lite', trim: true },
    botName: { type: String, default: 'Community AI', trim: true, maxlength: 80 },
    systemPrompt: {
      type: String,
      default:
        'You are a helpful community assistant. Answer based on community context. Be concise, friendly, and accurate. If unsure, say so.',
      maxlength: 8000,
    },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 1024, min: 64, max: 4096 },
    /** Участники могут писать боту в панели AI */
    chatEnabled: { type: Boolean, default: true },
    /** Учитывать посты сообщества в контексте */
    analyzePostsEnabled: { type: Boolean, default: true },
    /** Учитывать сообщения чата в контексте */
    analyzeChatEnabled: { type: Boolean, default: true },
    /** Автоответы в привязанном чате сообщества */
    autoReplyInChat: { type: Boolean, default: false },
    linkedChatInstanceId: { type: String, default: '' },
    /** Если true — отвечать только при упоминании имени бота */
    replyOnlyWhenMentioned: { type: Boolean, default: true },
    contextPostLimit: { type: Number, default: 25, min: 0, max: 80 },
    contextChatLimit: { type: Number, default: 40, min: 0, max: 100 },
    responseLanguage: { type: String, default: 'auto', trim: true, maxlength: 40 },
    /** AI Onboarding — приветствие и чеклист для новых участников */
    onboardingEnabled: { type: Boolean, default: false },
    onboardingWelcomePrompt: {
      type: String,
      default:
        'Welcome the new member warmly. Briefly explain what this community is about, key rules, and how to get started. Invite them to ask questions.',
      maxlength: 4000,
    },
    onboardingRulesText: {
      type: String,
      default: '',
      maxlength: 6000,
    },
    onboardingSteps: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true, maxlength: 120 },
          description: { type: String, default: '', maxlength: 400 },
        },
      ],
      default: () => [
        {
          id: 'rules',
          title: 'Read the community rules',
          description: 'Ask the AI guide if anything is unclear.',
        },
        {
          id: 'intro',
          title: 'Introduce yourself',
          description: 'Tell the AI a bit about yourself or your goals.',
        },
        {
          id: 'explore',
          title: 'Explore the feed and apps',
          description: 'Open Home and installed apps to look around.',
        },
        {
          id: 'chat',
          title: 'Say hello in community chat',
          description: 'Post a short intro in the linked chat if available.',
        },
      ],
    },
    /** Публиковать приветствие AI в привязанный чат при вступлении */
    onboardingPostToChat: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CommunityAiConfigSchema.index({ community: 1, appInstanceId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityAiConfig', CommunityAiConfigSchema);
