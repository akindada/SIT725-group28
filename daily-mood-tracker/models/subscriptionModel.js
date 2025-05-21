const mongoose = require('mongoose');

// Define the subscription schema
const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
});

// Create the model (this works if mongoose is properly connected)
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Save the subscription
async function saveSubscription(subscriptionData) {
  try {
    // Check if the subscription already exists
    const existing = await Subscription.findOne({ endpoint: subscriptionData.endpoint });

    if (!existing) {
      // If subscription doesn't exist, create a new one and save
      const subscription = new Subscription(subscriptionData);
      await subscription.save();
      console.log('Subscription saved:', subscription);
    } else {
      console.log('Subscription already exists:', existing);
    }
  } catch (error) {
    console.error('Failed to save subscription:', error);
  }
}

// Get all subscriptions
async function getAllSubscriptions() {
  try {
    return await Subscription.find({});
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return [];
  }
}

module.exports = {
  Subscription,
  saveSubscription,
  getAllSubscriptions
};
