import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../hooks/useNotes.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import RichTextEditor from '../components/notes/RichTextEditor.jsx';
import CollaboratorPresence from '../components/notes/CollaboratorPresence.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Loading from '../components/ui/Loading.jsx';
import { ArrowLeft, Save, Users } from 'lucide-react';

const NoteEditor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentNote, 
    loading, 
    error, 
    loadNote, 
    updateNote, 
    clearError 
  } = useNotes();

  // Fix: Properly destructure all values from useSocket
  const socket = useSocket();
  const {
    isConnected,
    socketId,
    connectionError, // Make sure this is included
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
  } = socket;

  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [noteVersion, setNoteVersion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const clientIdRef = useRef(Date.now().toString());
  const lastSavedVersionRef = useRef(0);

  // Socket event handlers
  const setupSocketHandlers = useCallback(() => {
    const handlers = {
      'note-joined': (data) => {
        console.log('Joined note room:', data.noteId);
        setNoteVersion(data.version);
        lastSavedVersionRef.current = data.version;
      },

      'text-change': (data) => {
        // Ignore our own changes (handled by echo)
        if (data.clientId === clientIdRef.current) return;

        // Apply remote changes
        if (data.noteId === noteId) {
          setFormData(prev => ({
            ...prev,
            content: data.changes.content // Simplified - would use patches in real implementation
          }));
          setNoteVersion(data.version);
        }
      },

      'title-change': (data) => {
        if (data.noteId === noteId && data.userId !== user?._id) {
          setFormData(prev => ({
            ...prev,
            title: data.title
          }));
          setNoteVersion(data.version);
        }
      },

      'note-collaborators': (data) => {
        setCollaborators(data);
      },

      'user-joined-note': (data) => {
        console.log('User joined:', data.username);
        // Collaborators list will be updated via 'note-collaborators' event
      },

      'user-left-note': (data) => {
        console.log('User left:', data.username);
        // Collaborators list will be updated via 'note-collaborators' event
      },

      'user-typing': (data) => {
        if (data.userId !== user?._id) {
          setIsTyping(data.isTyping);
        }
      },

      'change-applied': (data) => {
        if (data.noteId === noteId) {
          setNoteVersion(data.version);
          lastSavedVersionRef.current = data.version;
        }
      },

      'version-conflict': (data) => {
        console.warn('Version conflict detected');
        // Sync with server version
        setFormData(prev => ({
          ...prev,
          content: data.currentContent
        }));
        setNoteVersion(data.currentVersion);
        lastSavedVersionRef.current = data.currentVersion;
      },

      'sync-required': (data) => {
        // Full sync required
        setFormData(prev => ({
          ...prev,
          content: data.content
        }));
      },

      'note-saved': (data) => {
        if (data.noteId === noteId) {
          setNoteVersion(data.version);
          lastSavedVersionRef.current = data.version;
          setHasChanges(false);
        }
      },

      'pong': (data) => {
        console.log('Server pong received:', data);
      }
    };

    setupNoteListeners(handlers);
    return handlers;
  }, [noteId, user?._id, setupNoteListeners]);

  // Join note room when connected and note is loaded
  useEffect(() => {
    if (isConnected && currentNote && noteId) {
      joinNote(noteId);
      const handlers = setupSocketHandlers();

      return () => {
        removeNoteListeners();
        Object.keys(handlers).forEach(event => {
          // Cleanup individual handlers if needed
        });
        leaveNote(noteId);
      };
    }
  }, [isConnected, currentNote, noteId, joinNote, leaveNote, setupSocketHandlers, removeNoteListeners]);

  // Load note when component mounts
  useEffect(() => {
    if (noteId && initialLoad) {
      loadNote(noteId)
        .then(note => {
          setNoteVersion(note.version);
          lastSavedVersionRef.current = note.version;
        })
        .finally(() => {
          setInitialLoad(false);
        });
    }
  }, [noteId, loadNote, initialLoad]);

  // Update form data when currentNote changes
  useEffect(() => {
    if (currentNote && !loading) {
      setFormData({
        title: currentNote.title || '',
        content: currentNote.content || ''
      });
      setHasChanges(false);
    }
  }, [currentNote, loading]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setFormData(prev => ({ ...prev, title: newTitle }));
    setHasChanges(true);

    // Send real-time title change
    if (isConnected && noteId) {
      sendTitleChange(noteId, newTitle);
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
    setHasChanges(true);

    // Send real-time text change (simplified - would use patches)
    if (isConnected && noteId) {
      sendTextChange(noteId, {
        type: 'full',
        content: content
      }, noteVersion, clientIdRef.current);
    }
  };

  const handleCursorChange = (range) => {
    if (isConnected && noteId && range) {
      sendCursorUpdate(noteId, {
        index: range.index,
        length: range.length
      }, null);
    }
  };

  const handleTypingStart = () => {
    if (isConnected && noteId) {
      startTyping(noteId);
    }
  };

  const handleTypingStop = () => {
    if (isConnected && noteId) {
      stopTyping(noteId);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || !noteId) return;

    setIsSaving(true);
    try {
      if (isConnected) {
        // Use real-time save
        saveNote(noteId, formData.content, formData.title);
      } else {
        // Fallback to REST API
        await updateNote(noteId, formData);
        setHasChanges(false);
      }
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }
    navigate('/');
  };

  if (initialLoad && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading note..." />
      </div>
    );
  }

  if (error && initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Note</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!currentNote && !initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Note Not Found</h2>
          <p className="text-gray-600 mb-4">The note you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentNote?.owner?._id === user?._id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back button and title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <Input
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Note title..."
                className="text-xl font-semibold border-none shadow-none focus:ring-0 px-0"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <ConnectionStatus 
                isConnected={isConnected} 
                connectionError={connectionError} 
              />

              {/* Collaborators count */}
              {collaborators.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{collaborators.length}</span>
                </div>
              )}

              {/* Save button */}
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
                disabled={!hasChanges || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {hasChanges ? 'Save Changes' : 'Saved'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Collaborator Presence */}
        <CollaboratorPresence
          collaborators={collaborators}
          currentUser={user}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <div className="mb-4 text-sm text-gray-500 italic">
            Someone is typing...
          </div>
        )}

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            onCursorChange={handleCursorChange}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            placeholder="Start writing your note content..."
            height="calc(100vh - 280px)"
            noteId={noteId}
            realTimeEnabled={isConnected}
          />
        </div>

        {/* Note Info */}
        {currentNote && (
          <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
            <div>
              <p>
                Last edited by {currentNote.lastEditedBy?.username || 'Unknown'} • 
                {' '}{new Date(currentNote.updatedAt).toLocaleString()}
              </p>
              {!isOwner && (
                <p className="text-blue-600 mt-1">
                  You are collaborating on this note
                </p>
              )}
            </div>
            <div className="text-xs">
              Version: {noteVersion} • 
              {isConnected ? ' Real-time' : ' Offline'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NoteEditor;