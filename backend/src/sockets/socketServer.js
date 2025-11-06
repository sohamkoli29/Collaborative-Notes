import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';
import User from '../models/User.js';
import { noteHandlers } from './noteHandlers.js';

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Add connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      }
    });

    this.connectedUsers = new Map(); // userId -> socketId[]
    this.userSockets = new Map(); // socketId -> user data
    this.noteRooms = new Map(); // noteId -> Set of socketIds

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ Socket.io server initialized with CORS:', process.env.FRONTEND_URL || 'http://localhost:5173');
  }

  setupMiddleware() {
    // Authentication middleware for Socket.io
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('Socket connection rejected: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, authConfig.jwtSecret);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          console.log('Socket connection rejected: User not found');
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = decoded.userId;
        socket.user = user;
        
        console.log(`Socket authentication successful for user: ${user.username}`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ User ${socket.user.username} connected with socket ID: ${socket.id}`);

      // Track user connection
      this.handleUserConnection(socket);

      // Setup note collaboration handlers
      noteHandlers(socket, this);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`❌ User ${socket.user.username} disconnected: ${reason}`);
        this.handleUserDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`⚠️ Socket error for user ${socket.user.username}:`, error);
      });

      // Test connection
      socket.on('ping', (data) => {
        socket.emit('pong', { ...data, serverTime: new Date().toISOString() });
      });
    });

    // Handle connection errors
    this.io.engine.on("connection_error", (err) => {
      console.error('Socket.io connection error:', err);
    });
  }

  // ... rest of the methods remain the same ...
  handleUserConnection(socket) {
    const { userId, user } = socket;

    // Track user's sockets
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);

    // Track socket's user
    this.userSockets.set(socket.id, {
      userId,
      username: user.username,
      email: user.email
    });

    // Update user's online status
    this.broadcastUserStatus(userId, true);
  }

  handleUserDisconnection(socket) {
    const { userId } = socket;

    // Remove socket from user tracking
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
        // Broadcast user went offline
        this.broadcastUserStatus(userId, false);
      }
    }

    // Remove socket from userSockets
    this.userSockets.delete(socket.id);

    // Remove socket from all note rooms
    this.noteRooms.forEach((sockets, noteId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        // Notify others in the room that user left
        socket.to(noteId).emit('user-left-note', {
          userId: socket.userId,
          username: socket.user.username,
          socketId: socket.id
        });

        if (sockets.size === 0) {
          this.noteRooms.delete(noteId);
        }
      }
    });
  }

  broadcastUserStatus(userId, isOnline) {
    this.io.emit('user-status-changed', {
      userId,
      isOnline,
      lastSeen: isOnline ? null : new Date().toISOString()
    });
  }

  // Join a note room for real-time collaboration
  joinNoteRoom(socket, noteId) {
    socket.join(noteId);

    if (!this.noteRooms.has(noteId)) {
      this.noteRooms.set(noteId, new Set());
    }
    this.noteRooms.get(noteId).add(socket.id);

    // Notify others in the room
    socket.to(noteId).emit('user-joined-note', {
      userId: socket.userId,
      username: socket.user.username,
      socketId: socket.id
    });

    // Send current collaborators to the joining user
    const collaborators = this.getNoteCollaborators(noteId);
    socket.emit('note-collaborators', collaborators);
  }

  // Leave a note room
  leaveNoteRoom(socket, noteId) {
    socket.leave(noteId);

    if (this.noteRooms.has(noteId)) {
      this.noteRooms.get(noteId).delete(socket.id);
      
      // Notify others in the room
      socket.to(noteId).emit('user-left-note', {
        userId: socket.userId,
        username: socket.user.username,
        socketId: socket.id
      });

      if (this.noteRooms.get(noteId).size === 0) {
        this.noteRooms.delete(noteId);
      }
    }
  }

  // Get all collaborators in a note room
  getNoteCollaborators(noteId) {
    const collaborators = [];
    
    if (this.noteRooms.has(noteId)) {
      this.noteRooms.get(noteId).forEach(socketId => {
        const userData = this.userSockets.get(socketId);
        if (userData) {
          collaborators.push({
            ...userData,
            socketId,
            isOnline: true
          });
        }
      });
    }

    return collaborators;
  }

  // Get user by socket ID
  getUserBySocketId(socketId) {
    return this.userSockets.get(socketId);
  }

  // Get all connected users
  getConnectedUsers() {
    const users = [];
    this.userSockets.forEach((userData, socketId) => {
      users.push({ ...userData, socketId });
    });
    return users;
  }
}

export default SocketServer;