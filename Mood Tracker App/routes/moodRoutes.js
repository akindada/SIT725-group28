const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const authenticate = require('../middleware/authenticate');
const rbacAdmin = require('../middleware/rbac-admin');  // import this if used

// POST /api/moods — Save mood
router.post('/', authenticate, async (req, res) => {
  const { mood, description } = req.body;

  if (!mood) {
    return res.status(400).json({ msg: 'Mood is required' });
  }

  try {
    const newMood = new Mood({
      mood,
      description: description || '',
      userId: req.user.id,
      createdAt: new Date()
    });

    const savedMood = await newMood.save();
    res.status(201).json(savedMood);
  } catch (err) {
    console.error('Mood save error:', err);
    res.status(500).json({ msg: 'Server error while saving mood' });
  }
});

// GET /api/moods — Get mood history for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.user.id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/moods/:id — Update mood note
router.put('/:id', authenticate, async (req, res) => {
  const { description } = req.body;

  try {
    const updatedMood = await Mood.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { description },
      { new: true }
    );

    if (!updatedMood) {
      return res.status(404).json({ msg: 'Mood not found or unauthorized' });
    }

    res.status(200).json(updatedMood);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error while updating mood' });
  }
});

// Admin mood management — GET all moods (not deleted)
router.get('/admin', authenticate, rbacAdmin, async (req, res) => {
  try {
    const moods = await Mood.find({ isDeleted: false }).populate('userId', 'username email').sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch all moods', error: err.message });
  }
});

// Admin mood management — Soft delete mood by ID
router.delete('/admin/:id', authenticate, rbacAdmin, async (req, res) => {
  try {
    const moodId = req.params.id;
    const updatedMood = await Mood.findByIdAndUpdate(moodId, { isDeleted: true }, { new: true });
    if (!updatedMood) return res.status(404).json({ msg: 'Mood not found' });
    res.json({ msg: 'Mood deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to delete mood', error: err.message });
  }
});

module.exports = router;
