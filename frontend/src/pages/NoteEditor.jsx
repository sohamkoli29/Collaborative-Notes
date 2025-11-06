import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../hooks/useNotes.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import RichTextEditor from '../components/notes/RichTextEditor.jsx';
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

  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Memoized load function to prevent infinite re-renders
  const loadNoteData = useCallback(async () => {
    if (noteId && initialLoad) {
      try {
        await loadNote(noteId);
        setInitialLoad(false);
      } catch (error) {
        console.error('Failed to load note:', error);
      }
    }
  }, [noteId, loadNote, initialLoad]);

  // Load note when component mounts or noteId changes
  useEffect(() => {
    loadNoteData();
  }, [loadNoteData]);

  // Update form data when currentNote changes
  useEffect(() => {
    if (currentNote && !loading) {
      setFormData({
        title: currentNote.title || '',
        content: currentNote.content || ''
      });
      setHasChanges(false);
      setInitialLoad(false);
    }
  }, [currentNote, loading]);

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
    setHasChanges(true);
  };

  const handleContentChange = (content) => {
    setFormData({ ...formData, content });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges || !noteId) return;

    setIsSaving(true);
    try {
      await updateNote(noteId, formData);
      setHasChanges(false);
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

  // Show loading only during initial load
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
              {/* Collaborators count */}
              {currentNote?.collaborators && currentNote.collaborators.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{currentNote.collaborators.length}</span>
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

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder="Start writing your note content..."
            height="calc(100vh - 200px)"
          />
        </div>

        {/* Note Info */}
        {currentNote && (
          <div className="mt-4 text-sm text-gray-500">
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
        )}
      </main>
    </div>
  );
};

export default NoteEditor;