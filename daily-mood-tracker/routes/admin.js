const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const rbacAdmin = require('../middleware/rbac-admin');
const User = require('../models/User');
const path = require('path');
const router = express.Router();

// Admin Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Admin with this email already exists' });
    }

    const newAdmin = new User({ username, email, password, role: 'admin' });
    await newAdmin.save();

    const token = jwt.sign(
      { id: newAdmin._id, role: newAdmin.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      msg: 'Admin registered successfully',
      token,
      user: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ msg: 'Email and password are required' });
    }

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ msg: 'Admin not found or incorrect email' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ==== REPLACED /dashboard ROUTE ====
// Return admin dashboard data with auth and admin role check
router.get('/dashboard', authenticate, rbacAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email role');
    if (!user) {
      return res.status(404).json({ msg: 'Admin user not found' });
    }
    res.status(200).json({
      msg: `Welcome Admin ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Serve dashboard data (requires auth and admin role)
router.get('/dashboard/data', authenticate, rbacAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email role');
    if (!user) {
      return res.status(403).json({ msg: `Welcome Admin ${req.user.username}` });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get All Users (Paginated)
router.get('/users', authenticate, rbacAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({ role: 'user' });

    return res.status(200).json({
      users,
      totalUsers,
      page,
      totalPages: Math.ceil(totalUsers / limit)
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Create User
router.post('/users/create', authenticate, rbacAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    const newUser = new User({ username, email, password, role });
    await newUser.save();

    return res.status(201).json({ msg: 'User created successfully' });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Edit User
router.put('/users/:id/edit', authenticate, rbacAdmin, async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const userId = req.params.id;

    if (!username || !email || !role) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.username = username;
    user.email = email;
    user.role = role;

    await user.save();

    return res.status(200).json({ msg: 'User updated successfully' });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Suspend/Unsuspend User
router.put('/users/:id/suspend', authenticate, rbacAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.suspended = !user.suspended;
    await user.save();

    return res.status(200).json({ msg: `User ${user.suspended ? 'suspended' : 'unsuspended'} successfully` });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete User
router.delete('/users/:id', authenticate, rbacAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await user.deleteOne();

    return res.status(200).json({ msg: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Admin Analytics
router.get('/analytics', authenticate, rbacAdmin, async (req, res) => {
  try {
    const [totalUsers, totalAdmins, totalSuspended, totalActive] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ suspended: true }),
      User.countDocuments({ suspended: false })
    ]);

    return res.status(200).json({
      totalUsers,
      totalAdmins,
      totalSuspended,
      totalActive
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
