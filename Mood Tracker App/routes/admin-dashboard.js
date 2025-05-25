const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Mongoose User model
const authenticate = require('../middleware/authenticate');
const rbacAdmin = require('../middleware/rbac-admin');

// Admin dashboard access (frontend uses it to validate access)
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email username role');

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admins only', user: null });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Fetch all users for admin table
router.get('/users', authenticate, rbacAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Could not retrieve users' });
  }
});

// Toggle suspension
router.put('/users/:id/suspend', authenticate, rbacAdmin, async (req, res) => {
  const { id } = req.params;
  const { suspend } = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, { suspended: suspend }, { new: true });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: `User ${suspend ? 'suspended' : 'unsuspended'} successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Suspension failed' });
  }
});

// Delete a user
router.delete('/users/:id', authenticate, rbacAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Delete failed' });
  }
});

module.exports = router;
