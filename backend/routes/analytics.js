// routes/analytics.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/user', auth, analyticsController.getUserAnalytics);
router.get('/artwork/:artworkId', auth, analyticsController.getArtworkAnalytics);

module.exports = router;