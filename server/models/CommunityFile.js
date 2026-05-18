const mongoose = require('mongoose');

/** Файл, прикреплённый к экземпляру приложения Files в сообществе */
const CommunityFileSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    /** Путь относительно каталога server/uploads (POSIX, без ведущего слеша) */
    relativePath: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CommunityFileSchema.index({ community: 1, appInstanceId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityFile', CommunityFileSchema);
