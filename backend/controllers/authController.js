const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { uploadToCloudinary } = require('../middlewares/upload');

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

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid creds' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid creds' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
