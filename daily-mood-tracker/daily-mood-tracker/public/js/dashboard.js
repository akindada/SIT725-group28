// Protect Dashboard: if no token, go back to home
if (!localStorage.getItem('token')) {
  window.location.href = '/';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/';
});

// Mood Form Submit
document.getElementById('moodForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const mood = document.getElementById('moodSelect').value;
  const description = document.getElementById('moodDescription').value;

  if (!mood) {
    alert('Please select a mood.');
    return;
  }

  try {
    const res = await fetch('/api/moods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ mood, description }) // backend expects description not notes
    });

    const data = await res.json();
    if (res.ok) {
      alert('Mood saved successfully!');
      loadMoodHistory(); // reload moods
    } else {
      alert(data.message || 'Failed to save mood');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
});

// Load mood history
async function loadMoodHistory() {
  try {
    const res = await fetch('/api/moods', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    const moods = await res.json();
    const moodHistoryDiv = document.getElementById('moodHistory');
    moodHistoryDiv.innerHTML = '';

    moods.forEach(mood => {
      const moodDiv = document.createElement('div');
      moodDiv.className = 'moodEntry';
      moodDiv.innerHTML = `
        <p><strong>Mood:</strong> ${mood.mood}</p>
        <p><strong>Notes:</strong> ${mood.description || 'None'}</p>
        <p><strong>Date:</strong> ${new Date(mood.date).toLocaleString()}</p>
      `;
      moodHistoryDiv.appendChild(moodDiv);
    });
  } catch (err) {
    console.error(err);
    alert('Failed to load mood history');
  }
}

// Load moods on page load
loadMoodHistory();
