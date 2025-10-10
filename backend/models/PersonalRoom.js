const mongoose = require('mongoose');

const PersonalRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only 2 participants
PersonalRoomSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Personal room must have exactly 2 participants'));
  }
  next();
});

// Index for faster queries
PersonalRoomSchema.index({ participants: 1 });
PersonalRoomSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('PersonalRoom', PersonalRoomSchema);