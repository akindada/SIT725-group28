const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
  },
  reminderDate: {
    type: Date,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // optional reference to a user
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Reminder', ReminderSchema);
