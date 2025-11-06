import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import RichTextEditor from './RichTextEditor.jsx';

const CreateNoteModal = ({ isOpen, onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await onCreate(formData);
      setFormData({ title: '', content: '' });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setFormData({ title: '', content: '' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Note"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <Input
          label="Note Title"
          name="title"
          type="text"
          required
          placeholder="Enter a title for your note..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Start writing your note content..."
            height="300px"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!formData.title.trim() || loading}
          >
            Create Note
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNoteModal;