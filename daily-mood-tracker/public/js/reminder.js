const publicVapidKey = 'BNRDx4zdNpm4K1Lo1tDyR84Ci_aDqgd_GjyU3qX_MPXpkrMxu3uYJm-p2U8sNE4LI2TwklstKkBWMqmcKi3roDo';

// Convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// Register service worker and subscribe
async function registerServiceWorkerAndSubscribe() {
  try {
    const register = await navigator.serviceWorker.register('/serviceWorker.js', { scope: '/' });

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Please allow notifications to receive reminders!');
      return;
    }

    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    await fetch('/api/save-subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Subscribed and sent to server.');
  } catch (err) {
    console.error('Error registering service worker or subscribing:', err);
  }
}

// Save a reminder to localStorage
function saveReminder(eventTime, title, message) {
  const reminder = {
    eventTime,
    title,
    message,
    isUpcoming: true
  };

  const existing = JSON.parse(localStorage.getItem('reminderHistory')) || [];
  existing.push(reminder);
  localStorage.setItem('reminderHistory', JSON.stringify(existing));

  console.log('Reminder saved:', reminder);
}

// Load upcoming reminder (within 10 minutes of now)
function getUpcomingReminder() {
  const now = new Date();
  const reminders = JSON.parse(localStorage.getItem('reminderHistory')) || [];

  const upcomingReminder = reminders.find(reminder => {
    const reminderTime = new Date(reminder.eventTime);
    const timeDiff = (reminderTime - now) / 1000; // in seconds
    return timeDiff > 0 && timeDiff <= 600 && reminder.isUpcoming;
  });

  if (upcomingReminder) {
    const reminderTime = new Date(upcomingReminder.eventTime);
    const remainingTime = reminderTime - now; // in milliseconds
    const minutesRemaining = Math.floor(remainingTime / 60000);
    const secondsRemaining = Math.floor((remainingTime % 60000) / 1000);

    upcomingReminder.message = `Reminder: ${minutesRemaining} mins and ${secondsRemaining} seconds to your event: ${upcomingReminder.message}`;
  }

  return upcomingReminder;
}

// Init on load
if ('serviceWorker' in navigator) {
  registerServiceWorkerAndSubscribe();

  window.addEventListener('DOMContentLoaded', () => {
    const reminders = JSON.parse(localStorage.getItem('reminderHistory')) || [];
    console.log('Loaded reminders:', reminders);
  });
}

// Send test notification (only if upcoming event exists)
document.getElementById('send-test').addEventListener('click', () => {
  console.log('Send Test Notification clicked');

  const reminder = getUpcomingReminder();
  if (reminder && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'TEST_NOTIFICATION',
      title: reminder.title || 'Upcoming Reminder',
      message: reminder.message || 'Don’t forget this event!'
    });
    console.log('Upcoming reminder found and sent to service worker:', reminder);
  } else {
    console.warn('No upcoming reminders within 10 mins or no Service Worker controller.');
  }
});
