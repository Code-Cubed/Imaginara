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

// NEW: Edit Comment
exports.editComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'Comment text cannot be empty.' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found.' });
    }

    // Authorization check: Only the creator can edit
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own comments.' });
    }
    
    // Update the comment text
    comment.text = text;
    await comment.save(); 
    
    // Populate user data for response consistency
    await comment.populate('user', 'name avatar');

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.to(comment.artwork.toString()).emit('comment-updated', comment);

    res.json(comment);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// NEW: Delete Comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found.' });
    }
    
    // Authorization check: Only the creator can delete
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own comments.' });
    }
    
    const artworkId = comment.artwork;
    
    // Delete the comment
    await comment.deleteOne();
    
    // Decrement the commentsCount on the artwork
    await Artwork.findByIdAndUpdate(artworkId, { $inc: { commentsCount: -1 } });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(artworkId.toString()).emit('comment-deleted', { commentId: req.params.id, artworkId });

    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};