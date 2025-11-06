import api from './api.js';

export const shareAPI = {
  // Create a share link
  createShare: (noteId, shareData) => {
    console.log('Creating share with data:', { noteId, ...shareData });
    return api.post('/shares', { noteId, ...shareData });
  },
  
  // Get all shares for a note
  getNoteShares: (noteId) => 
    api.get(`/shares/note/${noteId}`),
  
  // Get share by token (public)
  getShareByToken: (token) => 
    api.get(`/shares/token/${token}`),
  
  // Update share
  updateShare: (shareId, updateData) => 
    api.put(`/shares/${shareId}`, updateData),
  
  // Delete share
  deleteShare: (shareId) => 
    api.delete(`/shares/${shareId}`),
  
  // Invite user via email
  inviteUser: (noteId, email, permission) => 
    api.post('/shares/invite', { noteId, email, permission }),
  
  // Accept share
  acceptShare: (token) => 
    api.post(`/shares/accept/${token}`)
};

export default shareAPI;