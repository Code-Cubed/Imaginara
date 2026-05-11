const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const User = require('../models/User');
const path = require('path');
const { uploadToCloudinary } = require('../middlewares/upload');
const { saveLocally, queueRetryUpload } = require('../utils/uploadQueue');

exports.createArtwork = async (req, res) => {
  try {
    const { title, description, tags = [], category, mediaType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let mediaUrl = null;
    let thumbnailUrl = null;
    let isPending = false;

    try {
      // ── Try Cloudinary first ──────────────────────────────────────────────
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        'gallery/media',
        mediaType || 'image'
      );

      mediaUrl = uploaded.secure_url;
      thumbnailUrl = uploaded.secure_url;

      if (mediaType === 'video' && uploaded.eager?.[0]) {
        thumbnailUrl = uploaded.eager[0].secure_url;
      } else if (mediaType === 'image' && uploaded.eager?.[0]) {
        thumbnailUrl = uploaded.eager[0].secure_url;
      } else if (mediaType === 'audio') {
        thumbnailUrl = 'https://res.cloudinary.com/your-cloud/image/upload/v1/defaults/audio-icon.png';
      } else if (mediaType === 'document') {
        thumbnailUrl = 'https://res.cloudinary.com/your-cloud/image/upload/v1/defaults/doc-icon.png';
      }

    } catch (cloudinaryErr) {
      // ── Cloudinary is down — save locally and queue retry ─────────────────
      console.warn('⚠️ Cloudinary unavailable, saving file locally for retry...');

      const filename = `${Date.now()}-${req.file.originalname}`;
      const filePath = await saveLocally(req.file.buffer, filename);

      // Use a local placeholder URL so the artwork is still created in DB
      mediaUrl = `/temp_uploads/${filename}`;
      thumbnailUrl = `/temp_uploads/${filename}`;
      isPending = true;

      // Create artwork first so we have an ID for the queue job
      const art = await Artwork.create({
        title,
        description,
        mediaUrl,
        thumbnailUrl,
        mediaType: mediaType || 'image',
        creator: req.user._id,
        tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags,
        category,
        embeddingsGenerated: false,
        isPending: true,
      });

      // Queue the retry job with the artwork ID
      await queueRetryUpload({
        filePath,
        folder: 'gallery/media',
        mediaType: mediaType || 'image',
        artworkId: art._id.toString(),
      });

      // Notify client — artwork created but media upload is pending
      return res.status(202).json({
        ...art.toObject(),
        message: 'Media service is temporarily unavailable. Your artwork has been saved and will be uploaded automatically once the service is restored.',
        isPending: true,
      });
    }

    // ── Cloudinary succeeded — normal flow ───────────────────────────────────
    const art = await Artwork.create({
      title,
      description,
      mediaUrl,
      thumbnailUrl,
      mediaType: mediaType || 'image',
      creator: req.user._id,
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags,
      category,
      embeddingsGenerated: false,
      isPending: false,
    });

    // Generate embeddings asynchronously
    generateEmbeddingsAsync(art._id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('artwork-uploaded', { 
        artwork: art,
        userId: req.user._id.toString() 
      });
    }

    res.json(art);
  } catch (err) {
    console.error('Upload error:', err);
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

    const artworkText = generateArtworkText(artwork);
    const textEmbedding = await generateTextEmbedding(artworkText);

    let imageEmbedding = null;
    if (artwork.mediaType === 'image' && artwork.mediaUrl) {
      imageEmbedding = await generateImageEmbedding(artwork.mediaUrl);
    }

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