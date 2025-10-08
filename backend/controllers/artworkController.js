const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const User = require('../models/User');
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
      category,
      embeddingsGenerated: false // Will be generated asynchronously
    });

    // Generate embeddings asynchronously (don't wait)
    generateEmbeddingsAsync(art._id);

    // Emit socket event for new upload
    const io = req.app.get('io');
    if (io) {
      io.emit('artwork-uploaded', { 
        artwork: art,
        userId: req.user._id.toString() 
      });
    }

    res.json(art);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

const generateEmbeddingsAsync = async (artworkId) => {
  try {
    const { 
      generateTextEmbedding, 
      generateImageEmbedding, 
      generateArtworkText 
    } = require('../utils/similarityService');
    
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return;

    // Generate text embedding
    const artworkText = generateArtworkText(artwork);
    const textEmbedding = await generateTextEmbedding(artworkText);

    // Generate image embedding (only for images)
    let imageEmbedding = null;
    if (artwork.mediaType === 'image' && artwork.mediaUrl) {
      imageEmbedding = await generateImageEmbedding(artwork.mediaUrl);
    }

    // Update artwork with embeddings
    artwork.textEmbedding = textEmbedding;
    if (imageEmbedding) {
      artwork.imageEmbedding = imageEmbedding;
    }
    artwork.embeddingsGenerated = true;

    await artwork.save();
    console.log(`Embeddings generated for artwork ${artworkId}`);
  } catch (error) {
    console.error(`Failed to generate embeddings for ${artworkId}:`, error);
  }
};

exports.getArtwork = async (req, res) => {
  try {
    const incrementView = req.query.incrementView === 'true';
    
    const art = await Artwork.findById(req.params.id).populate('creator', 'name avatar');
    if (!art) return res.status(404).json({ message: 'Not found' });
    
    if (incrementView) {
      art.views += 1;
      await art.save();
    }
    
    res.json(art);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.incrementView = async (req, res) => {
  try {
    const art = await Artwork.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true, select: 'views' }
    );
    
    if (!art) return res.status(404).json({ message: 'Not found' });
    
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
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.likeArtwork = async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: 'Not found' });
    const idx = art.likes.findIndex(u => u.toString() === req.user._id.toString());
    if (idx === -1) art.likes.push(req.user._id);
    else art.likes.splice(idx, 1);
    await art.save();
    
    const io = req.app.get('io');
    if (io) io.to(art._id.toString()).emit('like-updated', { likes: art.likes.length });
    res.json({ likes: art.likes.length });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// Bookmark/Save artwork
exports.bookmarkArtwork = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const artworkId = req.params.id;
    const idx = user.bookmarks.findIndex(b => b.toString() === artworkId);
    
    let bookmarked = false;
    if (idx === -1) {
      user.bookmarks.push(artworkId);
      bookmarked = true;
    } else {
      user.bookmarks.splice(idx, 1);
      bookmarked = false;
    }
    
    await user.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('bookmark-updated', { 
        userId: req.user._id.toString(),
        artworkId,
        bookmarked
      });
    }

    res.json({ 
      bookmarked,
      bookmarksCount: user.bookmarks.length 
    });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};


exports.deleteArtwork = async (req, res) => {
  try {
    const artworkId = req.params.id;
    
  
    const art = await Artwork.findById(artworkId);
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    if (art.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this artwork.' });
    }
    await art.deleteOne(); 
    await Comment.deleteMany({ artwork: artworkId });

    res.status(200).json({ message: 'Artwork and related comments deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};