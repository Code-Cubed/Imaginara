const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // ✅ Make optional for OAuth users
  avatar: { type: String },
  bio: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
  role: { type: String, default: 'user' },
  
  // ✅ NEW: OAuth fields
  googleId: { type: String, sparse: true, unique: true },
  githubId: { type: String, sparse: true, unique: true },
  provider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  emailVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);