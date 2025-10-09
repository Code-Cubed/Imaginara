// models/Collection.js
const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  // Collection type
  type: {
    type: String,
    enum: ['personal', 'collaborative', 'curated'],
    default: 'personal'
  },
  // Owner/creator
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Members who can contribute
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['admin', 'contributor', 'viewer'],
      default: 'contributor'
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  // Boards within this collection
  boards: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Board' 
  }],
  // Direct artworks (if not using boards)
  artworks: [{
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'members-only'],
    default: 'public'
  },
  // Cover/thumbnail
  coverImage: String,
  // Collection settings
  settings: {
    requireApproval: { type: Boolean, default: false }, // Approve new members
    allowMemberInvites: { type: Boolean, default: true }, // Members can invite others
    moderationEnabled: { type: Boolean, default: false }
  },
  // Stats
  stats: {
    totalArtworks: { type: Number, default: 0 },
    totalBoards: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    followers: { type: Number, default: 0 }
  },
  // Tags
  tags: [String],
  category: String
}, { timestamps: true });

// Indexes
CollectionSchema.index({ owner: 1, createdAt: -1 });
CollectionSchema.index({ type: 1, visibility: 1 });
CollectionSchema.index({ 'members.user': 1 });
CollectionSchema.index({ tags: 1 });

module.exports = mongoose.model('Collection', CollectionSchema);