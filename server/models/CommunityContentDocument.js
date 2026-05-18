const mongoose = require('mongoose');

/** Один документ на экземпляр приложения Content в сообществе */
const CommunityContentDocumentSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    title: { type: String, default: 'Unnamed document', trim: true },
    body: { type: String, default: '' },
  },
  { timestamps: true }
);

CommunityContentDocumentSchema.index({ community: 1, appInstanceId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityContentDocument', CommunityContentDocumentSchema);
