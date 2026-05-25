const express = require('express');
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const SupportTicketMessage = require('../models/SupportTicketMessage');
const User = require('../models/User');
const Community = require('../models/Community');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use((req, res, next) => {
  if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
  next();
});

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

router.get('/apps', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('ownedCommunities joinedCommunities')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const idSet = new Set();
    (user.ownedCommunities || []).forEach((id) => idSet.add(id.toString()));
    (user.joinedCommunities || []).forEach((id) => idSet.add(id.toString()));
    const ids = [...idSet].map((id) => new mongoose.Types.ObjectId(id));

    if (ids.length === 0) {
      return res.json({ apps: [] });
    }

    const communities = await Community.find({ _id: { $in: ids } })
      .select('name handle avatar updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      apps: communities.map((c) => ({
        id: c._id.toString(),
        name: c.name || c.handle || 'untitled',
        handle: c.handle,
        avatar: c.avatar || '',
        editedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    console.error('Support apps error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const statusFilter = String(req.query.status || 'all');
    const query = { userId: req.userId };
    if (statusFilter === 'open' || statusFilter === 'closed') {
      query.status = statusFilter;
    }

    const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 }).lean();

    const openCount = await SupportTicket.countDocuments({ userId: req.userId, status: 'open' });
    const closedCount = await SupportTicket.countDocuments({ userId: req.userId, status: 'closed' });

    res.json({
      tickets: tickets.map(serializeTicket),
      counts: { open: openCount, closed: closedCount, all: openCount + closedCount },
    });
  } catch (err) {
    console.error('Support tickets list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const {
      category,
      description,
      communityId,
      communityHandle,
      communityName,
      appLink,
      attachmentNames,
    } = req.body || {};

    const cat = String(category || '').trim();
    if (!['bug', 'authentication', 'other'].includes(cat)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const desc = String(description || '').trim();
    if (!desc || desc.length > 500) {
      return res.status(400).json({ message: 'Description is required (max 500 characters)' });
    }

    const title =
      desc.length > 120 ? `${desc.slice(0, 117).trim()}...` : desc;

    let commHandle = String(communityHandle || '').trim();
    let commName = String(communityName || '').trim();
    let commId = null;
    let link = String(appLink || '').trim();

    if (communityId && mongoose.Types.ObjectId.isValid(communityId)) {
      const comm = await Community.findById(communityId).select('handle name').lean();
      if (comm) {
        commId = comm._id;
        commHandle = comm.handle || commHandle;
        commName = comm.name || commName;
        if (!link && commHandle) {
          const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
          link = `${origin}/community/${commHandle}`;
        }
      }
    }

    const names = Array.isArray(attachmentNames)
      ? attachmentNames.map((n) => String(n).slice(0, 200)).filter(Boolean).slice(0, 10)
      : [];

    const ticket = await SupportTicket.create({
      userId: req.userId,
      category: cat,
      title,
      description: desc,
      communityId: commId,
      communityHandle: commHandle,
      communityName: commName,
      appLink: link,
      attachmentNames: names,
    });

    const user = await User.findById(req.userId).select('fullName username').lean();
    const displayName = user?.fullName || user?.username || 'there';

    let userBody = desc;
    if (commName || commId || link) {
      userBody += '\n\n';
      if (commName) userBody += `App: ${commName}`;
      if (commId) userBody += ` (ID: ${commId.toString()})`;
      if (link) userBody += `\nApp Link: ${link}`;
    }
    if (names.length) {
      userBody += `\nAttachments: ${names.join(', ')}`;
    }

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

    res.status(201).json({ ticket: serializeTicket(ticket.toObject()) });
  } catch (err) {
    console.error('Support ticket create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tickets/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const messages = await SupportTicketMessage.find({ ticketId: ticket._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      ticket: serializeTicket(ticket),
      messages: messages.map((m) => ({
        id: m._id.toString(),
        sender: m.senderType,
        text: m.body,
        timestamp: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('Support ticket detail error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/tickets/:id/messages', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    const text = String(req.body?.body || '').trim();
    if (!text || text.length > 500) {
      return res.status(400).json({ message: 'Message is required (max 500 characters)' });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Ticket is closed' });
    }

    const msg = await SupportTicketMessage.create({
      ticketId: ticket._id,
      senderType: 'user',
      body: text,
    });

    ticket.updatedAt = msg.createdAt;
    await ticket.save();

    res.status(201).json({
      message: {
        id: msg._id.toString(),
        sender: 'user',
        text: msg.body,
        timestamp: msg.createdAt,
      },
    });
  } catch (err) {
    console.error('Support ticket message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/tickets/:id/close', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'closed') {
      return res.json({ ticket: serializeTicket(ticket.toObject()) });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.updatedAt = ticket.closedAt;
    await ticket.save();

    res.json({ ticket: serializeTicket(ticket.toObject()) });
  } catch (err) {
    console.error('Support ticket close error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
