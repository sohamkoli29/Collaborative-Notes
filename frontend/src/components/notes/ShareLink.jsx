import React, { useState } from 'react';
import { Link2, Copy, Check, Trash2, Edit3, Calendar, Users, Eye, Edit } from 'lucide-react';
import Button from '../ui/Button.jsx';

const ShareLink = ({ share, onEdit, onDelete, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const shareUrl = `${window.location.origin}/shared/${share.shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onCopy?.(shareUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this share link?')) {
      setIsDeleting(true);
      try {
        await onDelete(share._id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = () => {
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) return true;
    if (share.maxAccesses && share.accessCount >= share.maxAccesses) return true;
    return !share.isActive;
  };

  const getPermissionIcon = (permission) => {
    return permission === 'write' ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${
      isExpired() ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Link2 className="w-4 h-4 text-gray-500" />
          <span className={`text-sm font-medium ${
            isExpired() ? 'text-red-600' : 'text-gray-700'
          }`}>
            {share.isPublic ? 'Public Link' : 'Private Link'}
          </span>
          <div className="flex items-center space-x-1 text-gray-500">
            {getPermissionIcon(share.permission)}
            <span className="text-xs capitalize">{share.permission}</span>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(share)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit share"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete share"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share URL */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-mono text-gray-600"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Stats and Info */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>{share.accessCount} accesses</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>
            {share.expiresAt 
              ? `Expires ${formatDate(share.expiresAt)}`
              : 'No expiration'
            }
          </span>
        </div>
      </div>

      {/* Expired Warning */}
      {isExpired() && (
        <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
          This share link has expired
        </div>
      )}

      {/* Last Accessed */}
      {share.lastAccessed && (
        <div className="mt-2 text-xs text-gray-400">
          Last accessed: {formatDate(share.lastAccessed)}
        </div>
      )}
    </div>
  );
};

export default ShareLink;