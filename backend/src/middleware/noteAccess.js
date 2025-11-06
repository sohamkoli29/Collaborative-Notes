import Note from '../models/Note.js';
import Share from '../models/Share.js';

export const noteAccess = (permission = 'read') => {
  return async (req, res, next) => {
    try {
      const { noteId } = req.params;
      const userId = req.userId;

      if (!noteId) {
        return res.status(400).json({
          success: false,
          message: 'Note ID is required'
        });
      }

      // Find the note
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      // Check if user is owner
      if (note.owner.toString() === userId.toString()) {
        req.note = note;
        return next();
      }

      // Check if user has access through sharing
      const share = await Share.findOne({
        note: noteId,
        $or: [
          { sharedWith: userId },
          { isPublic: true }
        ]
      });

      if (!share) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this note'
        });
      }

      // Check permission level
      if (permission === 'write' && share.permission === 'read') {
        return res.status(403).json({
          success: false,
          message: 'Write access required for this operation'
        });
      }

      req.note = note;
      req.share = share;
      next();

    } catch (error) {
      console.error('Note access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};