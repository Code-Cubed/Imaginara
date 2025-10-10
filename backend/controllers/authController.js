const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { default: EmailOTP } = require('../models/EmailOTP');
const { sendEmail } = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../middlewares/upload');

//  REGISTER 
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    let avatarUrl = '';
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'avatars');
      avatarUrl = uploaded.secure_url;
    }

    const user = await User.create({
      name,
      email,
      password: hashed,
      avatar: avatarUrl,
      provider: 'local', 
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  LOGIN 
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // ✅ NEW: Check if user is OAuth user
    if (user.provider !== 'local' || !user.password) {
      return res.status(400).json({ 
        message: `This account was created with ${user.provider}. Please use ${user.provider} login.` 
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        avatar: user.avatar 
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  SEND OTP 
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await EmailOTP.deleteMany({ email });

    await EmailOTP.create({
      email,
      otp,
      createdAt: Date.now(),
    });

    const subject = `Your OTP Code`;
    const emailBody = `<p>Your password reset OTP is <b>${otp}</b> (valid for 10 minutes)</p>`;

    await sendEmail(email, subject, emailBody);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

//  VERIFY OTP 
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await EmailOTP.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const isExpired = Date.now() - record.createdAt > 10 * 60 * 1000;
    if (isExpired) {
      await EmailOTP.deleteMany({ email });
      return res.status(400).json({ message: 'OTP expired' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

//  RESET PASSWORD USING OTP 
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const record = await EmailOTP.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const isExpired = Date.now() - record.createdAt > 10 * 60 * 1000;
    if (isExpired) {
      await EmailOTP.deleteMany({ email });
      return res.status(400).json({ message: 'OTP expired' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // ✅ NEW: Check if OAuth user
    if (user.provider !== 'local') {
      return res.status(400).json({ 
        message: `Cannot reset password for ${user.provider} accounts` 
      });
    }

    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedPass;
    await user.save();

    await EmailOTP.deleteMany({ email });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};


// NEW: OAUTH CALLBACK HANDLERS


// Handle successful OAuth authentication
exports.oauthSuccess = (req, res) => {
  try {
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('OAuth success error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// Handle OAuth failure
exports.oauthFailure = (req, res) => {
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendURL}/login?error=oauth_failed`);
};