import React from 'react';
import { Users, Circle } from 'lucide-react';

const CollaboratorPresence = ({ collaborators, currentUser }) => {
  if (!collaborators || collaborators.length === 0) {
    return null;
  }

  // Filter out current user and show only online collaborators
  const otherCollaborators = collaborators.filter(
    collab => collab.userId !== currentUser?._id && collab.isOnline
  );

  if (otherCollaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <Users className="w-4 h-4 text-blue-600" />
      <div className="flex items-center space-x-2">
        <span className="text-sm text-blue-700 font-medium">
          {otherCollaborators.length} collaborator{otherCollaborators.length !== 1 ? 's' : ''} online
        </span>
        <div className="flex -space-x-2">
          {otherCollaborators.slice(0, 3).map((collab, index) => (
            <div
              key={collab.socketId || index}
              className="relative group"
              title={collab.username}
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium border-2 border-white">
                {collab.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Circle className="w-3 h-3 text-green-500 fill-green-500" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {collab.username}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
          {otherCollaborators.length > 3 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white font-medium border-2 border-white">
              +{otherCollaborators.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaboratorPresence;