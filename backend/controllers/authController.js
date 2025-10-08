const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { default: EmailOTP } = require('../models/EmailOTP');
const { sendEmail } = require('../utils/sendEmail');

const { uploadToCloudinary } = require('../middlewares/upload');

// ---------- REGISTER ----------
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Upload avatar if provided
    let avatarUrl = '';
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'avatars');
      avatarUrl = uploaded.secure_url;
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashed,
      avatar: avatarUrl,
    });

    // Generate token
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

// ---------- LOGIN ----------
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- SEND OTP ----------
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    
    const existingOtp = await EmailOTP.find({ email });
    if(existingOtp.length){
      await EmailOTP.deleteMany({ email });
    }
    
    // Save OTP to DB

    const newEmailOtp = await EmailOTP.create({
      email,
      otp: otp.toString(),
      createdAt: Date.now()
    })



    

    const subject = `"our OTP Code`;
    const emailbody = `<p>Your password reset OTP is <b>${otp}</b> (valid for 10 minutes)</p>`;
    try {
      sendEmail(email, subject, emailbody);
    } catch (error) {
      console.error(error);
      return res.json({message: "email error in creating battle "});
    }

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};



// ---------- RESET PASSWORD ----------
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedPass;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
