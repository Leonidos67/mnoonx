const SupportTicket = require('../models/SupportTicket');
const SupportTicketMessage = require('../models/SupportTicketMessage');
const User = require('../models/User');

const CATEGORY_LABELS = {
  bug: 'Bug Report',
  authentication: 'Authentication',
  other: 'Other',
};

function ticketShortId(id) {
  return String(id).slice(-8);
}

function buildAssistantReply(userName, category) {
  const cat = CATEGORY_LABELS[category] || 'your request';
  return (
    `Hey ${userName}! Thanks for reaching out about your ${cat.toLowerCase()}.\n\n` +
    'To help us resolve this quickly, could you share:\n\n' +
    '• What were you trying to do?\n' +
    '• What went wrong?\n' +
    '• How can we reproduce it?\n\n' +
    'Feel free to add screenshots or extra details. A support specialist may join this thread shortly.'
  );
}

function serializeTicket(doc) {
  const id = doc._id.toString();
  return {
    id,
    shortId: ticketShortId(id),
    status: doc.status,
    category: doc.category,
    categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
    title: doc.title,
    description: doc.description,
    communityId: doc.communityId ? doc.communityId.toString() : null,
    communityHandle: doc.communityHandle || '',
    communityName: doc.communityName || '',
    appLink: doc.appLink || '',
    appLabel: doc.communityName || doc.communityHandle || (doc.appLink ? 'App' : ''),
    attachmentNames: doc.attachmentNames || [],
    plan: 'Free',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    closedAt: doc.closedAt,
  };
}

/**
 * Create a support ticket from messenger bot escalation.
 * @returns {{ ticket: object, shortId: string }}
 */
async function createMessengerSupportTicket({ userId, category, description }) {
  const cat = ['bug', 'authentication', 'other'].includes(category) ? category : 'other';
  let desc = String(description || '').trim();
  if (!desc) {
    const err = new Error('Description required');
    err.status = 400;
    throw err;
  }
  if (desc.length > 500) desc = desc.slice(0, 500);

  const title = desc.length > 120 ? `${desc.slice(0, 117).trim()}...` : desc;

  const ticket = await SupportTicket.create({
    userId,
    category: cat,
    title,
    description: desc,
  });

  const user = await User.findById(userId).select('fullName username').lean();
  const displayName = user?.fullName || user?.username || 'there';

  const userBody = `[Via Messenger Support bot]\n\n${desc}`;

  await SupportTicketMessage.create({
    ticketId: ticket._id,
    senderType: 'user',
    body: userBody,
  });

  await SupportTicketMessage.create({
    ticketId: ticket._id,
    senderType: 'assistant',
    body: buildAssistantReply(displayName, cat),
  });

  ticket.updatedAt = new Date();
  await ticket.save();

  return {
    ticket: serializeTicket(ticket.toObject()),
    shortId: ticketShortId(ticket._id),
  };
}

module.exports = {
  CATEGORY_LABELS,
  ticketShortId,
  buildAssistantReply,
  serializeTicket,
  createMessengerSupportTicket,
};
