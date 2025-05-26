document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (loginForm) {
    loginForm.onsubmit = async function(e) {
      e.preventDefault();
      loginError.textContent = '';
      const identifier = document.getElementById('identifier').value;
      const password = document.getElementById('password').value;
      try {
        const formData = new FormData();
        formData.append('identifier', identifier);
        formData.append('password', password);
        const response = await fetch('/smarthub/api/login.php', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          window.location.href = '/smarthub/htmlfiles/dashboard.html';
        } else {
          loginError.textContent = result.message || 'Login failed.';
        }
      } catch (err) {
        loginError.textContent = 'An error occurred. Please try again.';
      }
    };
  }
}); 