const mongoose = require('mongoose');

/** Состояние мастера настройки для экземпляра Announcements */
const communityAnnouncementMetaSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true },
    wizardComplete: { type: Boolean, default: false },
    templateKey: { type: String, default: '' },
    audienceSize: { type: String, default: '' },
  },
  { timestamps: true }
);

communityAnnouncementMetaSchema.index({ community: 1, appInstanceId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityAnnouncementMeta', communityAnnouncementMetaSchema);
