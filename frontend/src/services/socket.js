import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventCallbacks = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    // Fix: Use the base URL without /api for Socket.io
    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    console.log('Connecting to Socket.io server:', API_URL);
    
    this.socket = io(API_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      // Add reconnection options
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to server with ID:', this.socket.id);
      this.isConnected = true;
      this.emitEvent('connect');
      
      // Test connection
      this.socket.emit('ping', { clientTime: new Date().toISOString() });
    });

    this.socket.on('pong', (data) => {
      console.log('🏓 Server pong received:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.isConnected = false;
      this.emitEvent('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error.message);
      this.emitEvent('connect_error', error);
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
      this.emitEvent('error', error);
    });
  }

  // ... rest of the methods remain the same ...

  // Join a note room for collaboration
  joinNote(noteId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join note: Socket not connected');
      return;
    }
    console.log(`Joining note room: ${noteId}`);
    this.socket.emit('join-note', { noteId });
  }

  // Leave a note room
  leaveNote(noteId) {
    if (this.socket && this.isConnected) {
      console.log(`Leaving note room: ${noteId}`);
      this.socket.emit('leave-note', { noteId });
    }
  }

  // Send text changes
  sendTextChange(noteId, changes, version, clientId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('text-change', {
        noteId,
        changes,
        version,
        clientId
      });
    }
  }

  // Send cursor position updates
  sendCursorUpdate(noteId, position, selection) {
    if (this.socket && this.isConnected) {
      this.socket.emit('cursor-update', {
        noteId,
        position,
        selection
      });
    }
  }

  // Send title changes
  sendTitleChange(noteId, title) {
    if (this.socket && this.isConnected) {
      this.socket.emit('title-change', {
        noteId,
        title
      });
    }
  }

  // Manual save request
  saveNote(noteId, content, title) {
    if (this.socket && this.isConnected) {
      this.socket.emit('save-note', {
        noteId,
        content,
        title
      });
    }
  }

  // Typing indicators
  startTyping(noteId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing-start', { noteId });
    }
  }

  stopTyping(noteId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing-stop', { noteId });
    }
  }

  // Event subscription
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
      
      // Setup socket listener for this event
      if (this.socket) {
        this.socket.on(event, (data) => {
          console.log(`📨 Socket event received: ${event}`, data);
          this.emitEvent(event, data);
        });
      }
    }
    this.eventCallbacks.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).delete(callback);
    }
  }

  emitEvent(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Setup socket event listeners for real-time features
  setupNoteListeners(callbacks) {
    const events = [
      'note-joined',
      'text-change',
      'title-change',
      'cursor-update',
      'user-joined-note',
      'user-left-note',
      'note-collaborators',
      'user-typing',
      'change-applied',
      'title-change-applied',
      'version-conflict',
      'sync-required',
      'note-saved',
      'note-saved-by-other',
      'pong' // Add pong event
    ];

    events.forEach(event => {
      this.on(event, callbacks[event]);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventCallbacks.clear();
    }
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Create a singleton instance
export const socketService = new SocketService();
export default socketService;