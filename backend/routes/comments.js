// routes/comments.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const commentController = require('../controllers/commentController');

router.post('/:id', auth, commentController.addComment);
router.get('/:id', commentController.listComments);
// NEW: Edit Comment route
router.put('/:id', auth, commentController.editComment);
// NEW: Delete Comment route
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;