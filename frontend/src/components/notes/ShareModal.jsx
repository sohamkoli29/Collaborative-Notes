import React, { useState, useEffect, useCallback } from 'react';
import { X, Link2, Mail, Globe, Lock, Calendar, Users } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import ShareLink from './ShareLink.jsx';
import PermissionManager from './PermissionManager.jsx';
import { useSharing } from '../../hooks/useSharing.js';

const ShareModal = ({ isOpen, onClose, note }) => {
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'people'
  const [shareSettings, setShareSettings] = useState({
    permission: 'read',
    expiresAt: '',
    maxAccesses: '',
    isPublic: false
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('read');
  const [hasLoaded, setHasLoaded] = useState(false);

  const { shares, loading, error, createShare, getNoteShares, updateShare, deleteShare, inviteUser, clearError } = useSharing();

  // Memoized load function to prevent infinite re-renders
  const loadShares = useCallback(async () => {
    if (note && isOpen && !hasLoaded) {
      try {
        await getNoteShares(note._id);
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to load shares:', error);
      }
    }
  }, [note, isOpen, hasLoaded, getNoteShares]);

  // Load shares when modal opens
  useEffect(() => {
    if (isOpen && note) {
      loadShares();
    }
  }, [isOpen, note, loadShares]);

  // Reset hasLoaded when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen]);

  const handleCreateShare = async () => {
    if (!note?._id) {
      console.error('No note ID available');
      return;
    }

    try {
      console.log('Creating share for note:', note._id, 'with settings:', shareSettings);
      
      await createShare(note._id, shareSettings);
      
      // Reset form
      setShareSettings({
        permission: 'read',
        expiresAt: '',
        maxAccesses: '',
        isPublic: false
      });
    } catch (error) {
      console.error('Failed to create share:', error);
      // Error handled by hook
    }
  };

  const handleUpdateShare = async (shareId, updateData) => {
    try {
      await updateShare(shareId, updateData);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteShare = async (shareId) => {
    try {
      await deleteShare(shareId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !note?._id) return;

    try {
      await inviteUser(note._id, inviteEmail.trim(), invitePermission);
      setInviteEmail('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdatePermission = async (userId, newPermission) => {
    try {
      console.log('Update permission:', userId, newPermission);
      // In a real implementation, you'd call an API to update the collaborator
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      console.log('Remove collaborator:', userId);
      // In a real implementation, you'd call an API to remove the collaborator
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    }
  };

  const handleCopyLink = (url) => {
    console.log('Copied share URL:', url);
  };

  if (!note) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${note.title}"`}
      size="lg"
    >
      <div className="p-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('link')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'link'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Shareable Links</span>
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'people'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>People</span>
            </button>
          </nav>
        </div>

        {/* Link Sharing Tab */}
        {activeTab === 'link' && (
          <div className="space-y-6">
            {/* Create New Share */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Create New Share Link</h3>
              
              <div className="space-y-4">
                {/* Permission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permission
                  </label>
                  <select
                    value={shareSettings.permission}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, permission: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="read">Can view</option>
                    <option value="write">Can edit</option>
                  </select>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={shareSettings.expiresAt}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* Max Accesses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Accesses (optional)
                  </label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={shareSettings.maxAccesses}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, maxAccesses: e.target.value }))}
                    min="1"
                  />
                </div>

                {/* Public/Private */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareSettings.isPublic}
                      onChange={(e) => setShareSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Make this link public</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Public links can be accessed by anyone with the link
                  </p>
                </div>

                <Button
                  onClick={handleCreateShare}
                  loading={loading}
                  variant="primary"
                  className="w-full"
                  disabled={!note?._id}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Create Share Link
                </Button>
              </div>
            </div>

            {/* Existing Shares */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Active Share Links</h3>
              {shares.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No share links created yet</p>
                  <p className="text-sm">Create your first share link above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shares.map((share) => (
                    <ShareLink
                      key={share._id}
                      share={share}
                      onEdit={(share) => {
                        // You could implement an edit modal here
                        console.log('Edit share:', share);
                      }}
                      onDelete={handleDeleteShare}
                      onCopy={handleCopyLink}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div>
            <PermissionManager
              collaborators={note.collaborators || []}
              currentUser={note.owner} // This should be the current logged-in user
              noteOwner={note.owner}
              onUpdatePermission={handleUpdatePermission}
              onRemoveCollaborator={handleRemoveCollaborator}
              onInviteUser={() => {
                // You could implement an invite modal here
                console.log('Invite user');
              }}
            />

            {/* Invite by Email Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Invite by Email</h4>
              <div className="flex space-x-3">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="read">Can view</option>
                  <option value="write">Can edit</option>
                </select>
                <Button
                  onClick={handleInviteUser}
                  loading={loading}
                  disabled={!inviteEmail.trim() || !note?._id}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;