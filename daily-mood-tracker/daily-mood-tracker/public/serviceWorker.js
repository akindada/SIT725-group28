self.addEventListener('push', event => {
  let data = {
    title: 'Reminder',
    message: 'You have a new notification!'
  };

  try {
    if (event.data) {
      data = event.data.json(); // Try parsing as JSON
    }
  } catch (e) {
    console.warn('[Service Worker] Push message was not valid JSON:', e);
    data.message = event.data.text(); // Fallback to plain text
  }

  const notificationPromise = self.registration.showNotification(data.title, {
    body: data.message,
    tag: 'push-reminder'
  });

  event.waitUntil(notificationPromise);
});
