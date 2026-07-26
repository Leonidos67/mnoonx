// server/models/Community.js
const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  handle: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /**
   * `community` — обычное сообщество.
   * `collaboration` — совместный проект двух авторов (owner + coOwner), без «полного» community-first флоу.
   */
  kind: {
    type: String,
    enum: ['community', 'collaboration'],
    default: 'community',
    index: true,
  },
  /** Второй автор коллаборации (равноправный доступ как у owner) */
  coOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  /**
   * Optional “face” communities for collaborations:
   * show this community instead of the personal profile for owner / coOwner.
   * Must be a non-collaboration community owned by that user.
   */
  ownerDisplayCommunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  coOwnerDisplayCommunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  /** When each member joined this community (owner dashboard) */
  memberJoins: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  memberCount: {
    type: Number,
    default: 1,
  },
  category: {
    type: String,
    enum: [
      'Technology',
      'Business',
      'Education',
      'Finance',
      'Investing',
      'Marketing',
      'Design',
      'Startups',
      'Health',
      'Entertainment',
      'Gaming',
      'Art',
      'Sports',
      'Science',
      'Career',
      'Lifestyle',
      'Crypto',
      'Memecoins',
      'Futures',
      'On-Chain',
      'Airdrops',
      'DeFi',
      'NFT',
      'Other',
    ],
    default: 'Other',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  /** Участники (не владелец) могут публиковать посты в ленте сообщества */
  membersCanPost: {
    type: Boolean,
    default: true,
  },
  /** Optional passphrase required to join (private communities) */
  joinCode: {
    type: String,
    default: '',
    trim: true,
    maxlength: 64,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  /** Установленные приложения (например chat) — синхронизируется с installedAppInstances */
  installedApps: {
    type: [String],
    default: [],
  },
  /** Экземпляры приложений: название, видимость для участников, заметка */
  installedAppInstances: {
    type: [
      {
        id: { type: String, required: true },
        appId: { type: String, required: true },
        title: { type: String, default: 'Chat', trim: true },
        visibleToMembers: { type: Boolean, default: true },
        note: { type: String, default: '', maxlength: 500 },
        archivedAt: { type: Date, default: null },
        stats: {
          opens: { type: Number, default: 0 },
          pageViews: { type: Number, default: 0 },
          clicks: { type: Number, default: 0 },
          lastOpenedAt: { type: Date, default: null },
          daily: {
            type: [
              {
                date: { type: String, required: true },
                opens: { type: Number, default: 0 },
                pageViews: { type: Number, default: 0 },
                clicks: { type: Number, default: 0 },
              },
            ],
            default: [],
          },
        },
      },
    ],
    default: [],
  },
  /** Устарело: при миграции переносится в первый экземпляр chat */
  chatPublic: {
    type: Boolean,
    default: true,
  },
  /** Community admins (owner assigns from About tab) */
  admins: {
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  },
  /** What admins are allowed to do (owner configures in dashboard Settings) */
  adminPermissions: {
    canAccessDashboard: { type: Boolean, default: true },
    canManageMembers: { type: Boolean, default: true },
    canViewAnalytics: { type: Boolean, default: true },
    canManageProducts: { type: Boolean, default: true },
    canManageContent: { type: Boolean, default: true },
    canManageInvites: { type: Boolean, default: true },
    canManagePosts: { type: Boolean, default: true },
    canManageSettings: { type: Boolean, default: false },
    canManageApps: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Community', CommunitySchema);