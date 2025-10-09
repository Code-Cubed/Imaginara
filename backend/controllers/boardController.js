// controllers/boardController.js
const Board = require('../models/Board');
const Artwork = require('../models/Artwork');
const User = require('../models/User');

// Create a new board
exports.createBoard = async (req, res) => {
  try {
    const { title, description, visibility, tags, category } = req.body;

    const board = await Board.create({
      title,
      description,
      creator: req.user._id,
      visibility: visibility || 'public',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category
    });

    await board.populate('creator', 'name avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('board-created', {
        board,
        userId: req.user._id.toString()
      });
    }

    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all boards (with filters)
exports.getAllBoards = async (req, res) => {
  try {
    const { page = 1, limit = 20, visibility, category, userId } = req.query;
    
    const filter = {};
    if (visibility) filter.visibility = visibility;
    if (category) filter.category = category;
    if (userId) filter.creator = userId;
    
    // Only show public boards unless user is creator/collaborator
    if (!userId) {
      filter.visibility = 'public';
    }

    const boards = await Board.find(filter)
      .populate('creator', 'name avatar')
      .populate('collaborators.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Board.countDocuments(filter);

    res.json({
      boards,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single board
exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('creator', 'name avatar')
      .populate('collaborators.user', 'name avatar')
      .populate({
        path: 'artworks.artwork',
        populate: { path: 'creator', select: 'name avatar' }
      })
      .populate('artworks.addedBy', 'name avatar');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check visibility permissions
    if (board.visibility === 'private') {
      const isCreator = board.creator._id.toString() === req.user?._id?.toString();
      const isCollaborator = board.collaborators.some(
        c => c.user._id.toString() === req.user?._id?.toString()
      );
      
      if (!isCreator && !isCollaborator) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Increment view count
    board.stats.views += 1;
    await board.save();

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update board
exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check permissions
    const isCreator = board.creator.toString() === req.user._id.toString();
    const isEditor = board.collaborators.some(
      c => c.user.toString() === req.user._id.toString() && c.role === 'editor'
    );

    if (!isCreator && !isEditor) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { title, description, visibility, tags, category, settings } = req.body;

    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (visibility && isCreator) board.visibility = visibility; // Only creator can change visibility
    if (tags) board.tags = tags.split(',').map(t => t.trim());
    if (category) board.category = category;
    if (settings && isCreator) board.settings = { ...board.settings, ...settings };

    board.lastActivity = new Date();
    await board.save();

    await board.populate('creator', 'name avatar');
    await board.populate('collaborators.user', 'name avatar');

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete board
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only creator can delete
    if (board.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete board' });
    }

    await board.deleteOne();
    res.json({ message: 'Board deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add artwork to board
exports.addArtworkToBoard = async (req, res) => {
  try {
    const { artworkId, note } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check permissions
    const isCreator = board.creator.toString() === req.user._id.toString();
    const isCollaborator = board.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );

    if (!isCreator && !isCollaborator && !board.settings.allowContributions) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if already added
    const alreadyAdded = board.artworks.some(
      a => a.artwork.toString() === artworkId
    );

    if (alreadyAdded) {
      return res.status(400).json({ message: 'Artwork already in board' });
    }

    board.artworks.push({
      artwork: artworkId,
      addedBy: req.user._id,
      note
    });

    board.lastActivity = new Date();
    await board.save();

    await board.populate({
      path: 'artworks.artwork',
      populate: { path: 'creator', select: 'name avatar' }
    });
    await board.populate('artworks.addedBy', 'name avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('artwork-added', {
        boardId: req.params.id,
        artwork: board.artworks[board.artworks.length - 1]
      });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove artwork from board
exports.removeArtworkFromBoard = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check permissions
    const isCreator = board.creator.toString() === req.user._id.toString();
    const isCollaborator = board.collaborators.some(
      c => c.user.toString() === req.user._id.toString() && c.role === 'editor'
    );

    const artworkEntry = board.artworks.find(
      a => a.artwork.toString() === artworkId
    );
    const isAdder = artworkEntry?.addedBy.toString() === req.user._id.toString();

    if (!isCreator && !isCollaborator && !isAdder) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    board.artworks = board.artworks.filter(
      a => a.artwork.toString() !== artworkId
    );

    board.lastActivity = new Date();
    await board.save();

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add collaborator to board
exports.addCollaborator = async (req, res) => {
  try {
    const { userId, role = 'editor' } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only creator can add collaborators
    if (board.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can add collaborators' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a collaborator
    const alreadyCollaborator = board.collaborators.some(
      c => c.user.toString() === userId
    );

    if (alreadyCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    board.collaborators.push({
      user: userId,
      role
    });

    await board.save();
    await board.populate('collaborators.user', 'name avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('collaborator-added', {
        boardId: board._id,
        boardTitle: board.title
      });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove collaborator
exports.removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.params;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only creator can remove collaborators
    if (board.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can remove collaborators' });
    }

    board.collaborators = board.collaborators.filter(
      c => c.user.toString() !== userId
    );

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Follow/unfollow board
exports.toggleFollowBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const userId = req.user._id;
    const isFollowing = board.followers.some(f => f.toString() === userId.toString());

    if (isFollowing) {
      board.followers = board.followers.filter(f => f.toString() !== userId.toString());
    } else {
      board.followers.push(userId);
    }

    await board.save();

    res.json({
      isFollowing: !isFollowing,
      followersCount: board.followers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's boards
exports.getUserBoards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const boards = await Board.find({
      $or: [
        { creator: userId },
        { 'collaborators.user': userId }
      ]
    })
      .populate('creator', 'name avatar')
      .populate('collaborators.user', 'name avatar')
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Board.countDocuments({
      $or: [
        { creator: userId },
        { 'collaborators.user': userId }
      ]
    });

    res.json({
      boards,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};