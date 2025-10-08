
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const { uploadToCloudinary } = require('../middlewares/upload');
// Get user's uploaded artworks
exports.getUserUploads = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const artworks = await Artwork.find({ creator: userId, flagged: false })
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Artwork.countDocuments({ creator: userId, flagged: false });

    res.json({
      artworks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's bookmarked artworks
exports.getUserBookmarks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).select('bookmarks');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skip = (page - 1) * limit;
    const bookmarkIds = user.bookmarks.slice(skip, skip + parseInt(limit));

    const artworks = await Artwork.find({ 
      _id: { $in: bookmarkIds },
      flagged: false 
    }).populate('creator', 'name avatar');

    res.json({
      artworks,
      total: user.bookmarks.length,
      page: parseInt(page),
      pages: Math.ceil(user.bookmarks.length / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's liked artworks
exports.getUserLikes = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const artworks = await Artwork.find({ 
      likes: userId,
      flagged: false 
    })
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Artwork.countDocuments({ likes: userId, flagged: false });

    res.json({
      artworks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's comments
exports.getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ user: userId })
      .populate('user', 'name avatar')
      .populate('artwork', 'title thumbnailUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ user: userId });

    res.json({
      comments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user account and all associated data
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userArtworks = await Artwork.find({ creator: userId });
    const artworkIds = userArtworks.map(art => art._id);
    
   
    await Comment.deleteMany({ artwork: { $in: artworkIds } });
    
  
    await Comment.deleteMany({ user: userId });
    
    await Artwork.deleteMany({ creator: userId });
    
   
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    
   
    await Artwork.updateMany(
      { likes: userId },
      { $pull: { likes: userId } }
    );
    
    // Delete the user account
    await User.findByIdAndDelete(userId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('user-deleted', { userId: userId.toString() });

    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get counts
    const uploadsCount = await Artwork.countDocuments({ creator: userId, flagged: false });
    const likesCount = await Artwork.countDocuments({ likes: userId, flagged: false });
    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    res.json({
      user,
      stats: {
        uploads: uploadsCount,
        likes: likesCount,
        followers: followersCount,
        following: followingCount
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile (name, bio, avatar)
exports.updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name) updates.name = req.body.name;
    

    // Upload new avatar if provided
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'avatars');
      updates.avatar = uploaded.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove avatar
exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: '' },
      { new: true }
    ).select('-password');

    res.json({ message: 'Avatar removed successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.discoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { limit = 20 } = req.query;

    // Get current user's following list
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser.following.map(id => id.toString());

    // Find users that current user is NOT following (excluding self)
    const users = await User.find({
      _id: { 
        $nin: [...followingIds, currentUserId] 
      }
    })
    .select('name email avatar bio followers')
    .limit(parseInt(limit))
    .lean();

    // Add additional info for each user
    const usersWithInfo = await Promise.all(
      users.map(async (user) => {
        const uploadsCount = await Artwork.countDocuments({ 
          creator: user._id, 
          flagged: false 
        });

        return {
          ...user,
          followersCount: user.followers.length,
          uploadsCount,
          isFollowing: false
        };
      })
    );

    // Sort by follower count (most popular first)
    usersWithInfo.sort((a, b) => b.followersCount - a.followersCount);

    res.json({ users: usersWithInfo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search users by name or email
exports.searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters' 
      });
    }

    // Get current user's following list
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser.following.map(id => id.toString());

    // Search users by name or email (case-insensitive)
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email avatar bio followers')
    .limit(parseInt(limit))
    .lean();

    // Add additional info for each user
    const usersWithInfo = await Promise.all(
      users.map(async (user) => {
        const uploadsCount = await Artwork.countDocuments({ 
          creator: user._id, 
          flagged: false 
        });

        return {
          ...user,
          followersCount: user.followers.length,
          uploadsCount,
          isFollowing: followingIds.includes(user._id.toString())
        };
      })
    );

    res.json({ users: usersWithInfo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get popular users (most followed)
exports.getPopularUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.aggregate([
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          bio: 1,
          followersCount: { $size: '$followers' }
        }
      },
      {
        $sort: { followersCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Add uploads count for each user
    const usersWithUploads = await Promise.all(
      users.map(async (user) => {
        const uploadsCount = await Artwork.countDocuments({ 
          creator: user._id, 
          flagged: false 
        });
        return { ...user, uploadsCount };
      })
    );

    res.json({ users: usersWithUploads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};