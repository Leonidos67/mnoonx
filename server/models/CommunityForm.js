const mongoose = require('mongoose');

/** Одна форма / waitlist на экземпляр приложения Forms (по умолчанию пустая — владелец создаёт) */
const CommunityFormSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    title: { type: String, default: '', trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 4000 },
    thankYouMessage: {
      type: String,
      default: 'Thanks — you are on the list!',
      maxlength: 1000,
    },
    isOpen: { type: Boolean, default: true },
    fields: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true, maxlength: 120 },
          type: {
            type: String,
            enum: ['text', 'email', 'phone', 'textarea'],
            default: 'text',
          },
          required: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

CommunityFormSchema.index({ community: 1, appInstanceId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityForm', CommunityFormSchema);
