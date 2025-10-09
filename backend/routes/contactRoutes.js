const express = require('express');
const router = express.Router();
const { sendFeedback } = require('../controllers/contactController');

router.post('/', sendFeedback);

module.exports = router;
