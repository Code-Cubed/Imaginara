const Board = require('../models/Board');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const PersonalRoom = require('../models/PersonalRoom');



// Join board as member
exports.joinBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if board allows member joining
    if (board.visibility === 'private' && !board.settings.allowMemberInvites) {
      return res.status(403).json({ message: 'This board is private' });
    }

    // Check if already a member
    if (board.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this board' });
    }

    // Add user as member
    board.addMember(req.user._id, 'member');
    await board.save();

    await board.populate('members.user', 'name avatar');
    await board.populate({
      path: 'artworks.artwork',
      populate: { path: 'creator', select: 'name avatar' }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`board-${board._id}`).emit('member-joined', {
        boardId: board._id,
        user: req.user,
        membersCount: board.members.length
      });
    }

    res.json({
      message: 'Successfully joined the board',
      board: board
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Leave board
exports.leaveBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member
    if (!board.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Not a member of this board' });
    }

    // Cannot leave if you're the creator (or handle differently)
    if (board.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave the board. Transfer ownership or delete the board instead.' });
    }

    // Remove user from members
    board.members = board.members.filter(member => 
      member.user.toString() !== req.user._id.toString()
    );
    board.stats.totalMembers = Math.max(0, board.stats.totalMembers - 1);
    
    await board.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`board-${board._id}`).emit('member-left', {
        boardId: board._id,
        userId: req.user._id,
        membersCount: board.members.length
      });
    }

    res.json({ message: 'Successfully left the board' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single board with all artworks and members
exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar')
      .populate({
        path: 'artworks.artwork',
        populate: { 
          path: 'creator', 
          select: 'name avatar' 
        }
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

// Add artwork to board (any member can add) - SINGLE VERSION
exports.addArtworkToBoard = async (req, res) => {
  try {
    const { artworkId, note } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is member and can add artworks
    if (!board.canAddArtworks(req.user._id)) {
      return res.status(403).json({ message: 'Permission denied. Join the board to add artworks.' });
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

    board.stats.totalArtworks += 1;
    board.lastActivity = new Date();
    await board.save();

    await board.populate({
      path: 'artworks.artwork',
      populate: { path: 'creator', select: 'name avatar' }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`board-${req.params.id}`).emit('artwork-added', {
        boardId: req.params.id,
        artwork: board.artworks[board.artworks.length - 1]
      });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all boards with proper filtering
exports.getAllBoards = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    
    const filter = { visibility: 'public' };
    
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      filter.category = category;
    }

    const boards = await Board.find(filter)
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ lastActivity: -1 })
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
      category,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    await board.populate('creator', 'name avatar');
    await board.populate('members.user', 'name avatar');

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

// Update board
exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check permissions - only creator or admin members can update
    const isCreator = board.creator.toString() === req.user._id.toString();
    const userMember = board.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = userMember && userMember.role === 'admin';

    if (!isCreator && !isAdmin) {
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
    await board.populate('members.user', 'name avatar');

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
    const userMember = board.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = userMember && userMember.role === 'admin';

    const artworkEntry = board.artworks.find(
      a => a.artwork.toString() === artworkId
    );
    const isAdder = artworkEntry?.addedBy.toString() === req.user._id.toString();

    if (!isCreator && !isAdmin && !isAdder) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    board.artworks = board.artworks.filter(
      a => a.artwork.toString() !== artworkId
    );

    board.stats.totalArtworks = Math.max(0, board.stats.totalArtworks - 1);
    board.lastActivity = new Date();
    await board.save();

    res.json(board);
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
        { 'members.user': userId }
      ]
    })
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Board.countDocuments({
      $or: [
        { creator: userId },
        { 'members.user': userId }
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

// Board chat functions
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

    // Check if user is member to send messages
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Join the board to participate in chat' });
    }

    const chatMessage = new ChatMessage({
      board: boardId,
      user: req.user._id,
      message: message.trim(),
      type: 'text'
    });

    await chatMessage.save();
    await chatMessage.populate('user', 'name avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`board-${boardId}`).emit('new-chat-message', chatMessage);
    }

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Personal room functions
exports.createPersonalRoom = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user._id;

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
      participants: req.user._id
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
      participants: req.user._id
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
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.to(`room-${roomId}`).emit('new-personal-message', chatMessage);
    }

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send personal message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};