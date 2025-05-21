const mongoose = require('mongoose');

// Define the reminder schema
const reminderSchema = new mongoose.Schema({
  message: { type: String, required: true },
  reminderDate: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Change to required: false
});

// Export the model
module.exports = mongoose.model('Reminder', reminderSchema);
