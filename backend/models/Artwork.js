// models/Artwork.js (Updated)
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
  flagged: { type: Boolean, default: false },
  
  // AI Embeddings for similarity search
  textEmbedding: [Number], // Vector for text similarity
  imageEmbedding: [Number], // Vector for image similarity
  embeddingsGenerated: { type: Boolean, default: false }
}, { timestamps: true });

// Index for similarity search
ArtworkSchema.index({ textEmbedding: 1 });
ArtworkSchema.index({ imageEmbedding: 1 });

module.exports = mongoose.model('Artwork', ArtworkSchema);