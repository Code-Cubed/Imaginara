// controllers/commentController.js
const Comment = require('../models/Comment');
const Artwork = require('../models/Artwork');

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.create({ 
      artwork: req.params.id, 
      user: req.user._id, 
      text 
    });
    
    // Populate user data before sending response
    await comment.populate('user', 'name avatar');
    
    await Artwork.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
    
    // Emit via socket if available
    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('new-comment', comment);
    
    res.json(comment);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.listComments = async (req, res) => {
  try {
    const comments = await Comment.find({ artwork: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};