// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');
const {upload} = require('../middlewares/upload');
// Public routes
router.get('/:userId/profile', userController.getUserProfile);
router.get('/:userId/uploads', userController.getUserUploads);
router.get('/:userId/likes', userController.getUserLikes);
router.get('/:userId/comments', userController.getUserComments);

// Protected routes
router.get('/:userId/bookmarks', auth, userController.getUserBookmarks);
router.delete('/account', auth, userController.deleteAccount);
router.put('/update', auth, upload.single('avatar'), userController.updateProfile);
router.put('/remove-avatar', auth, userController.removeAvatar);

module.exports = router;