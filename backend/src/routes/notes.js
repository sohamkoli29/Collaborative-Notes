import express from 'express';
import Note from '../models/Note.js';
import Share from '../models/Share.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { noteAccess } from '../middleware/noteAccess.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @desc    Get all notes for user
// @route   GET /api/notes
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // Get notes where user is owner or collaborator
    const notes = await Note.find({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    })
    .populate('owner', 'username email')
    .populate('collaborators.user', 'username email')
    .populate('lastEditedBy', 'username')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: notes,
      count: notes.length
    });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes'
    });
  }
});

// @desc    Get single note
// @route   GET /api/notes/:noteId
// @access  Private (with note access)
router.get('/:noteId', noteAccess(), async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email')
      .populate('lastEditedBy', 'username');

    res.json({
      success: true,
      data: note
    });

  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note'
    });
  }
});

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
// @desc    Create a share link for a note
// @route   POST /api/shares
// @access  Private (note owner or collaborator with write access)
// @desc    Create a share link for a note
// @route   POST /api/shares
// @access  Private (note owner or collaborator with write access)
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Note title is required'
      });
    }

    const note = await Note.create({
      title,
      content: content || '',
      owner: userId
    });

    const populatedNote = await Note.findById(note._id)
      .populate('owner', 'username email')
      .populate('lastEditedBy', 'username');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: populatedNote
    });

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note'
    });
  }
});

// @desc    Update note
// @route   PUT /api/notes/:noteId
// @access  Private (with write access)
router.put('/:noteId', noteAccess('write'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    const updateData = {
      lastEditedBy: userId,
      version: req.note.version + 1
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('owner', 'username email')
    .populate('collaborators.user', 'username email')
    .populate('lastEditedBy', 'username');

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
});

// @desc    Delete note
// @route   DELETE /api/notes/:noteId
// @access  Private (owner only)
router.delete('/:noteId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user is owner
    if (note.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only note owner can delete the note'
      });
    }

    await Note.findByIdAndDelete(req.params.noteId);

    // Also delete any shares associated with this note
    await Share.deleteMany({ note: req.params.noteId });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
});

// @desc    Add collaborator to note
// @route   POST /api/notes/:noteId/collaborators
// @access  Private (owner only)
router.post('/:noteId/collaborators', noteAccess('write'), async (req, res) => {
  try {
    const { userId, permission = 'read' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if collaborator already exists
    const existingCollaborator = req.note.collaborators.find(
      collab => collab.user.toString() === userId
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator'
      });
    }

    // Add collaborator
    req.note.collaborators.push({
      user: userId,
      permission
    });

    await req.note.save();

    const updatedNote = await Note.findById(req.note._id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email')
      .populate('lastEditedBy', 'username');

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: updatedNote
    });

  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add collaborator'
    });
  }
});

export default router;