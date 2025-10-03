const mongoose = require('mongoose');

const ArtworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image','audio','video','document'], default: 'image' },
  thumbnailUrl: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, index: true }],
  category: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Artwork', ArtworkSchema);
