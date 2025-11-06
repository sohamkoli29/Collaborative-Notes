import Note from '../models/Note.js';
import OperationalTransform from '../utils/ot.js';

export const noteHandlers = (socket, socketServer) => {
  // Join a note room for collaboration
  socket.on('join-note', async (data) => {
    try {
      const { noteId } = data;
      
      if (!noteId) {
        socket.emit('error', { message: 'Note ID is required' });
        return;
      }

      // Verify user has access to the note
      const note = await Note.findOne({
        _id: noteId,
        $or: [
          { owner: socket.userId },
          { 'collaborators.user': socket.userId }
        ]
      });

      if (!note) {
        socket.emit('error', { message: 'Access denied to this note' });
        return;
      }

      // Join the note room
      socketServer.joinNoteRoom(socket, noteId);
      socket.currentNoteId = noteId;

      console.log(`User ${socket.user.username} joined note ${noteId}`);

      // Send current note state
      socket.emit('note-joined', {
        noteId,
        content: note.content,
        version: note.version,
        title: note.title
      });

    } catch (error) {
      console.error('Error joining note:', error);
      socket.emit('error', { message: 'Failed to join note' });
    }
  });

  // Leave a note room
  socket.on('leave-note', (data) => {
    const { noteId } = data;
    
    if (noteId && socket.currentNoteId === noteId) {
      socketServer.leaveNoteRoom(socket, noteId);
      socket.currentNoteId = null;
      console.log(`User ${socket.user.username} left note ${noteId}`);
    }
  });

  // Handle text changes in real-time
  socket.on('text-change', async (data) => {
    try {
      const { noteId, changes, version, clientId } = data;
      
      if (!noteId || !changes) {
        return;
      }

      // Verify user is in the note room
      if (socket.currentNoteId !== noteId) {
        socket.emit('error', { message: 'Not in note room' });
        return;
      }

      // Get current note state
      const note = await Note.findById(noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      // Simple version conflict resolution
      if (version < note.version) {
        // Client is behind, send latest version
        socket.emit('version-conflict', {
          currentVersion: note.version,
          currentContent: note.content
        });
        return;
      }

      // Apply changes to note content
      let newContent = note.content;
      
      if (changes.type === 'full') {
        newContent = changes.content;
      } else if (changes.type === 'patch') {
        try {
          newContent = OperationalTransform.applyPatch(note.content, changes.patch);
        } catch (patchError) {
          console.error('Error applying patch:', patchError);
          // Fallback to full content sync
          socket.emit('sync-required', { content: note.content });
          return;
        }
      }

      // Update note in database
      const updatedNote = await Note.findByIdAndUpdate(
        noteId,
        {
          content: newContent,
          version: note.version + 1,
          lastEditedBy: socket.userId
        },
        { new: true }
      ).populate('lastEditedBy', 'username');

      // Broadcast changes to all other users in the room
      socket.to(noteId).emit('text-change', {
        noteId,
        changes,
        version: updatedNote.version,
        userId: socket.userId,
        username: socket.user.username,
        clientId, // To prevent echo for the sender
        timestamp: new Date().toISOString()
      });

      // Send confirmation to sender
      socket.emit('change-applied', {
        version: updatedNote.version,
        noteId
      });

    } catch (error) {
      console.error('Error handling text change:', error);
      socket.emit('error', { message: 'Failed to apply changes' });
    }
  });

  // Handle cursor position updates
  socket.on('cursor-update', (data) => {
    const { noteId, position, selection } = data;
    
    if (socket.currentNoteId === noteId) {
      // Broadcast cursor position to other users in the room
      socket.to(noteId).emit('cursor-update', {
        userId: socket.userId,
        username: socket.user.username,
        socketId: socket.id,
        position,
        selection,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle title changes
  socket.on('title-change', async (data) => {
    try {
      const { noteId, title } = data;
      
      if (!noteId || !title) {
        return;
      }

      // Verify user has write access
      const note = await Note.findOne({
        _id: noteId,
        $or: [
          { owner: socket.userId },
          { 
            'collaborators.user': socket.userId,
            'collaborators.permission': 'write'
          }
        ]
      });

      if (!note) {
        socket.emit('error', { message: 'No write access to this note' });
        return;
      }

      // Update title in database
      const updatedNote = await Note.findByIdAndUpdate(
        noteId,
        {
          title,
          lastEditedBy: socket.userId,
          version: note.version + 1
        },
        { new: true }
      ).populate('lastEditedBy', 'username');

      // Broadcast title change to all users in the room
      socket.to(noteId).emit('title-change', {
        noteId,
        title,
        userId: socket.userId,
        username: socket.user.username,
        version: updatedNote.version,
        timestamp: new Date().toISOString()
      });

      socket.emit('title-change-applied', {
        version: updatedNote.version
      });

    } catch (error) {
      console.error('Error handling title change:', error);
      socket.emit('error', { message: 'Failed to update title' });
    }
  });

  // Handle manual save request
  socket.on('save-note', async (data) => {
    try {
      const { noteId, content, title } = data;
      
      if (!noteId) {
        return;
      }

      const note = await Note.findOne({
        _id: noteId,
        $or: [
          { owner: socket.userId },
          { 
            'collaborators.user': socket.userId,
            'collaborators.permission': 'write'
          }
        ]
      });

      if (!note) {
        socket.emit('error', { message: 'No write access to this note' });
        return;
      }

      const updateData = {
        lastEditedBy: socket.userId,
        version: note.version + 1
      };

      if (content !== undefined) updateData.content = content;
      if (title !== undefined) updateData.title = title;

      const updatedNote = await Note.findByIdAndUpdate(
        noteId,
        updateData,
        { new: true }
      ).populate('lastEditedBy', 'username');

      // Broadcast save confirmation
      socket.emit('note-saved', {
        noteId,
        version: updatedNote.version,
        timestamp: new Date().toISOString()
      });

      // Notify others about the save
      socket.to(noteId).emit('note-saved-by-other', {
        noteId,
        userId: socket.userId,
        username: socket.user.username,
        version: updatedNote.version
      });

    } catch (error) {
      console.error('Error saving note:', error);
      socket.emit('error', { message: 'Failed to save note' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { noteId } = data;
    
    if (socket.currentNoteId === noteId) {
      socket.to(noteId).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: true
      });
    }
  });

  socket.on('typing-stop', (data) => {
    const { noteId } = data;
    
    if (socket.currentNoteId === noteId) {
      socket.to(noteId).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: false
      });
    }
  });
};