// Backend URL — must match where app.py is running
var API = 'http://localhost:5000';

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

          if (!response.ok) {
              console.error('Failed to save hobbies to backend');
          }
      } catch (error) {
          console.error('Error connecting to backend:', error);
      }
  }

  // Redirect to the index page
  window.location.href = 'index.html';
}
