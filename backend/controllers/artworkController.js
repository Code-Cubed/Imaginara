// controllers/artworkController.js
const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.createArtwork = async (req, res) => {
  try {
    const { title, description, tags = [], category, mediaType } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const uploaded = await uploadToCloudinary(req.file.buffer, 'gallery/media');
    const thumb = uploaded.eager && uploaded.eager[0] ? uploaded.eager[0].secure_url : uploaded.secure_url;

    const art = await Artwork.create({
      title,
      description,
      mediaUrl: uploaded.secure_url,
      thumbnailUrl: thumb,
      mediaType: mediaType || 'image',
      creator: req.user._id,
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags,
      category
    });
    res.json(art);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getArtwork = async (req, res) => {
  try {
    // Check if this is a view-tracking request
    const incrementView = req.query.incrementView === 'true';
    
    const art = await Artwork.findById(req.params.id).populate('creator', 'name avatar');
    if (!art) return res.status(404).json({ message: 'Not found' });
    
    // Only increment views if explicitly requested
    if (incrementView) {
      art.views += 1;
      await art.save();
    }
    
    res.json(art);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// NEW: Separate endpoint for incrementing views
exports.incrementView = async (req, res) => {
  try {
    // Use findOneAndUpdate with $inc for atomic operation
    const art = await Artwork.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true, select: 'views' }
    );
    
    if (!art) return res.status(404).json({ message: 'Not found' });
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) io.to(req.params.id.toString()).emit('view-updated', { views: art.views });
    
    res.json({ views: art.views, success: true });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.listArtworks = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, tags, category, sort } = req.query;
    const filter = { flagged: false };
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim()) };
    if (category) filter.category = category;
    let query = Artwork.find(filter).populate('creator', 'name avatar');
    if (sort === 'popular') query = query.sort({ views: -1, likes: -1 });
    else query = query.sort({ createdAt: -1 });
    const results = await query.skip((page-1)*limit).limit(parseInt(limit));
    res.json(results);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.likeArtwork = async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: 'Not found' });
    const idx = art.likes.findIndex(u => u.toString() === req.user._id.toString());
    if (idx === -1) art.likes.push(req.user._id);
    else art.likes.splice(idx, 1);
    await art.save();
    // emit socket event using app's io if present
    const io = req.app.get('io');
    if (io) io.to(art._id.toString()).emit('like-updated', { likes: art.likes.length });
    res.json({ likes: art.likes.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};