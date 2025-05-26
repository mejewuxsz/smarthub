document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const registerError = document.getElementById('registerError');

  if (registerForm) {
    registerForm.onsubmit = async function(e) {
      e.preventDefault();
      registerError.textContent = '';
      const first_name = document.getElementById('first_name').value;
      const last_name = document.getElementById('last_name').value;
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        const formData = new FormData();
        formData.append('first_name', first_name);
        formData.append('last_name', last_name);
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        const response = await fetch('/smarthub/api/register.php', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          window.location.href = '/smarthub/htmlfiles/login.html';
        } else {
          registerError.textContent = result.message || 'Registration failed.';
        }
      } catch (err) {
        registerError.textContent = 'An error occurred. Please try again.';
      }
    };
  }
}); 