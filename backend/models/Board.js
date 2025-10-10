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
  // Members who can join and participate
  members: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  // All artworks in this board from all members
  artworks: [{
    artwork: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Artwork' 
    },
    addedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    },
    note: String
  }],
  // Board visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'members-only'],
    default: 'public'
  },
  // Board settings
  settings: {
    allowMemberInvites: { type: Boolean, default: true },
    allowArtworkAdditions: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false }
  },
  // Cover image
  coverImage: String,
  // Category for organization (optional)
  category: String,
  // Tags for discovery
  tags: [String],
  // Stats
  stats: {
    totalArtworks: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  // Activity tracking
  lastActivity: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Indexes
BoardSchema.index({ creator: 1, createdAt: -1 });
BoardSchema.index({ title: 1 });
BoardSchema.index({ 'members.user': 1 });
BoardSchema.index({ visibility: 1 });

// Method to check if user is member
BoardSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// Method to add member
BoardSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
    this.stats.totalMembers += 1;
    return true;
  }
  return false;
};

// Method to check if user can add artworks
BoardSchema.methods.canAddArtworks = function(userId) {
  if (this.creator.toString() === userId.toString()) return true;
  
  const member = this.members.find(m => 
    m.user.toString() === userId.toString()
  );
  
  if (!member) return false;
  
  return this.settings.allowArtworkAdditions && 
         ['admin', 'member'].includes(member.role);
};

module.exports = mongoose.model('Board', BoardSchema);