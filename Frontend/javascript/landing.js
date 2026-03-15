function doLogin() {
      var email = document.getElementById('emailInput').value.trim();
      var pass  = document.getElementById('passInput').value;
      var err   = document.getElementById('errMsg');

      if (!email || !pass) {
        err.style.display = 'block';
        err.textContent = 'Please fill in all fields.';
        return;
      }
      if (email === 'demo' && pass === 'password123') {
        err.style.display = 'none';
        window.location.href = 'hobby_selection.html';
      } else {
        err.style.display = 'block';
        err.textContent = 'Invalid credentials. Please try again.';
      }
    }

    document.getElementById('passInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doLogin();
    });