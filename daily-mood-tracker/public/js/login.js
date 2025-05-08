loginFormContent.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem('token', data.token); // ✅ Store the token
      alert('Login successful!');

      // Assuming you have a way to check if the user is an admin, you can conditionally redirect.
      const userRole = data.role;  // Assuming the role is returned in the response
      if (userRole === 'admin') {
        window.location.href = '/admin/dashboard';  // Redirect to admin dashboard
      } else {
        window.location.href = '/';  // Redirect to homepage for regular users
      }
    } else {
      alert(data.msg || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
});
