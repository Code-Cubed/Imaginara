const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { default: EmailOTP } = require('../models/EmailOTP');
const { sendEmail } = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../middlewares/upload');

//  REGISTER - Now sends OTP instead of immediate login
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists and is verified, reject
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      // If user exists but not verified, allow re-registration
      await User.deleteOne({ email });
      await EmailOTP.deleteMany({ email });
    }

    const hashed = await bcrypt.hash(password, 10);

    let avatarUrl = '';
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'avatars');
      avatarUrl = uploaded.secure_url;
    }

    // Create user with isEmailVerified: false
    const user = await User.create({
      name,
      email,
      password: hashed,
      avatar: avatarUrl,
      provider: 'local',
      isEmailVerified: false, // User must verify email
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await EmailOTP.deleteMany({ email });

    // Save new OTP
    await EmailOTP.create({
      email,
      otp,
      createdAt: Date.now(),
    });

    // Send verification email
    const subject = 'Verify Your Email Address';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6a82fb;">Welcome to Our Platform! 🎉</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up! Please verify your email address using the OTP below:</p>
        <div style="background: linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h1 style="color: white; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `;

    await sendEmail(email, subject, emailBody);

    res.json({ 
      message: 'Registration successful! Please check your email for the verification OTP.',
      email: email,
      requiresVerification: true
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
};

//  VERIFY EMAIL OTP (New endpoint)
exports.verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await EmailOTP.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const isExpired = Date.now() - record.createdAt > 10 * 60 * 1000;
    if (isExpired) {
      await EmailOTP.deleteMany({ email });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Update user verification status
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.isEmailVerified = true;
    await user.save();

    // Delete OTP after successful verification
    await EmailOTP.deleteMany({ email });

    // Generate JWT token for automatic login after verification
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ 
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

//  RESEND VERIFICATION OTP (New endpoint)
exports.resendVerificationOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await EmailOTP.deleteMany({ email });
    await EmailOTP.create({
      email,
      otp,
      createdAt: Date.now(),
    });

    const subject = 'Your New Verification OTP';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6a82fb;">Email Verification</h2>
        <p>Your new verification OTP is:</p>
        <div style="background: linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h1 style="color: white; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong>.</p>
      </div>
    `;

    await sendEmail(email, subject, emailBody);

    res.json({ message: 'Verification OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

//  LOGIN - Now checks email verification
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if user is OAuth user
    if (user.provider !== 'local' || !user.password) {
      return res.status(400).json({ 
        message: `This account was created with ${user.provider}. Please use ${user.provider} login.` 
      });
    }

    // Check password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    // ✅ NEW: Check if email is verified
   

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

//  SEND OTP (for password reset)
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

//  VERIFY OTP (for password reset)
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

// OAUTH CALLBACK HANDLERS
exports.oauthSuccess = (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('OAuth success error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

exports.oauthFailure = (req, res) => {
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendURL}/login?error=oauth_failed`);
};