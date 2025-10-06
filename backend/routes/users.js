// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

// Public routes
router.get('/:userId/profile', userController.getUserProfile);
router.get('/:userId/uploads', userController.getUserUploads);
router.get('/:userId/comments', userController.getUserComments);

// Protected routes
router.get('/:userId/bookmarks', auth, userController.getUserBookmarks);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router;