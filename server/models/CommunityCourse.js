const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Lesson 1', trim: true },
    lessonType: { type: String, default: 'multimedia' },
    videoEmbedUrl: { type: String, default: '' },
    content: { type: String, default: '' },
    /** Inline images (URL or data URL), shown in lesson body */
    images: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    dripLabel: { type: String, default: 'Unlocks immediately' },
  },
  { _id: true }
);

const ChapterSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Chapter 1', trim: true },
    order: { type: Number, default: 0 },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: true }
);

const CommunityCourseSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isHidden: { type: Boolean, default: false },
    coverUrl: { type: String, default: '' },
    chapters: { type: [ChapterSchema], default: [] },
  },
  { timestamps: true }
);

CommunityCourseSchema.index({ community: 1, appInstanceId: 1 });

module.exports = mongoose.model('CommunityCourse', CommunityCourseSchema);
