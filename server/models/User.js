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
  }
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
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);