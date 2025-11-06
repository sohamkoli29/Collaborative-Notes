import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotes } from '../hooks/useNotes.js';
import NoteList from '../components/notes/NoteList.jsx';
import CreateNoteModal from '../components/notes/CreateNoteModal.jsx';
import ShareModal from '../components/notes/ShareModal.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Loading from '../components/ui/Loading.jsx';

// Make sure this is a proper function component
const Dashboard = () => {
  // Hooks must be called at the top level of the function component
  const { user } = useAuth();
  const { 
    notes, 
    loading, 
    error, 
    createNote, 
    updateNote, 
    deleteNote,
    clearError 
  } = useNotes();

  // State hooks must be called in the same order every render
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const handleCreateNote = async (noteData) => {
    await createNote(noteData);
  };

  const handleEditNote = (note) => {
    // Will be implemented in NoteEditor page
    console.log('Edit note:', note);
  };

  const handleDeleteNote = async (note) => {
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        await deleteNote(note._id);
      } catch (error) {
        // Error is handled in the hook
      }
    }
  };

  const handleShareNote = (note) => {
    setSelectedNote(note);
    setShareModalOpen(true);
  };

  if (loading && notes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Loading size="lg" text="Loading your notes..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-gray-600">
              You have {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + New Note
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary-600">{notes.length}</div>
            <div className="text-gray-600">Total Notes</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {notes.filter(note => note.collaborators?.length > 0).length}
            </div>
            <div className="text-gray-600">Shared Notes</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {notes.reduce((acc, note) => acc + (note.collaborators?.length || 0), 0)}
            </div>
            <div className="text-gray-600">Collaborators</div>
          </Card>
        </div>
      </div>

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

      {/* Notes List */}
      <NoteList
        notes={notes}
        loading={loading}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onShareNote={handleShareNote}
        currentUser={user}
      />

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateNote}
        loading={loading}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        note={selectedNote}
      />
    </div>
  );
};

// Make sure to export as default
export default Dashboard;