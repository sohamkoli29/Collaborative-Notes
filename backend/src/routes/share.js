import express from 'express';
import Share from '../models/Share.js';
import Note from '../models/Note.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { noteAccess } from '../middleware/noteAccess.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new share
router.post('/', async (req, res) => {
  try {
    const { noteId, permission = 'read', expiresAt, maxAccesses, isPublic = false } = req.body;
    const userId = req.userId;

    if (!noteId) {
      return res.status(400).json({ success: false, message: 'Note ID is required' });
    }

    const note = await Note.findOne({
      _id: noteId,
      $or: [
        { owner: userId },
        { 'collaborators.user': userId, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(403).json({ success: false, message: 'No write access to this note' });
    }

    const share = new Share({
      note: noteId,
      sharedBy: userId,
      permission,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxAccesses: maxAccesses || null,
      isPublic
    });

    share.generateShareToken();
    await share.save();

    const populatedShare = await Share.findById(share._id)
      .populate('sharedBy', 'username email')
      .populate('note', 'title');

    res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: populatedShare
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ success: false, message: 'Failed to create share link' });
  }
});

// Get shares by noteId
router.get('/note/:noteId', noteAccess('read'), async (req, res) => {
  try {
    const noteId = req.params.noteId;
    if (!noteId) {
      return res.status(400).json({ success: false, message: 'Note ID is required' });
    }

    const shares = await Share.find({ note: noteId })
      .populate('sharedBy', 'username email');

    res.json({ success: true, data: shares, count: shares.length });
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shares' });
  }
});

export default router;
