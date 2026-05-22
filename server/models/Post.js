// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: String, // ID автора
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  media: [{
    type: String
  }],
  /** Optional link card: title + url (community path or external) */
  linkAttachment: {
    title: { type: String, default: '', maxlength: 120 },
    url: { type: String, default: '', maxlength: 500 },
  },
  likes: [{
    type: String // ID пользователей которые лайкнули
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    likes: [{
      type: String
    }],
    likesCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  reposts: [{
    type: String // ID пользователей которые репостнули
  }],
  repostsCount: {
    type: Number,
    default: 0
  },
  views: [{
    type: String // ID пользователей которые просмотрели
  }],
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  bookmarks: [{
    type: String
  }],
  bookmarksCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ community: 1, isPrivate: 1, createdAt: -1 });

// Middleware: обновляем счетчик постов пользователя
postSchema.post('save', async function() {
  if (this.isNew) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.author, {
      $inc: { postsCount: 1 }
    });
  }
});

// Метод для добавления просмотра
postSchema.methods.addView = async function(userId) {
  if (userId && !this.views.includes(userId)) {
    this.views.push(userId);
    this.viewsCount = this.views.length;
    await this.save();
  } else if (!this.viewsCount) {
    this.viewsCount = this.views.length;
    await this.save();
  }
};

// Метод для лайка
postSchema.methods.toggleLike = async function(userId) {
  const uid = String(userId);
  const index = this.likes.findIndex((id) => String(id) === uid);
  if (index === -1) {
    this.likes.push(uid);
  } else {
    this.likes.splice(index, 1);
  }
  this.likesCount = this.likes.length;
  await this.save();
  return index === -1; // true = liked, false = unliked
};

module.exports = mongoose.model('Post', postSchema);