import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socket.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export const useSocket = () => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const callbacksRef = useRef({});

  // Connect to socket when token is available
  useEffect(() => {
    if (token && user) {
      try {
        socketService.connect(token);
        setConnectionError(null);
      } catch (error) {
        console.error('Failed to connect to socket:', error);
        setConnectionError(error.message);
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [token, user]);

  // Setup connection status listeners
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
      setConnectionError(null);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      setSocketId(null);
      console.log('Socket disconnected:', reason);
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message);
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);
    socketService.on('error', handleError);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
      socketService.off('error', handleError);
    };
  }, []);

  // Setup note event listeners
  const setupNoteListeners = useCallback((callbacks) => {
    callbacksRef.current = callbacks;
    socketService.setupNoteListeners(callbacks);
  }, []);

  // Remove note event listeners
  const removeNoteListeners = useCallback(() => {
    Object.keys(callbacksRef.current).forEach(event => {
      socketService.off(event, callbacksRef.current[event]);
    });
    callbacksRef.current = {};
  }, []);

  // Join a note room
  const joinNote = useCallback((noteId) => {
    if (isConnected) {
      try {
        socketService.joinNote(noteId);
      } catch (error) {
        console.error('Failed to join note:', error);
        setConnectionError(error.message);
      }
    }
  }, [isConnected]);

  // Leave a note room
  const leaveNote = useCallback((noteId) => {
    if (isConnected) {
      try {
        socketService.leaveNote(noteId);
      } catch (error) {
        console.error('Failed to leave note:', error);
      }
    }
  }, [isConnected]);

  // Send text changes
  const sendTextChange = useCallback((noteId, changes, version, clientId) => {
    if (isConnected) {
      try {
        socketService.sendTextChange(noteId, changes, version, clientId);
      } catch (error) {
        console.error('Failed to send text change:', error);
      }
    }
  }, [isConnected]);

  // Send cursor updates
  const sendCursorUpdate = useCallback((noteId, position, selection) => {
    if (isConnected) {
      try {
        socketService.sendCursorUpdate(noteId, position, selection);
      } catch (error) {
        console.error('Failed to send cursor update:', error);
      }
    }
  }, [isConnected]);

  // Send title changes
  const sendTitleChange = useCallback((noteId, title) => {
    if (isConnected) {
      try {
        socketService.sendTitleChange(noteId, title);
      } catch (error) {
        console.error('Failed to send title change:', error);
      }
    }
  }, [isConnected]);

  // Manual save
  const saveNote = useCallback((noteId, content, title) => {
    if (isConnected) {
      try {
        socketService.saveNote(noteId, content, title);
      } catch (error) {
        console.error('Failed to save note via socket:', error);
      }
    }
  }, [isConnected]);

  // Typing indicators
  const startTyping = useCallback((noteId) => {
    if (isConnected) {
      try {
        socketService.startTyping(noteId);
      } catch (error) {
        console.error('Failed to start typing indicator:', error);
      }
    }
  }, [isConnected]);

  const stopTyping = useCallback((noteId) => {
    if (isConnected) {
      try {
        socketService.stopTyping(noteId);
      } catch (error) {
        console.error('Failed to stop typing indicator:', error);
      }
    }
  }, [isConnected]);

  return {
    isConnected,
    socketId,
    connectionError,
    joinNote,
    leaveNote,
    sendTextChange,
    sendCursorUpdate,
    sendTitleChange,
    saveNote,
    startTyping,
    stopTyping,
    setupNoteListeners,
    removeNoteListeners
  };
};

export default useSocket;