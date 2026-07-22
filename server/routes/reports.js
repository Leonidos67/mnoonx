const express = require('express');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const Post = require('../models/Post');
const User = require('../models/User');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// POST /api/reports — user submits a report
router.post('/', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { targetType, targetId, reason, details } = req.body || {};
    const allowedTypes = ['post', 'user', 'community', 'comment'];
    const allowedReasons = ['spam', 'harassment', 'hate', 'scam', 'nsfw', 'other'];
    if (!allowedTypes.includes(targetType) || !targetId) {
      return res.status(400).json({ message: 'Invalid target' });
    }
    const report = await Report.create({
      reporterId: String(req.userId),
      targetType,
      targetId: String(targetId),
      reason: allowedReasons.includes(reason) ? reason : 'other',
      details: typeof details === 'string' ? details.trim().slice(0, 1000) : '',
    });
    res.status(201).json({ id: report._id.toString(), status: report.status });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Mounted under /api/admin/reports via admin.js — also export handlers
async function listReports(req, res) {
  try {
    const status = String(req.query.status || 'open');
    const filter = status === 'all' ? {} : { status };
    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const enriched = await Promise.all(
      reports.map(async (r) => {
        let preview = null;
        if (r.targetType === 'post') {
          const post = await Post.findById(r.targetId).select('content author createdAt').lean();
          if (post) {
            preview = {
              content: String(post.content || '').slice(0, 200),
              authorId: post.author,
            };
          }
        } else if (r.targetType === 'user') {
          const user = await User.findById(r.targetId).select('username fullName').lean();
          if (user) preview = { username: user.username, fullName: user.fullName };
        }
        return { ...r, id: r._id.toString(), preview };
      }),
    );
    res.json({ reports: enriched });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function patchReport(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Not found' });
    const { status, adminNote, action } = req.body || {};
    if (status && ['open', 'reviewed', 'dismissed', 'actioned'].includes(status)) {
      report.status = status;
    }
    if (typeof adminNote === 'string') {
      report.adminNote = adminNote.slice(0, 1000);
    }
    report.reviewedBy = req.admin?.username || 'admin';
    report.reviewedAt = new Date();

    if (action === 'delete_post' && report.targetType === 'post') {
      await Post.findByIdAndDelete(report.targetId);
      report.status = 'actioned';
    }
    if (action === 'ban_user' && report.targetType === 'user') {
      await User.findByIdAndUpdate(report.targetId, { $set: { isBanned: true } });
      report.status = 'actioned';
    }

    await report.save();
    res.json({ ok: true, status: report.status });
  } catch (error) {
    console.error('Patch report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports.listReports = listReports;
module.exports.patchReport = patchReport;
module.exports.requireAdmin = requireAdmin;
