const createMood = async (req, res) => {
  const { mood, notes } = req.body;
  
  // Validate mood
  if (!mood) {
    return res.status(400).json({ msg: 'Mood is required' });
  }

  try {
    // Create new mood entry
    const newMood = new Mood({
      mood,
      notes,
      userId: req.user.id,  // Ensure this value is being populated correctly
      date: new Date()
    });

    await newMood.save();
    res.status(201).json({ msg: 'Mood saved successfully', newMood });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
