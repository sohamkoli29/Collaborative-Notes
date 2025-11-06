import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit3, 
  Trash2, 
  Users, 
  Calendar,
  User 
} from 'lucide-react';

const NoteCard = ({ 
  note, 
  onDelete, 
  onShare,
  isOwner = true 
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  };

  const truncateContent = (content, length = 100) => {
    if (!content) return 'No content';
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const handleEdit = () => {
    navigate(`/notes/${note._id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 
          className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2 cursor-pointer hover:text-primary-600"
          onClick={handleEdit}
        >
          {note.title || 'Untitled Note'}
        </h3>
        <div className="flex space-x-1">
          {isOwner && (
            <>
              <button
                onClick={handleEdit}
                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit note"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShare(note)}
                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Share note"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(note)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <p 
        className="text-gray-600 text-sm mb-4 line-clamp-3 cursor-pointer"
        onClick={handleEdit}
      >
        {truncateContent(note.content)}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(note.updatedAt)}</span>
          </div>
          
          {note.collaborators && note.collaborators.length > 0 && (
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{note.collaborators.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span className={note.owner._id === note.lastEditedBy?._id ? '' : 'text-blue-600'}>
            {note.lastEditedBy?.username || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;