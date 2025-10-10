// models/Board.js
const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Board visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  // Artworks in this board
  artworks: [{
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    note: String // Optional note about why this artwork was added
  }],
  // Collaborators who can edit (simplified for compatibility)
  collaborators: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  // Followers who want updates
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  // Cover image for the board
  coverImage: String,
  // Board settings
  settings: {
    allowComments: { type: Boolean, default: true },
    allowContributions: { type: Boolean, default: true },
    showContributors: { type: Boolean, default: true }
  },
  // Stats
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  },
  // Tags for discovery
  tags: [String],
  category: String,
  // Activity tracking
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
BoardSchema.index({ creator: 1, createdAt: -1 });
BoardSchema.index({ visibility: 1, createdAt: -1 });
BoardSchema.index({ tags: 1 });
BoardSchema.index({ collaborators: 1 });
BoardSchema.index({ title: 1 });

module.exports = mongoose.model('Board', BoardSchema);