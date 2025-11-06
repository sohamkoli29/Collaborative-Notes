import mongoose from 'mongoose';
import crypto from 'crypto';

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
    unique: true,
    sparse: true
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
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  maxAccesses: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique share token
shareSchema.methods.generateShareToken = function() {
  this.shareToken = crypto.randomBytes(32).toString('hex');
  return this.shareToken;
};

// Check if share is expired
shareSchema.methods.isExpired = function() {
  if (this.expiresAt && new Date() > this.expiresAt) {
    return true;
  }
  if (this.maxAccesses && this.accessCount >= this.maxAccesses) {
    return true;
  }
  return !this.isActive;
};

// Increment access count
shareSchema.methods.incrementAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Index for better performance
shareSchema.index({ note: 1, sharedWith: 1 });

shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Share', shareSchema);