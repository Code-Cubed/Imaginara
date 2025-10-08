const User = require('../models/User');

// Toggle follow/unfollow
exports.toggleFollow = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    // Can't follow yourself
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId.toString()
      );

      await currentUser.save();
      await targetUser.save();

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.emit(`user:${targetUserId}:follower-removed`, {
          userId: currentUserId.toString(),
          followerCount: targetUser.followers.length
        });
      }

      return res.json({
        message: "Unfollowed successfully",
        isFollowing: false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length
      });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await currentUser.save();
      await targetUser.save();

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.emit(`user:${targetUserId}:new-follower`, {
          userId: currentUserId.toString(),
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          followerCount: targetUser.followers.length
        });
      }

      return res.json({
        message: "Followed successfully",
        isFollowing: true,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length
      });
    }
  } catch (err) {
    console.error('Toggle follow error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get followers list
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'name avatar email createdAt',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      followers: user.followers,
      total: user.followers.length,
      page: parseInt(page),
      pages: Math.ceil(user.followers.length / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get following list
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'name avatar email createdAt',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      following: user.following,
      total: user.following.length,
      page: parseInt(page),
      pages: Math.ceil(user.following.length / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if current user follows target user
exports.checkFollowStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUserId);

    res.json({ isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove follower (block)
exports.removeFollower = async (req, res) => {
  try {
    const { followerId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const follower = await User.findById(followerId);

    if (!follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove follower from current user's followers
    currentUser.followers = currentUser.followers.filter(
      id => id.toString() !== followerId
    );

    // Remove current user from follower's following
    follower.following = follower.following.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await follower.save();

    res.json({
      message: 'Follower removed successfully',
      followersCount: currentUser.followers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};