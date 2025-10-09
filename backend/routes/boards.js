// routes/boards.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const boardController = require('../controllers/boardController');

// Board CRUD
router.post('/', auth, boardController.createBoard);
router.get('/', boardController.getAllBoards);
router.get('/:id', boardController.getBoard);
router.put('/:id', auth, boardController.updateBoard);
router.delete('/:id', auth, boardController.deleteBoard);

// Artwork management
router.post('/:id/artworks', auth, boardController.addArtworkToBoard);
router.delete('/:id/artworks/:artworkId', auth, boardController.removeArtworkFromBoard);

// Collaborator management
router.post('/:id/collaborators', auth, boardController.addCollaborator);
router.delete('/:id/collaborators/:userId', auth, boardController.removeCollaborator);

// Follow/unfollow
router.post('/:id/follow', auth, boardController.toggleFollowBoard);

// Get user's boards
router.get('/user/:userId', boardController.getUserBoards);

module.exports = router;