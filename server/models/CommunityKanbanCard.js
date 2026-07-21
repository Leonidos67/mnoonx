const mongoose = require('mongoose');

const CommunityKanbanCardSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    columnId: { type: String, required: true, index: true, maxlength: 40 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 4000 },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

CommunityKanbanCardSchema.index({ community: 1, appInstanceId: 1, columnId: 1, order: 1 });

module.exports = mongoose.model('CommunityKanbanCard', CommunityKanbanCardSchema);
