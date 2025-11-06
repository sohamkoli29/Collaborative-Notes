import api from './api.js';

export const notesAPI = {
  // Get all notes for user
  getNotes: () => api.get('/notes'),
  
  // Get single note
  getNote: (noteId) => api.get(`/notes/${noteId}`),
  
  // Create new note
  createNote: (noteData) => api.post('/notes', noteData),
  
  // Update note
  updateNote: (noteId, noteData) => api.put(`/notes/${noteId}`, noteData),
  
  // Delete note
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
  
  // Add collaborator
  addCollaborator: (noteId, collaboratorData) => 
    api.post(`/notes/${noteId}/collaborators`, collaboratorData),
};

export default notesAPI;