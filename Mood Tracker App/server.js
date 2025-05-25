const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');  
const webpush = require('web-push');
const bodyParser = require('body-parser');

// VAPID details for push notifications
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Models
const User = require('./models/User');
const Mood = require('./models/Mood');
const Reminder = require('./models/reminderModel');
const { saveSubscription, getAllSubscriptions } = require('./models/subscriptionModel');

// Middleware
const rbacAdmin = require('./middleware/rbac-admin');
const adminRoutes = require('./routes/admin');
const reminderRoutes = require('./routes/reminderRoutes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const moodRoutes = require('./routes/moodRoutes'); // ✅ import the mood routes
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', adminRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/moods', moodRoutes); 
app.use('/api', subscriptionRoutes);

// Authentication middleware
const authenticate = require('./middleware/authenticate');

// Serve Frontend Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-login.html')));
app.get('/admin/dashboard', authenticate, rbacAdmin, (req, res) => {
  console.log('Admin dashboard accessed');
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-dashboard.html'));
});

// **PATCH: Serve admin-portal.html on /admin and /admin/ routes**
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-portal.html'));
});

app.get('/admin/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-register.html'));
});

// --- PATCH: Fixed cron job to run every minute and trigger reminders exactly on time ---
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const startOfMinute = new Date(now.setSeconds(0, 0));
    const endOfMinute = new Date(startOfMinute.getTime() + 60000);

    const reminders = await Reminder.find({
      reminderDate: { $gte: startOfMinute, $lt: endOfMinute }
    });

    reminders.forEach(reminder => {
      console.log(`✅ Reminder triggered: ${reminder.message} at ${reminder.reminderDate}`);
      // You can send push notification here if needed
    });
  } catch (err) {
    console.error('Error checking reminders:', err);
  }
});

// MongoDB connection

const startServer = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    return server;
  } catch (err) {
    console.error('DB connection error:', err);
    throw err;
  }
};

// Only start if running directly (e.g., `node server.js`)
if (require.main === module) {
  startServer();
}

// Export for test use
module.exports = { app, startServer };