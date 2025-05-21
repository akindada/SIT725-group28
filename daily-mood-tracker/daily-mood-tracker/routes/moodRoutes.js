const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const authenticate = require('../middleware/authenticate'); // Middleware to check token

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
    const moods = await Mood.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
