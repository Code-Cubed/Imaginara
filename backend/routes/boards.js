// routes/boards.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const boardController = require('../controllers/boardController');

// ⚠️ IMPORTANT: Specific routes FIRST, dynamic routes (:id) LAST

// ========== NEW: Auto-create boards (MUST BE FIRST) ==========
router.post('/auto-create', auth, boardController.autoCreateBoards);

// ========== NEW: Personal room routes (BEFORE /:id) ==========
router.post('/personal-rooms', auth, boardController.createPersonalRoom);
router.get('/personal-rooms/my-rooms', auth, boardController.getUserPersonalRooms);
router.get('/personal-rooms/:roomId/messages', auth, boardController.getPersonalRoomMessages);
router.post('/personal-rooms/:roomId/messages', auth, boardController.sendPersonalRoomMessage);

// ========== Get user's boards (BEFORE /:id) ==========
router.get('/user/:userId', boardController.getUserBoards);

// ========== Board CRUD (/:id routes) ==========
router.post('/', auth, boardController.createBoard);
router.get('/', boardController.getAllBoards);
router.get('/:id', boardController.getBoard);
router.put('/:id', auth, boardController.updateBoard);
router.delete('/:id', auth, boardController.deleteBoard);

// ========== NEW: Board chat routes ==========
router.get('/:id/chat', boardController.getBoardChatMessages);
router.post('/:id/chat', auth, boardController.sendChatMessage);

// ========== Artwork management ==========
router.post('/:id/artworks', auth, boardController.addArtworkToBoard);
router.delete('/:id/artworks/:artworkId', auth, boardController.removeArtworkFromBoard);

// ========== Collaborator management ==========
router.post('/:id/collaborators', auth, boardController.addCollaborator);
router.delete('/:id/collaborators/:userId', auth, boardController.removeCollaborator);

// ========== Follow/unfollow ==========
router.post('/:id/follow', auth, boardController.toggleFollowBoard);

module.exports = router;