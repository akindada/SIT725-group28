const loginFormContent = document.getElementById('loginFormContent'); // Make sure this matches your form's ID

loginFormContent.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem('token', data.token); // Store token securely

      alert('Login successful!');

      // Redirect based on user role returned from backend
      const userRole = data.role || 'user';  // fallback to 'user' if role not present

      if (userRole === 'admin') {
        window.location.href = '/admin/dashboard'; 
      } else {
        window.location.href = '/'; 
      }
    } else {
      alert(data.msg || 'Login failed: Invalid credentials.');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Server error. Please try again later.');
  }
});
