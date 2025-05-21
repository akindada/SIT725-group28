document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userTableBody = document.getElementById('userTableBody');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!token) {
    alert('Unauthorized. Please login.');
    window.location.href = '/admin/login';
    return;
  }

  // Fetch and validate token
  fetch('/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.user || data.user.role !== 'admin') {
      throw new Error('Admins only');
    }

    // Show dashboard welcome message
    const dashEl = document.getElementById('dashboard-data');
    dashEl.innerHTML = `
      <p>Welcome, ${data.user.email}</p>
      <p>Role: ${data.user.role}</p>
    `;

    loadUsers();
  })
  .catch(err => {
    console.error('Access error:', err.message);
    alert('Access denied. Redirecting to login.');
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  });

  function loadUsers() {
    fetch('/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(users => {
      userTableBody.innerHTML = '';
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.username || 'N/A'}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.suspended ? 'Suspended' : 'Active'}</td>
          <td>
            <button class="btn-small yellow darken-2" onclick="toggleSuspend('${user._id}', ${user.suspended})">
              ${user.suspended ? 'Unsuspend' : 'Suspend'}
            </button>
            <button class="btn-small red" onclick="deleteUser('${user._id}')">
              Delete
            </button>
          </td>
        `;
        userTableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error('Error loading users:', err.message);
    });
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  });

  window.toggleSuspend = (id, currentStatus) => {
    fetch(`/admin/users/${id}/suspend`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ suspend: !currentStatus })
    })
    .then(res => res.json())
    .then(data => {
      console.log(data.msg);
      loadUsers();
    })
    .catch(err => {
      console.error('Suspend error:', err.message);
    });
  };

  window.deleteUser = (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    fetch(`/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log(data.msg);
      loadUsers();
    })
    .catch(err => {
      console.error('Delete error:', err.message);
    });
  };
});
