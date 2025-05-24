document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userTableBody = document.getElementById('userTableBody');
  const logoutBtn = document.getElementById('logoutBtn');

  const changePasswordModal = document.getElementById('changePasswordModal');
  const modalInstance = M.Modal.init(changePasswordModal);

  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordMessage = document.getElementById('passwordMessage');

  console.log('Admin Dashboard loaded. Token:', token);

  if (!token) {
    alert('Unauthorized. Please login.');
    window.location.href = '/admin/admin-login.html';
    return;
  }

  function checkResponse(res) {
    if (!res.ok) {
      return res.json()
        .then(data => {
          const msg = data.error || data.message || `HTTP ${res.status}`;
          throw new Error(msg);
        })
        .catch(() => {
          throw new Error(`HTTP ${res.status}`);
        });
    }
    return res.json();
  }

  fetch('/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(checkResponse)
    .then(data => {
      if (!data.user || data.user.role !== 'admin') {
        throw new Error('Admins only');
      }

      const dashEl = document.getElementById('dashboard-data');
      dashEl.innerHTML = `
        <p>Welcome, <strong>${data.user.email}</strong></p>
        <p>Role: <span class="new badge blue" data-badge-caption="">${data.user.role}</span></p>
      `;

      loadUsers();
    })
    .catch(err => {
      console.error('Access error:', err.message);
      alert('Access denied. Redirecting to login.');
      localStorage.removeItem('token');
      window.location.href = '/admin/admin-login.html';
    });

  function loadUsers() {
    console.log('Fetching user list...');
    fetch('/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(checkResponse)
      .then(data => {
        console.log('User fetch response:', data);
        const users = Array.isArray(data) ? data : data.users;

        if (!Array.isArray(users)) {
          throw new Error('Expected an array of users.');
        }

        userTableBody.innerHTML = '';

        users.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.username || 'N/A'}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'blue' : 'grey'}">${user.role}</span></td>
            <td>
              <span class="new badge ${user.suspended ? 'red' : 'green'}" data-badge-caption="">
                ${user.suspended ? 'Suspended' : 'Active'}
              </span>
            </td>
            <td>
              <button class="btn-small yellow darken-2 waves-effect waves-light" onclick="toggleSuspend('${user._id}', ${user.suspended})">
                ${user.suspended ? 'Unsuspend' : 'Suspend'}
              </button>
              <button class="btn-small red waves-effect waves-light" onclick="deleteUser('${user._id}')">
                Delete
              </button>
            </td>
          `;
          userTableBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error('Error loading users:', err.message);
        M.toast({ html: 'Failed to load users.', classes: 'red' });
      });
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/admin-login.html';
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
      .then(checkResponse)
      .then(data => {
        console.log(data.msg);
        M.toast({ html: data.msg, classes: 'green' });
        loadUsers();
      })
      .catch(err => {
        console.error('Suspend error:', err.message);
        M.toast({ html: err.message, classes: 'red' });
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
      .then(checkResponse)
      .then(data => {
        console.log(data.msg);
        M.toast({ html: data.msg, classes: 'green' });
        loadUsers();
      })
      .catch(err => {
        console.error('Delete error:', err.message);
        M.toast({ html: err.message, classes: 'red' });
      });
  };

  changePasswordBtn.addEventListener('click', () => {
    passwordMessage.textContent = '';
    changePasswordForm.reset();
    modalInstance.open();
  });

  changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (newPassword !== confirmPassword) {
      passwordMessage.textContent = 'New passwords do not match.';
      return;
    }

    if (newPassword.length < 6) {
      passwordMessage.textContent = 'New password must be at least 6 characters.';
      return;
    }

    fetch('/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })
      .then(checkResponse)
      .then(data => {
        M.toast({ html: 'Password changed successfully!', classes: 'green' });
        modalInstance.close();
      })
      .catch(err => {
        passwordMessage.textContent = err.message;
      });
  });
});
