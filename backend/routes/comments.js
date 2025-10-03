const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const commentController = require('../controllers/commentController');

router.post('/:id', auth, commentController.addComment);
router.get('/:id', commentController.listComments);

module.exports = router;
