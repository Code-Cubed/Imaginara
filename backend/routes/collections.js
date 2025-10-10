
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const collectionController = require('../controllers/collectionController');

// Collection CRUD
router.post('/', auth, collectionController.createCollection);
router.get('/', collectionController.getAllCollections);
router.get('/:id', collectionController.getCollection);
router.put('/:id', auth, collectionController.updateCollection);
router.delete('/:id', auth, collectionController.deleteCollection);

// Member management
router.post('/:id/members', auth, collectionController.addMember);
router.delete('/:id/members/:userId', auth, collectionController.removeMember);

// Board management
router.post('/:id/boards', auth, collectionController.addBoardToCollection);
router.delete('/:id/boards/:boardId', auth, collectionController.removeBoardFromCollection);

// Get user's collections
router.get('/user/:userId', collectionController.getUserCollections);

module.exports = router;