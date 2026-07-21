const mongoose = require('mongoose');

/** Мета доски Kanban (колонки) — один документ на экземпляр приложения */
const CommunityKanbanMetaSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    appInstanceId: { type: String, required: true, index: true },
    columns: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true, maxlength: 80 },
          order: { type: Number, default: 0 },
        },
      ],
      default: () => [
        { id: 'todo', title: 'To do', order: 0 },
        { id: 'doing', title: 'In progress', order: 1 },
        { id: 'done', title: 'Done', order: 2 },
      ],
    },
  },
  { timestamps: true }
);

CommunityKanbanMetaSchema.index({ community: 1, appInstanceId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityKanbanMeta', CommunityKanbanMetaSchema);
