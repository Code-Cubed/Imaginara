const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const boardController = require('../controllers/boardController');
const Board = require('../models/Board');

// ========== NEW: Member joining routes ==========
router.post('/:id/join', auth, boardController.joinBoard);
router.post('/:id/leave', auth, boardController.leaveBoard);

// ========== Personal room routes ==========
router.post('/personal-rooms', auth, boardController.createPersonalRoom);
router.get('/personal-rooms/my-rooms', auth, boardController.getUserPersonalRooms);
router.get('/personal-rooms/:roomId/messages', auth, boardController.getPersonalRoomMessages);
router.post('/personal-rooms/:roomId/messages', auth, boardController.sendPersonalRoomMessage);

// ========== Board CRUD ==========
router.post('/', auth, boardController.createBoard);
router.get('/', boardController.getAllBoards);
router.get('/:id', boardController.getBoard);
router.put('/:id', auth, boardController.updateBoard);
router.delete('/:id', auth, boardController.deleteBoard);

// ========== Chat routes ==========
router.get('/:id/chat', boardController.getBoardChatMessages);
router.post('/:id/chat', auth, boardController.sendChatMessage);

// ========== Artwork management - FIXED ==========
router.post('/:id/add-artwork', auth, async (req, res) => {
  try {
    const { artworkIds, note } = req.body;
    
    if (!artworkIds || !Array.isArray(artworkIds) || artworkIds.length === 0) {
      return res.status(400).json({ message: 'artworkIds array is required' });
    }

    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is member and can add artworks
    if (!board.canAddArtworks(req.user._id)) {
      return res.status(403).json({ message: 'Permission denied. Join the board to add artworks.' });
    }

    let addedCount = 0;

    // Add multiple artworks, avoiding duplicates
    for (const artworkId of artworkIds) {
      const alreadyExists = board.artworks.some(
        (item) => item.artwork.toString() === artworkId
      );
      
      if (!alreadyExists) {
        board.artworks.push({
          artwork: artworkId,
          addedBy: req.user._id,
          addedAt: new Date(),
          note: note || ''
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      board.stats.totalArtworks += addedCount;
      board.lastActivity = new Date();
      await board.save();

      // Populate the artworks for response
      await board.populate({
        path: 'artworks.artwork',
        populate: { path: 'creator', select: 'name avatar' }
      });

      // FIXED: Emit socket event without prefix (matching frontend)
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.id).emit('artwork-added', {
          boardId: req.params.id,
          addedCount: addedCount
        });
        console.log(`🎨 Artwork-added event emitted to board ${req.params.id}`);
      }
    }

    res.status(200).json({ 
      message: `${addedCount} artwork(s) added successfully`, 
      board,
      addedCount 
    });
  } catch (err) {
    console.error('Error adding artwork:', err);
    res.status(500).json({ 
      message: 'Server error while adding artwork',
      error: err.message 
    });
  }
});

// Remove artwork from board
router.delete('/:id/artworks/:artworkId', auth, boardController.removeArtworkFromBoard);

//  User boards 
router.get('/user/:userId', boardController.getUserBoards);

module.exports = router;