const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const User = require('../models/User'); // Assuming you have a User model
const router = express.Router();

// Helper function to check if a user is an admin
const isAdmin = (req) => req.user && req.user.role === 'admin';

// POST /api/admin/register - Admin registration
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      suspended: false
    });

    await newAdmin.save();

    const token = jwt.sign(
      { id: newAdmin._id, role: newAdmin.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' } 
    );

    return res.status(201).json({ msg: 'Admin registered successfully', token });
  } catch (err) {
    console.error('Error during admin registration:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(400).json({ msg: 'Admin not found or incorrect email' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' } 
    );

    return res.status(200).json({ msg: 'Login successful', token });
  } catch (err) {
    console.error('Error during admin login:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', authenticate, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ msg: 'Admins only' });
  }

  try {
    const users = await User.find({ role: 'user' }).select('-password');
    return res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/admin/users/create - Create a new user
router.post('/users/create', authenticate, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ msg: 'Admins only' });
  }

  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      suspended: false
    });

    await newUser.save();

    return res.status(201).json({ msg: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/users/:id/edit - Edit user details
router.put('/users/:id/edit', authenticate, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ msg: 'Admins only' });
  }

  try {
    const { username, email, role } = req.body;
    const userId = req.params.id;

    if (!username || !email || !role) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.username = username;
    user.email = email;
    user.role = role;

    await user.save();

    return res.status(200).json({ msg: 'User updated successfully' });
  } catch (err) {
    console.error('Error editing user:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/users/:id/suspend - Suspend or unsuspend a user
router.put('/users/:id/suspend', authenticate, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ msg: 'Admins only' });
  }

  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.suspended = !user.suspended;
    await user.save();

    return res.status(200).json({ msg: `User ${user.suspended ? 'suspended' : 'unsuspended'} successfully` });
  } catch (err) {
    console.error('Error suspending/unsuspending user:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ msg: 'Admins only' });
  }

  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ msg: 'User not found' });

    await user.deleteOne();

    return res.status(200).json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/admin/dashboard - Return admin user info
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email role');

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admins only', user: null });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Error in admin dashboard route:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/admin/analytics - Admin-only user analytics
router.get('/analytics', authenticate, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ msg: 'Admins only' });
  }

  try {
    const [totalUsers, totalAdmins, totalSuspended, totalActive] = await Promise.all([
      User.countDocuments({}),
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
    console.error('Error fetching analytics:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
