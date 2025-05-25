// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const { saveSubscription, getAllSubscriptions } = require('../models/subscriptionModel');

// Save subscription
router.post('/save-subscription', async (req, res) => {
  try {
    const { endpoint, expirationTime, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    const subscriptionData = { endpoint, expirationTime, keys };

    await saveSubscription(subscriptionData);

    res.status(200).json({ message: 'Subscription saved successfully!' });
  } catch (err) {
    console.error('Failed to save subscription:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await getAllSubscriptions();
    res.status(200).json(subscriptions);
  } catch (err) {
    console.error('Failed to fetch subscriptions:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Send push notification
router.post('/send-notification', async (req, res) => {
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

module.exports = router;
