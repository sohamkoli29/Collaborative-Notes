import { useState, useEffect, useCallback } from 'react';
import { notesAPI } from '../services/notesApi.js';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentNote, setCurrentNote] = useState(null);

  // Load all notes - useCallback to prevent unnecessary re-renders
  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesAPI.getNotes();
      setNotes(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Load single note - useCallback to prevent unnecessary re-renders
  const loadNote = useCallback(async (noteId) => {
    if (!noteId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await notesAPI.getNote(noteId);
      setCurrentNote(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load note');
      console.error('Error loading note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Create new note
  const createNote = async (noteData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesAPI.createNote(noteData);
      const newNote = response.data.data;
      setNotes(prev => [newNote, ...prev]);
      setCurrentNote(newNote);
      return newNote;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create note');
      console.error('Error creating note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update note
  const updateNote = async (noteId, noteData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesAPI.updateNote(noteId, noteData);
      const updatedNote = response.data.data;
      
      // Update in notes list
      setNotes(prev => 
        prev.map(note => 
          note._id === noteId ? updatedNote : note
        )
      );
      
      // Update current note if it's the one being edited
      if (currentNote && currentNote._id === noteId) {
        setCurrentNote(updatedNote);
      }
      
      return updatedNote;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update note');
      console.error('Error updating note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId) => {
    setLoading(true);
    setError(null);
    try {
      await notesAPI.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note._id !== noteId));
      
      // Clear current note if it's the one being deleted
      if (currentNote && currentNote._id === noteId) {
        setCurrentNote(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete note');
      console.error('Error deleting note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add collaborator
  const addCollaborator = async (noteId, collaboratorData) => {
    try {
      const response = await notesAPI.addCollaborator(noteId, collaboratorData);
      const updatedNote = response.data.data;
      
      setNotes(prev => 
        prev.map(note => 
          note._id === noteId ? updatedNote : note
        )
      );
      
      if (currentNote && currentNote._id === noteId) {
        setCurrentNote(updatedNote);
      }
      
      return updatedNote;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add collaborator');
      console.error('Error adding collaborator:', err);
      throw err;
    }
  };

  // Clear current note
  const clearCurrentNote = () => {
    setCurrentNote(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load notes on component mount only - use loadNotes in dependency array
  useEffect(() => {
    loadNotes();
  }, [loadNotes]); // loadNotes is now stable due to useCallback

  return {
    notes,
    currentNote,
    loading,
    error,
    loadNotes,
    loadNote,
    createNote,
    updateNote,
    deleteNote,
    addCollaborator,
    clearCurrentNote,
    clearError
  };
};

export default useNotes;