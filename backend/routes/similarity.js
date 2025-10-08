// routes/similarity.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const similarityController = require('../controllers/similarityController');

// Find similar artworks based on an existing artwork
router.get('/artwork/:artworkId', similarityController.findSimilarArtworks);

// Search similar artworks by text query
router.post('/search/text', similarityController.searchSimilarByText);

// Search similar artworks by image
router.post('/search/image', similarityController.searchSimilarByImage);

// Admin: Generate embeddings for all artworks
router.post('/generate-embeddings', auth, similarityController.generateAllEmbeddings);

module.exports = router;