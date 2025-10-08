const express = require('express');
const router = express.Router();
const { 
  toggleFollow, 
  getFollowers, 
  getFollowing, 
  checkFollowStatus,
  removeFollower 
} = require('../controllers/followController');
const auth = require('../middlewares/auth');

// POST /api/follow/:targetUserId - Toggle follow/unfollow
router.post('/:targetUserId', auth, toggleFollow);

// GET /api/follow/:userId/followers - Get user's followers
router.get('/:userId/followers', getFollowers);

// GET /api/follow/:userId/following - Get user's following
router.get('/:userId/following', getFollowing);

// GET /api/follow/check/:targetUserId - Check if following a user
router.get('/check/:targetUserId', auth, checkFollowStatus);

// DELETE /api/follow/remove/:followerId - Remove a follower
router.delete('/remove/:followerId', auth, removeFollower);

module.exports = router;