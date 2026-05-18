const mongoose = require('mongoose');

const announcementCommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const communityAnnouncementSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 400 },
    body: { type: String, default: '', maxlength: 50000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [announcementCommentSchema],
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

communityAnnouncementSchema.index({ community: 1, appInstanceId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityAnnouncement', communityAnnouncementSchema);
