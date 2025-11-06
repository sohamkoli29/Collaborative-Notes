import { useState, useCallback } from 'react';
import { shareAPI } from '../services/shareApi.js';

export const useSharing = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a share link
  const createShare = useCallback(async (noteId, shareData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareAPI.createShare(noteId, shareData);
      const newShare = response.data.data;
      
      // Add to shares list
      setShares(prev => [newShare, ...prev]);
      
      return newShare;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create share link';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get shares for a note
  const getNoteShares = useCallback(async (noteId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareAPI.getNoteShares(noteId);
      setShares(response.data.data || []);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch shares';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update share
  const updateShare = useCallback(async (shareId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareAPI.updateShare(shareId, updateData);
      const updatedShare = response.data.data;
      
      // Update in shares list
      setShares(prev => 
        prev.map(share => 
          share._id === shareId ? updatedShare : share
        )
      );
      
      return updatedShare;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update share';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete share
  const deleteShare = useCallback(async (shareId) => {
    setLoading(true);
    setError(null);
    try {
      await shareAPI.deleteShare(shareId);
      
      // Remove from shares list
      setShares(prev => prev.filter(share => share._id !== shareId));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete share';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Invite user via email
  const inviteUser = useCallback(async (noteId, email, permission = 'read') => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareAPI.inviteUser(noteId, email, permission);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to invite user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept share
  const acceptShare = useCallback(async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareAPI.acceptShare(token);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to accept share';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    shares,
    loading,
    error,
    createShare,
    getNoteShares,
    updateShare,
    deleteShare,
    inviteUser,
    acceptShare,
    clearError
  };
};

export default useSharing;