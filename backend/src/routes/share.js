import express from 'express';
import Share from '../models/Share.js';
import Note from '../models/Note.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { noteAccess } from '../middleware/noteAccess.js';

const router = express.Router();

// Create a new share - REQUIRES AUTH
router.post('/', authMiddleware, async (req, res) => {
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

// Get shares by noteId - REQUIRES AUTH
router.get('/note/:noteId', authMiddleware, noteAccess('read'), async (req, res) => {
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

// Get share by token (PUBLIC ROUTE - NO AUTH REQUIRED)
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Share token is required' });
    }

    const share = await Share.findOne({ shareToken: token })
      .populate('sharedBy', 'username email')
      .populate('note', 'title content');

    if (!share) {
      return res.status(404).json({ success: false, message: 'Share not found' });
    }

    // Check if share is expired
    if (share.isExpired()) {
      return res.status(410).json({ success: false, message: 'This share link has expired' });
    }

    // Increment access count
    share.accessCount += 1;
    share.lastAccessed = new Date();
    await share.save();

    res.json({
      success: true,
      data: share
    });
  } catch (error) {
    console.error('Get share by token error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch share' });
  }
});

// Accept share (REQUIRES AUTH)
router.post('/accept/:token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.userId;

    console.log('Accepting share with token:', token, 'for user:', userId);

    if (!token) {
      return res.status(400).json({ success: false, message: 'Share token is required' });
    }

    const share = await Share.findOne({ shareToken: token })
      .populate('note');

    if (!share) {
      return res.status(404).json({ success: false, message: 'Share not found' });
    }

    // Check if share is expired
    if (share.isExpired()) {
      return res.status(410).json({ success: false, message: 'This share link has expired' });
    }

    const note = await Note.findById(share.note._id);
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    console.log('Found note:', note._id, 'Current collaborators:', note.collaborators);

    // Check if user already has access
    const existingCollaborator = note.collaborators.find(
      collab => collab.user && collab.user.toString() === userId
    );

    if (!existingCollaborator) {
      console.log('Adding user as collaborator with permission:', share.permission);
      // Add user as collaborator
      note.collaborators.push({
        user: userId,
        permission: share.permission,
        addedBy: share.sharedBy
      });
      await note.save();
      console.log('User added as collaborator successfully');
    } else {
      console.log('User already has access to this note');
    }

    // Increment accepted count
    share.acceptedCount += 1;
    await share.save();

    res.json({
      success: true,
      message: 'Successfully joined the note',
      data: {
        note: {
          _id: note._id,
          title: note.title
        },
        share
      }
    });
  } catch (error) {
    console.error('Accept share error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept share' });
  }
});

export default router;