// Backend URL — using empty string for relative paths since app.py serves everything
var API = '';

var selected = [];

function toggleHobby(card) {
  var hobby = card.getAttribute('data-hobby');
  var idx = selected.indexOf(hobby);

  if (idx > -1) {
    selected.splice(idx, 1);
    card.classList.remove('selected');
  } else {
    selected.push(hobby);
    card.classList.add('selected');
  }

  updateUI();
}

function updateUI() {
  var info = document.getElementById('selectedInfo');
  var btn  = document.getElementById('continueBtn');

  if (selected.length === 0) {
    info.innerHTML = 'Select at least <span>1 hobby</span> to continue';
    btn.disabled = true;
  } else {
    info.innerHTML = 'You have selected <span>' + selected.length + ' ' + (selected.length === 1 ? 'hobby' : 'hobbies') + '</span>';
    btn.disabled = false;
  }
}

function handleContinue() {
  if (selected.length === 0) return;

  // Populate tags in success box
  var tagsList = document.getElementById('hobbyTagsList');
  tagsList.innerHTML = '';
  selected.forEach(function(h) {
    var tag = document.createElement('span');
    tag.className = 'hobby-tag';
    tag.textContent = h;
    tagsList.appendChild(tag);
  });

  // Show overlay
  document.getElementById('successOverlay').classList.add('show');
}

async function goToDashboard() {
  // Get the logged in user from localStorage
  const userStr = localStorage.getItem('pf_user');
  if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user.id;

      // Call the backend to save hobbies
      try {
          const response = await fetch(API + `/users/${userId}/hobbies`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ hobbies: selected })
          });

          if (response.ok) {
              // Update local state so it's consistent
              user.hobbies = selected;
              user.is_new_user = false;
              localStorage.setItem('pf_user', JSON.stringify(user));
          } else {
              console.error('Failed to save hobbies to backend');
          }
      } catch (error) {
          console.error('Error connecting to backend:', error);
      }
  }

  // Redirect to the index page
  window.location.href = 'index.html';
}
