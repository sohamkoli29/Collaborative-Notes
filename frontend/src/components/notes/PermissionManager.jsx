import React from 'react';
import { Eye, Edit, UserX, Mail } from 'lucide-react';
import Button from '../ui/Button.jsx';

const PermissionManager = ({ 
  collaborators, 
  currentUser, 
  noteOwner,
  onUpdatePermission,
  onRemoveCollaborator,
  onInviteUser 
}) => {
  const canManagePermissions = currentUser?._id === noteOwner?._id;

  const handlePermissionChange = (userId, newPermission) => {
    if (!canManagePermissions) return;
    onUpdatePermission(userId, newPermission);
  };

  const handleRemoveCollaborator = (userId, username) => {
    if (!canManagePermissions) return;
    if (window.confirm(`Are you sure you want to remove ${username} from this note?`)) {
      onRemoveCollaborator(userId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
        {canManagePermissions && (
          <Button
            variant="primary"
            size="sm"
            onClick={onInviteUser}
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Collaborators List */}
      <div className="space-y-3">
        {/* Note Owner */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {noteOwner?.username?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{noteOwner?.username}</p>
              <p className="text-sm text-gray-500">Owner</p>
            </div>
          </div>
          <div className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
            Owner
          </div>
        </div>

        {/* Collaborators */}
        {collaborators.map((collaborator) => (
          <div key={collaborator.user._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {collaborator.user.username?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{collaborator.user.username}</p>
                <p className="text-sm text-gray-500">{collaborator.user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Permission Selector */}
              {canManagePermissions ? (
                <select
                  value={collaborator.permission}
                  onChange={(e) => handlePermissionChange(collaborator.user._id, e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="read">Can view</option>
                  <option value="write">Can edit</option>
                </select>
              ) : (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  {collaborator.permission === 'write' ? (
                    <Edit className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="capitalize">{collaborator.permission}</span>
                </div>
              )}

              {/* Remove Button */}
              {canManagePermissions && (
                <button
                  onClick={() => handleRemoveCollaborator(collaborator.user._id, collaborator.user.username)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove collaborator"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {collaborators.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-gray-400" />
            </div>
            <p>No collaborators yet</p>
            <p className="text-sm">Invite users to collaborate on this note</p>
          </div>
        )}
      </div>

      {/* Permission Legend */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Permission Levels</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span>Can view - Read only access</span>
          </div>
          <div className="flex items-center space-x-2">
            <Edit className="w-4 h-4 text-gray-500" />
            <span>Can edit - Read and write access</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;