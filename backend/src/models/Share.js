import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shareToken: {
    type: String,
    unique: true // Remove index: true if you're also using schema.index()
  },
  permission: {
    type: String,
    enum: ['read', 'write'],
    default: 'read'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Remove one of these index definitions to fix the duplicate warning
// Either keep this:
shareSchema.index({ note: 1, sharedWith: 1 });
// shareSchema.index({ shareToken: 1 }); // Remove this line if shareToken has unique: true

// Or keep this and remove unique: true from shareToken field:
// shareSchema.index({ shareToken: 1 });

export default mongoose.model('Share', shareSchema);