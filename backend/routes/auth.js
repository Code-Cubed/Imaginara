const express = require('express');
const router = express.Router();
const passport = require('passport'); 
const authController = require('../controllers/authController');
const { upload } = require('../middlewares/upload');

router.post('/register', upload.single('avatar'), authController.register);
router.post('/verify-email', authController.verifyEmailOtp);
router.post('/resend-verification-otp', authController.resendVerificationOtp);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/reset-password-otp', authController.resetPasswordWithOtp);


// Initiate Google OAuth flow
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login?error=google_auth_failed' 
  }),
  authController.oauthSuccess
);



// Initiate GitHub OAuth flow
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'],
    session: false 
  })
);

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { 
    session: false,
    failureRedirect: '/login?error=github_auth_failed' 
  }),
  authController.oauthSuccess
);


router.get('/oauth/failure', authController.oauthFailure);

module.exports = router;