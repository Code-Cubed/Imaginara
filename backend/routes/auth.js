const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { upload } = require('../middlewares/upload'); // Import the Multer instance


router.post('/register', upload.single('avatar'), authController.register);


router.post('/login', authController.login);

router.post("/send-otp", authController.sendOtp); // send OTP to email
router.post("/reset-password-otp", authController.resetPasswordWithOtp);

module.exports = router;