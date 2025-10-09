// controllers/collectionController.js
const Collection = require('../models/Collection');
const Board = require('../models/Board');
const User = require('../models/User');

// Create collection
exports.createCollection = async (req, res) => {
  try {
    const { title, description, type, visibility, tags, category } = req.body;

    const collection = await Collection.create({
      title,
      description,
      type: type || 'personal',
      owner: req.user._id,
      visibility: visibility || 'public',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category
    });

    await collection.populate('owner', 'name avatar');

    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, visibility } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (visibility) filter.visibility = visibility;
    else filter.visibility = 'public'; // Default to public only

    const collections = await Collection.find(filter)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Collection.countDocuments(filter);

    res.json({
      collections,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single collection
exports.getCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .populate({
        path: 'boards',
        populate: { path: 'creator', select: 'name avatar' }
      })
      .populate({
        path: 'artworks.artwork',
        populate: { path: 'creator', select: 'name avatar' }
      });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check access permissions
    if (collection.visibility === 'private') {
      const isOwner = collection.owner._id.toString() === req.user?._id?.toString();
      const isMember = collection.members.some(
        m => m.user._id.toString() === req.user?._id?.toString()
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Increment views
    collection.stats.views += 1;
    await collection.save();

    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update collection
exports.updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check permissions
    const isOwner = collection.owner.toString() === req.user._id.toString();
    const isAdmin = collection.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { title, description, visibility, tags, category, settings } = req.body;

    if (title) collection.title = title;
    if (description !== undefined) collection.description = description;
    if (visibility && isOwner) collection.visibility = visibility;
    if (tags) collection.tags = tags.split(',').map(t => t.trim());
    if (category) collection.category = category;
    if (settings && isOwner) collection.settings = { ...collection.settings, ...settings };

    await collection.save();
    await collection.populate('owner', 'name avatar');
    await collection.populate('members.user', 'name avatar');

    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete collection
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Only owner can delete
    if (collection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete collection' });
    }

    await collection.deleteOne();
    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add member to collection
exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'contributor' } = req.body;
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check permissions
    const isOwner = collection.owner.toString() === req.user._id.toString();
    const canInvite = collection.settings.allowMemberInvites && 
      collection.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isOwner && !canInvite) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    const alreadyMember = collection.members.some(
      m => m.user.toString() === userId
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    collection.members.push({
      user: userId,
      role
    });

    await collection.save();
    await collection.populate('members.user', 'name avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('collection-invite', {
        collectionId: collection._id,
        collectionTitle: collection.title
      });
    }

    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check permissions
    const isOwner = collection.owner.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    collection.members = collection.members.filter(
      m => m.user.toString() !== userId
    );

    await collection.save();
    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add board to collection
exports.addBoardToCollection = async (req, res) => {
  try {
    const { boardId } = req.body;
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check permissions
    const isOwner = collection.owner.toString() === req.user._id.toString();
    const isContributor = collection.members.some(
      m => m.user.toString() === req.user._id.toString() && 
           (m.role === 'contributor' || m.role === 'admin')
    );

    if (!isOwner && !isContributor) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Check if board exists
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if already added
    if (collection.boards.includes(boardId)) {
      return res.status(400).json({ message: 'Board already in collection' });
    }

    collection.boards.push(boardId);
    collection.stats.totalBoards += 1;
    
    await collection.save();
    await collection.populate('boards');

    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove board from collection
exports.removeBoardFromCollection = async (req, res) => {
  try {
    const { boardId } = req.params;
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check permissions
    const isOwner = collection.owner.toString() === req.user._id.toString();
    const isAdmin = collection.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    collection.boards = collection.boards.filter(
      b => b.toString() !== boardId
    );
    collection.stats.totalBoards = Math.max(0, collection.stats.totalBoards - 1);

    await collection.save();
    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's collections
exports.getUserCollections = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const collections = await Collection.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    })
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Collection.countDocuments({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    res.json({
      collections,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};