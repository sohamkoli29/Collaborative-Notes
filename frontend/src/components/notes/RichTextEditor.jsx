import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Start writing your note...',
  readOnly = false,
  height = '400px',
  noteId,
  onCursorChange,
  onTypingStart,
  onTypingStop,
  realTimeEnabled = false
}) => {
  const quillRef = useRef(null);
  const changeTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  // Handle text changes with debouncing
  const handleTextChange = useCallback((content, delta, source, editor) => {
    if (source === 'user') {
      onChange(content);

      // Notify typing activity
      if (realTimeEnabled) {
        if (!isTyping) {
          setIsTyping(true);
          onTypingStart?.();
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingStop?.();
        }, 1000);
      }

      // Debounce real-time updates
      if (realTimeEnabled && changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }

      if (realTimeEnabled) {
        changeTimeoutRef.current = setTimeout(() => {
          // Send changes for real-time collaboration
          // This would be connected to the socket service
        }, 300);
      }
    }
  }, [onChange, realTimeEnabled, isTyping, onTypingStart, onTypingStop]);

  // Handle selection changes (cursor movement)
  const handleSelectionChange = useCallback((range, source, editor) => {
    if (source === 'user' && realTimeEnabled && onCursorChange) {
      onCursorChange(range);
    }
  }, [realTimeEnabled, onCursorChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="rich-text-editor relative">
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={handleTextChange}
        onChangeSelection={handleSelectionChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height }}
        theme="snow"
      />
    </div>
  );
};

export default RichTextEditor;