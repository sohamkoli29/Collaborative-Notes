import React, { useEffect, useState } from 'react';

const RealTimeCursor = ({ noteId, editorRef }) => {
  const [cursors, setCursors] = useState({});

  // This would be connected to the socket events
  // For now, it's a placeholder component structure

  if (Object.keys(cursors).length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Object.values(cursors).map((cursor) => (
        <div
          key={cursor.socketId}
          className="absolute transition-all duration-100"
          style={{
            left: cursor.position?.left || 0,
            top: cursor.position?.top || 0,
          }}
        >
          <div className="flex items-center space-x-1">
            <div
              className="w-0.5 h-6 rounded-sm"
              style={{ backgroundColor: cursor.color }}
            />
            <div
              className="px-2 py-1 text-xs text-white rounded-md shadow-sm"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealTimeCursor;