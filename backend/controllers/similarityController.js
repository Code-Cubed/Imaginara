// controllers/similarityController.js
const Artwork = require('../models/Artwork');
const {
  generateTextEmbedding,
  generateImageEmbedding,
  calculateArtworkSimilarity,
  generateArtworkText,
  cosineSimilarity
} = require('../utils/similarityService');

// Generate and save embeddings for an artwork
const generateAndSaveEmbeddings = async (artwork) => {
  try {
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
    return artwork;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return artwork;
  }
};

// Find similar artworks based on an existing artwork
exports.findSimilarArtworks = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { limit = 10 } = req.query;

    // Get the source artwork
    const sourceArtwork = await Artwork.findById(artworkId);
    if (!sourceArtwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Generate embeddings if not exists
    if (!sourceArtwork.embeddingsGenerated) {
      await generateAndSaveEmbeddings(sourceArtwork);
    }

    // Get all other artworks (excluding the source)
    const allArtworks = await Artwork.find({
      _id: { $ne: artworkId },
      flagged: false
    }).populate('creator', 'name avatar');

    // Calculate similarity scores
    const similarities = allArtworks.map(artwork => ({
      artwork,
      similarity: calculateArtworkSimilarity(sourceArtwork, artwork)
    }));

    // Sort by similarity and get top results
    const similar = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit))
      .map(item => ({
        ...item.artwork.toObject(),
        similarityScore: Math.round(item.similarity * 100)
      }));

    res.json({
      sourceArtwork: {
        id: sourceArtwork._id,
        title: sourceArtwork.title
      },
      similar,
      count: similar.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search similar artworks by text query
exports.searchSimilarByText = async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query text is required' });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateTextEmbedding(query);

    // Get all artworks
    const allArtworks = await Artwork.find({ flagged: false })
      .populate('creator', 'name avatar');

    // Generate embeddings for artworks that don't have them
    for (const artwork of allArtworks) {
      if (!artwork.embeddingsGenerated) {
        await generateAndSaveEmbeddings(artwork);
      }
    }

    // Calculate similarities based on text
    const similarities = allArtworks.map(artwork => {
      const textSim = artwork.textEmbedding 
        ? cosineSimilarity(queryEmbedding, artwork.textEmbedding)
        : 0;
      
      // Boost score if query words appear in title/description/tags
      const queryWords = query.toLowerCase().split(' ');
      const artworkText = generateArtworkText(artwork).toLowerCase();
      const wordMatches = queryWords.filter(word => artworkText.includes(word)).length;
      const wordBoost = wordMatches / queryWords.length * 0.3;

      return {
        artwork,
        similarity: textSim * 0.7 + wordBoost
      };
    });

    // Sort and return top results
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit))
      .map(item => ({
        ...item.artwork.toObject(),
        similarityScore: Math.round(item.similarity * 100)
      }));

    res.json({
      query,
      results,
      count: results.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search similar artworks by image upload
exports.searchSimilarByImage = async (req, res) => {
  try {
    const { imageUrl, limit = 10 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Generate embedding for the uploaded image
    const queryImageEmbedding = await generateImageEmbedding(imageUrl);

    // Get all image artworks
    const allArtworks = await Artwork.find({ 
      mediaType: 'image',
      flagged: false 
    }).populate('creator', 'name avatar');

    // Generate embeddings for artworks that don't have them
    for (const artwork of allArtworks) {
      if (!artwork.embeddingsGenerated) {
        await generateAndSaveEmbeddings(artwork);
      }
    }

    // Calculate similarities based on image
    const similarities = allArtworks.map(artwork => {
      const imageSim = artwork.imageEmbedding 
        ? cosineSimilarity(queryImageEmbedding, artwork.imageEmbedding)
        : 0;

      return {
        artwork,
        similarity: imageSim
      };
    });

    // Sort and return top results
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit))
      .map(item => ({
        ...item.artwork.toObject(),
        similarityScore: Math.round(item.similarity * 100)
      }));

    res.json({
      results,
      count: results.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Batch generate embeddings for all artworks (admin/maintenance endpoint)
exports.generateAllEmbeddings = async (req, res) => {
  try {
    const artworks = await Artwork.find({ embeddingsGenerated: { $ne: true } });
    
    let processed = 0;
    let failed = 0;

    for (const artwork of artworks) {
      try {
        await generateAndSaveEmbeddings(artwork);
        processed++;
      } catch (error) {
        console.error(`Failed to generate embeddings for ${artwork._id}:`, error);
        failed++;
      }
    }

    res.json({
      message: 'Embeddings generation complete',
      processed,
      failed,
      total: artworks.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};