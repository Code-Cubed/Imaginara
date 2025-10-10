// controllers/boardController.js
const Board = require('../models/Board');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const PersonalRoom = require('../models/PersonalRoom');
// Create a new board

exports.autoCreateBoards = async (req, res) => {
  try {
    // 🎯 CRITICAL FIX: Filter artworks by the authenticated user's ID
    const currentUserId = req.user._id; 
    
    // Find only the artworks created by the current user
    const artworks = await Artwork.find({ creator: currentUserId }).populate('creator', 'name avatar');
    
    if (artworks.length === 0) {
      return res.status(400).json({ 
        message: 'No artworks found for this user to create boards' 
      });
    }

    const groupedByTitle = artworks.reduce((acc, artwork) => {
      // Ensure title is a string before calling trim
      const title = String(artwork.title).trim(); 
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(artwork);
      return acc;
    }, {});

    const createdBoards = [];
    for (const [title, artworksGroup] of Object.entries(groupedByTitle)) {
      // Check for existing board with the same title to avoid duplicates
      const existingBoard = await Board.findOne({ title: title });
      
      if (!existingBoard) {
        const firstArtwork = artworksGroup[0];
        
        const newBoard = new Board({
          title: title,
          description: `A collaborative collection of "${title}" artworks`,
          creator: currentUserId, // Use the authenticated user's ID as the board creator
          visibility: 'public',
          category: firstArtwork.category || 'General',
          artworks: artworksGroup.map(art => ({
            artwork: art._id,
            addedBy: art.creator._id,
            addedAt: new Date()
          })),
          coverImage: firstArtwork.thumbnailUrl || firstArtwork.mediaUrl,
          tags: firstArtwork.tags || []
        });

        await newBoard.save();
        createdBoards.push(newBoard);
      }
    }

    res.status(201).json({
      message: `${createdBoards.length} new boards created successfully`,
      boards: createdBoards
    });
  } catch (error) {
    console.error('Auto-create boards error:', error);
    // Include user ID in error logging for context
    console.error('User ID involved in error:', req.user ? req.user._id : 'N/A'); 
    res.status(500).json({ message: 'Server error during board creation', error: error.message });
  }
};

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
      .populate('collaborators', 'name avatar')
      .populate({
        path: 'artworks.artwork',
        populate: { path: 'creator', select: 'name avatar' }
      });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Increment view count
    board.stats.views += 1;
    await board.save();

    res.status(200).json(board);
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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


exports.getBoardChatMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ board: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.sendChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const boardId = req.params.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const chatMessage = new ChatMessage({
      board: boardId,
      user: req.user._id, // ✅ FIX: Changed from req.user.id to req.user._id
      message: message.trim(),
      type: 'text'
    });

    await chatMessage.save();
    await chatMessage.populate('user', 'name avatar');

    // Assuming Socket.IO is attached to req.io
    if (req.io) {
        req.io.to(`board-${boardId}`).emit('new-chat-message', chatMessage);
    }

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== NEW: Personal room functions ==========
exports.createPersonalRoom = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user._id; // ✅ FIX: Changed from req.user.id to req.user._id

    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID is required' });
    }
    
    // Ensure IDs are strings for comparison
    if (String(currentUserId) === String(otherUserId)) {
      return res.status(400).json({ message: 'Cannot create room with yourself' });
    }

    const existingRoom = await PersonalRoom.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    }).populate('participants', 'name avatar');

    if (existingRoom) {
      return res.status(200).json(existingRoom);
    }

    const roomId = [currentUserId, otherUserId].map(String).sort().join('-');
    const newRoom = new PersonalRoom({
      roomId: roomId,
      participants: [currentUserId, otherUserId]
    });

    await newRoom.save();
    await newRoom.populate('participants', 'name avatar');

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Create personal room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserPersonalRooms = async (req, res) => {
  try {
    const rooms = await PersonalRoom.find({
      participants: req.user._id // ✅ FIX: Changed from req.user.id to req.user._id
    })
    .populate('participants', 'name avatar')
    .populate({
      path: 'lastMessage',
      populate: { path: 'user', select: 'name' }
    })
    .sort({ updatedAt: -1 });

    res.status(200).json(rooms);
  } catch (error) {
    console.error('Get personal rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPersonalRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await PersonalRoom.findOne({
      roomId: roomId,
      participants: req.user._id // ✅ FIX: Changed from req.user.id to req.user._id
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const messages = await ChatMessage.find({ personalRoom: room._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendPersonalRoomMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Check if the current user is a participant of the room
    const room = await PersonalRoom.findOne({
      roomId: roomId,
      participants: req.user._id
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or unauthorized' });
    }

    const chatMessage = new ChatMessage({
      personalRoom: room._id,
      user: req.user._id, 
      message: message.trim(),
      type: 'text'
    });

    await chatMessage.save();
    await chatMessage.populate('user', 'name avatar');

    // Update the last message reference and updatedAt timestamp
    room.lastMessage = chatMessage._id;
    room.updatedAt = new Date();
    await room.save();
    
    // Assuming Socket.IO is attached to req.io
    if (req.io) {
        req.io.to(`room-${roomId}`).emit('new-personal-message', chatMessage);
    }

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send personal message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
