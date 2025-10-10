const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  board: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Board'
  },
  personalRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalRoom'
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }
}, { timestamps: true });

// Ensure message belongs to either board or personal room
ChatMessageSchema.pre('save', function(next) {
  if (!this.board && !this.personalRoom) {
    next(new Error('Message must belong to either a board or personal room'));
  }
  if (this.board && this.personalRoom) {
    next(new Error('Message cannot belong to both board and personal room'));
  }
  next();
});

// Index for faster queries
ChatMessageSchema.index({ board: 1, createdAt: -1 });
ChatMessageSchema.index({ personalRoom: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);