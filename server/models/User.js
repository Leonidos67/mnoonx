// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    default: '',
    maxlength: 100
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  socialLinks: {
    twitter: { type: String, default: '', maxlength: 120 },
    telegram: { type: String, default: '', maxlength: 120 },
    instagram: { type: String, default: '', maxlength: 120 },
    youtube: { type: String, default: '', maxlength: 120 },
    tiktok: { type: String, default: '', maxlength: 120 },
    discord: { type: String, default: '', maxlength: 120 },
  },
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  ownedCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  }],
  joinedCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  },
  /** Premium profile: status badge icon id/url (future) */
  profileStatusIcon: {
    type: String,
    default: '',
    maxlength: 200,
  },
  /** Hex color for display name, e.g. #7c3aed */
  profileNameColor: {
    type: String,
    default: '',
    maxlength: 32,
  },
  /** Single emoji repeated as profile header background decor */
  profileBgEmoji: {
    type: String,
    default: '',
    maxlength: 16,
  },
  /** none | solid | gradient — header fill bottom-left → top-right */
  profileBgMode: {
    type: String,
    enum: ['none', 'solid', 'gradient'],
    default: 'none',
  },
  profileBgColor: {
    type: String,
    default: '',
    maxlength: 32,
  },
  profileBgColor2: {
    type: String,
    default: '',
    maxlength: 32,
  },
  /** Who can invite this user into a collaboration */
  collaborationPrivacy: {
    type: String,
    enum: ['everyone', 'friends', 'request', 'off'],
    default: 'everyone',
  },
  /** In-app / push notification toggles (synced from client) */
  notificationPreferences: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
  },
  /** Activity gamification state (synced from client) */
  activityState: {
    balance: { type: Number, default: 0 },
    log: { type: [mongoose.Schema.Types.Mixed], default: [] },
    claimedRuleIds: { type: [String], default: [] },
    streak: { type: Number, default: 0 },
    lastDailyVisit: { type: String, default: '' },
  },
  /** Post-signup welcome wizard (false only for newly registered users) */
  welcomeOnboardingCompleted: {
    type: Boolean,
    default: true,
  },
  welcomeOnboarding: {
    source: { type: String, default: '' },
    goals: { type: [String], default: [] },
    completedAt: { type: Date, default: null },
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: '',
    select: false,
  },
  twoFactorPendingSecret: {
    type: String,
    default: '',
    select: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  /** Users this account has blocked (user-to-user, not admin ban) */
  blockedUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  passwordResetHash: {
    type: String,
    default: '',
    select: false,
  },
  passwordResetExpiresAt: {
    type: Date,
    default: null,
    select: false,
  },
  passwordResetLastSentAt: {
    type: Date,
    default: null,
    select: false,
  },
}, {
  timestamps: true // createdAt и updatedAt
});

// Хеширование пароля
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Метод сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ИСПРАВЛЕННОЕ виртуальное поле
userSchema.virtual('joinedDate').get(function() {
  // Проверяем что createdAt существует
  if (!this.createdAt) {
    return 'Unknown';
  }
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  try {
    const date = new Date(this.createdAt);
    // Проверяем что дата валидна
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (error) {
    return 'Unknown';
  }
});

// ВАЖНО: включаем виртуальные поля в JSON
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.twoFactorSecret;
    delete ret.twoFactorPendingSecret;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);