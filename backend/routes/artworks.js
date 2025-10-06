// routes/artworks.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const artworkController = require('../controllers/artworkController');

router.post('/', auth, upload.single('file'), artworkController.createArtwork);
router.get('/', artworkController.listArtworks);
router.get('/:id', artworkController.getArtwork);
router.post('/:id/view', artworkController.incrementView); // NEW: Separate view endpoint
router.post('/:id/like', auth, artworkController.likeArtwork);

module.exports = router;