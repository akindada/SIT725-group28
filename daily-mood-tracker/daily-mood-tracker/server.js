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
  'BNRDx4zdNpm4K1Lo1tDyR84Ci_aDqgd_GjyU3qX_MPXpkrMxu3uYJm-p2U8sNE4LI2TwklstKkBWMqmcKi3roDo',
  'znhzYVlg7tmNhtpcRapBdpN1nqLaMW9uNQp1LEbs1z0'
);

// Models
const User = require('./models/User');
const Mood = require('./models/Mood');
const Reminder = require('./models/reminderModel');
const { saveSubscription, getAllSubscriptions } = require('./models/subscriptionModel');

// Middleware
const rbacAdmin = require('./middleware/rbac-admin');
const adminDashboardRoutes = require('./routes/admin-dashboard');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', adminDashboardRoutes);
app.use('/api/reminders', reminderRoutes);

// MongoDB connection
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not defined in environment variables');
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connection error:', err));

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Routes

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ username, email, password: hashedPassword, role });
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || 'yoursecretkey');
    res.json({ token, user: { username, email, role: newUser.role } });
  } catch (err) {
    res.status(400).json({ msg: 'Registration failed', error: err.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey');
    res.json({ token, user: { username: user.username, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Login failed', error: err.message });
  }
});

// Admin login
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email });

    if (!admin) return res.status(400).json({ msg: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    if (admin.role !== 'admin') {
      return res.status(403).json({ msg: 'Not an admin user' });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    return res.json({ token, user: { username: admin.username, email, role: admin.role } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Mood entry (user)
app.post('/api/moods', authenticate, async (req, res) => {
  try {
    const { mood, description } = req.body;
    const newMood = await Mood.create({ userId: req.user.id, mood, description });
    res.json(newMood);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to save mood', error: err.message });
  }
});

// Get moods (user)
app.get('/api/moods', authenticate, async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.user.id, isDeleted: false }).sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch moods', error: err.message });
  }
});

// Admin mood management
app.get('/api/admin/moods', authenticate, rbacAdmin, async (req, res) => {
  try {
    const moods = await Mood.find({ isDeleted: false }).populate('userId', 'username email').sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch all moods', error: err.message });
  }
});

app.delete('/api/admin/moods/:id', authenticate, rbacAdmin, async (req, res) => {
  try {
    const moodId = req.params.id;
    const updatedMood = await Mood.findByIdAndUpdate(moodId, { isDeleted: true }, { new: true });
    if (!updatedMood) return res.status(404).json({ msg: 'Mood not found' });
    res.json({ msg: 'Mood deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete mood', error: err.message });
  }
});

// Serve Frontend Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-login.html')));
app.get('/admin/dashboard', authenticate, rbacAdmin, (req, res) => {
  console.log('Admin dashboard accessed');
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-dashboard.html'));
});

// Cron job runs every minute and triggers reminders exactly on time
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

app.post('/api/save-subscription', async (req, res) => {
  try {
    // Destructure the subscription data from the request body
    const { endpoint, expirationTime, keys } = req.body;

    // Check if the required fields are present in the subscription data
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Prepare subscription data
    const subscriptionData = { endpoint, expirationTime, keys };

    // Save the subscription using the imported saveSubscription function
    await saveSubscription(subscriptionData);

    // Respond with a success message
    res.status(200).json({ message: 'Subscription saved successfully!' });
  } catch (err) {
    console.error('Failed to save subscription:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// API endpoint to get all subscriptions
app.get('/api/subscriptions', async (req, res) => {
  try {
    // Get all subscriptions using the imported getAllSubscriptions function
    const subscriptions = await getAllSubscriptions();

    // Respond with the list of subscriptions
    res.status(200).json(subscriptions);
  } catch (err) {
    console.error('Failed to fetch subscriptions:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// API endpoint to send push notification
app.post('/api/send-notification', async (req, res) => {
  try {
    const subscriptions = await getAllSubscriptions();
    const payload = JSON.stringify({
      title: req.body.title,
      message: req.body.message
    });

    const sendPromises = subscriptions.map(sub =>
      webpush.sendNotification(sub, payload).catch(err => {
        console.error('Push error:', err);
      })
    );

    await Promise.all(sendPromises);
    res.status(200).json({ success: 'Push notifications sent.' });
  } catch (err) {
    console.error('Error sending notifications:', err);
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
