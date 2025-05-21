document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();  // Prevent form from reloading page
  
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Registration failed');
  
      // If successful, redirect to login page or somewhere else
      alert('Registration successful! Redirecting to login...');
      window.location.href = '/login'; // or any other page
    } catch (err) {
      console.error('Error registering user:', err);
      alert('Registration failed, please try again.');
    }
  });
  