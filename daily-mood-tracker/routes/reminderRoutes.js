const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Reminder = require('../models/reminderModel');
const cron = require('node-cron'); // For scheduling notifications
const moment = require('moment');

// In-memory subscription store (for demo only)
const subscriptions = [];

// ✅ Your VAPID Keys
const publicVapidKey = 'BPzg0aMxsm19JJEUrZltxQCAOLdMIenjox2lqrhz7CHt_uEEIahkh2t5FQBqFRTpXClQiFTKVyTqg0Xt0pXXOvU';
const privateVapidKey = 'gbL69yZ4ocnmdkfUefek3Ht8I4Zq5vTc0CGgw7Fk1Qw';

// Web-push setup
webpush.setVapidDetails(
  'mailto:your@email.com',
  publicVapidKey,
  privateVapidKey
);

// ------------------ Reminder API ------------------

// @route   POST /api/reminders
router.post('/', async (req, res) => {
  const { message, reminderDate, userId } = req.body;  // Added userId as optional

  if (!message || !reminderDate) {
    return res.status(400).json({ msg: 'Message and reminder date are required.' });
  }

  try {
    const reminder = new Reminder({
      message,
      reminderDate: new Date(reminderDate),
      userId: userId || null, // Optional: If userId is not provided, it will be null
    });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    console.error('Error creating reminder:', err.message); // Log error to help with debugging
    res.status(500).json({ msg: 'Error creating reminder', error: err.message });
  }
});

// @route   GET /api/reminders
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find().sort({ reminderDate: 1 });
    res.json(reminders);
  } catch (err) {
    console.error('Error fetching reminders:', err.message); // Log error to help with debugging
    res.status(500).json({ msg: 'Error fetching reminders', error: err.message });
  }
});

// @route   GET /api/reminders/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const upcomingReminders = await Reminder.find({
      reminderDate: { $gte: now },
    }).sort({ reminderDate: 1 });

    res.json(upcomingReminders);
  } catch (err) {
    console.error('Error fetching upcoming reminders:', err.message); // Log error to help with debugging
    res.status(500).json({ msg: 'Error fetching upcoming reminders', error: err.message });
  }
});

// @route   DELETE /api/reminders/:id
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }
    res.json({ msg: 'Reminder deleted successfully' });
  } catch (err) {
    console.error('Error deleting reminder:', err.message); // Log error to help with debugging
    res.status(500).json({ msg: 'Error deleting reminder', error: err.message });
  }
});

// ------------------ Web Push Notification Routes ------------------

// @route   POST /api/save-subscription
router.post('/save-subscription', (req, res) => {
  const subscription = req.body;

  // Prevent duplicate subscriptions
  const exists = subscriptions.find(sub => sub.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }

  res.status(201).json({ message: 'Subscription saved successfully.' });
});

// Function to send notifications
const sendNotification = (subscription, message) => {
  const payload = JSON.stringify({
    title: 'Reminder Notification',
    body: message,
  });

  return webpush.sendNotification(subscription, payload).catch(err => {
    console.error('Push error:', err.message);
  });
};

// Cron job to check for reminders every minute
cron.schedule('* * * * *', async () => {
  const now = moment();
  try {
    const upcomingReminders = await Reminder.find({
      reminderDate: { $lte: now.toDate() }, // Find reminders whose time has passed or is now
    });

    if (upcomingReminders.length > 0) {
      upcomingReminders.forEach(reminder => {
        const message = reminder.message;
        
        // Send push notifications for each upcoming reminder
        subscriptions.forEach(sub => {
          sendNotification(sub, message);
        });

        // Delete the reminder after it has been sent
        Reminder.findByIdAndDelete(reminder._id).catch(err => {
          console.error('Error deleting reminder after sending notification:', err);
        });
      });
    }
  } catch (err) {
    console.error('Error checking reminders:', err.message); // Log error to help with debugging
  }
});

// @route   POST /api/send-test-notification
router.post('/send-test-notification', async (req, res) => {
  const payload = JSON.stringify({
    title: 'Test Notification',
    body: '🎉 You have successfully subscribed to daily reminders!',
  });

  try {
    await Promise.all(
      subscriptions.map(sub =>
        webpush.sendNotification(sub, payload).catch(err => {
          console.error('Push error:', err.message); // Log error to help with debugging
        })
      )
    );
    res.status(200).json({ message: 'Test notification sent.' });
  } catch (err) {
    console.error('Error sending notification:', err.message); // Log error to help with debugging
    res.status(500).json({ error: 'Failed to send test notification.' });
  }
});

module.exports = router;
