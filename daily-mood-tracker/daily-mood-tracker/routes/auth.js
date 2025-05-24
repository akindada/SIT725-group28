const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// POST /api/auth/login - Universal Login (User or Admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Account not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// POST /api/auth/admin/login - Admin-Only Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(400).json({ msg: 'Admin account not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid admin credentials' });
    }

    const token = generateToken(admin);
    res.json({ token, role: 'admin' });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ msg: 'Server error during admin login' });
  }
});

// POST /api/auth/register - Register Regular User
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user',
    });

    await user.save();
    const token = generateToken(user);
    res.status(201).json({ token, role: 'user' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

module.exports = router;
