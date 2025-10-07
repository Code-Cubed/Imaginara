const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { upload } = require('../middlewares/upload'); // Import the Multer instance

// Apply the upload middleware BEFORE the controller. 
// It looks for a field named 'avatar' in the form data.
router.post('/register', upload.single('avatar'), authController.register);

router.post('/login', authController.login);

module.exports = router;