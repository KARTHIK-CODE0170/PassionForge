/* ========================================================
   account_settings.js – Passion Forge Account Settings
   ======================================================== */

// Backend URL — using empty string for relative paths since app.py serves everything
var API = '';

/* ── Default user state ── */
const DEFAULT_STATE = {
  username: 'Modi Pagulu',
  handle: 'modi_pagulu',
  bio: '',
  hobbies: ['Music', 'Painting'],
  email: 'modi_pagulu@example.com',
  avatarUrl: '',
  preferences: {},
  notifications: { likes: true, comments: true, followers: true, challenges: true },
  privacy: { visibility: 'Public', whoCanComment: 'Everyone' }
};

let userState = {};
let toastTimer = null;

const ALL_HOBBIES = [
  { id: 'Music', label: '&#9834; Music' },
  { id: 'Singing', label: '&#9835; Singing' },
  { id: 'Dance', label: '&#9836; Dance' },
  { id: 'Painting', label: '&#10000; Painting' },
  { id: 'Writing', label: '&#9998; Writing' },
  { id: 'Photography', label: '&#9685; Photography' }
];

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', function () {
  loadUserState();
  populateAllFields();
  navigateSection('profile', false); // default section
});

/* ── Persistence ── */
function loadUserState() {
  try {
    const stored = localStorage.getItem('pf_user');
    userState = stored ? Object.assign({}, DEFAULT_STATE, JSON.parse(stored)) : Object.assign({}, DEFAULT_STATE);
    // Ensure nested objects are merged properly
    userState.preferences = Object.assign({}, DEFAULT_STATE.preferences, userState.preferences);
    userState.notifications = Object.assign({}, DEFAULT_STATE.notifications, userState.notifications);
    userState.privacy = Object.assign({}, DEFAULT_STATE.privacy, userState.privacy);
  } catch (e) {
    userState = Object.assign({}, DEFAULT_STATE);
  }
}

function saveUserState() {
  try {
    localStorage.setItem('pf_user', JSON.stringify(userState));
  } catch (e) { /* quota exceeded – silently ignore */ }
}

/* ── Section Navigation ── */
function navigateSection(id, saveHistory) {
  // Sidebar items
  document.querySelectorAll('.settings-nav-item').forEach(function (item) {
    item.classList.toggle('active', item.getAttribute('data-section') === id);
  });
  // Panels
  document.querySelectorAll('.settings-panel').forEach(function (panel) {
    panel.classList.toggle('active', panel.id === 'panel-' + id);
  });
  // On mobile: scroll to top of content
  var content = document.querySelector('.settings-content');
  if (content) content.scrollTop = 0;
}

/* ── Field Population ── */
function populateAllFields() {
  // Profile
  setVal('inputUsername', userState.username);
  setVal('inputBio', userState.bio);
  setVal('inputEmail', userState.email);
  setAvatarPreviewFromUrl(userState.avatarUrl);

  // Hobby checkboxes – profile
  document.querySelectorAll('#profileHobbies .hobby-chip').forEach(function (chip) {
    chip.classList.toggle('selected', userState.hobbies.includes(chip.getAttribute('data-hobby')));
  });

  // Preferences – Render Selected and Available hobbies
  renderPreferencesHobbies();

  // Notifications
  Object.keys(userState.notifications).forEach(function (key) {
    var toggle = document.getElementById('toggle-' + key);
    if (toggle) toggle.checked = userState.notifications[key];
  });

  // Privacy
  setVal('privacyVisibility', userState.privacy.visibility);
  setVal('privacyComments', userState.privacy.whoCanComment);

  // Navbar avatar initials
  updateNavbarAvatar();
}

function setVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val || '';
}

/* ── Avatar ── */
function handleAvatarUpload(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    userState.avatarUrl = e.target.result;
    setAvatarPreviewFromUrl(e.target.result);
    updateNavbarAvatar();
  };
  reader.readAsDataURL(input.files[0]);
}

function setAvatarPreviewFromUrl(url) {
  var preview = document.getElementById('avatarPreview');
  var initials = document.getElementById('avatarInitials');
  if (!preview) return;
  if (url) {
    preview.style.backgroundImage = 'url(' + url + ')';
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
    if (initials) initials.style.display = 'none';
  } else {
    preview.style.backgroundImage = '';
    if (initials) {
      initials.style.display = 'flex';
      initials.textContent = getInitials(userState.username);
    }
  }
}

function getInitials(name) {
  if (!name) return 'U';
  var parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function updateNavbarAvatar() {
  var navAvatar = document.getElementById('settingsNavAvatar');
  if (!navAvatar) return;
  if (userState.avatarUrl) {
    navAvatar.style.backgroundImage = 'url(' + userState.avatarUrl + ')';
    navAvatar.style.backgroundSize = 'cover';
    navAvatar.style.backgroundPosition = 'center';
    navAvatar.textContent = '';
  } else {
    navAvatar.style.backgroundImage = '';
    navAvatar.textContent = getInitials(userState.username);
  }
}

/* ── Profile Save ── */
async function handleProfileSave() {
  clearErrors(['inputUsername', 'inputBio', 'inputEmail']);

  var username = document.getElementById('inputUsername').value.trim();
  var bio      = document.getElementById('inputBio').value.trim();

  if (!username) { showFieldError('inputUsername', 'Username cannot be empty.'); return; }
  if (username.length < 3) { showFieldError('inputUsername', 'Username must be at least 3 characters.'); return; }

  // Collect hobbies from profile checkboxes
  var hobbies = [];
  document.querySelectorAll('#profileHobbies .hobby-chip.selected').forEach(function(chip) {
    hobbies.push(chip.getAttribute('data-hobby'));
  });

  // Update local state
  userState.username = username;
  userState.bio      = bio;
  userState.hobbies  = hobbies;
  userState.name     = 'u/' + username;
  userState.initials = username.substring(0, 2).toUpperCase();

  // Save to localStorage first (instant update)
  saveUserState();
  setAvatarPreviewFromUrl(userState.avatarUrl);
  updateNavbarAvatar();

  // Also save to backend so it persists across devices/accounts
  try {
    var userId = userState.id;
    if (userId) {
      var response = await fetch(API + '/users/' + userId + '/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username, bio: bio })
      });
      var result = await response.json();
      if (!response.ok) {
        // If backend rejected (e.g. username taken), show the error
        showFieldError('inputUsername', result.error || 'Could not save to server.');
        return;
      }
      // Update stored name/initials from backend response
      userState.name     = result.name;
      userState.initials = result.initials;
      saveUserState();
    }
  } catch (e) {
    // Backend unreachable – still saved locally, so just warn
    console.warn('Backend not reachable; profile saved locally only.');
  }

  // Sync hobbies to preferences panel
  document.querySelectorAll('#prefHobbies .hobby-chip').forEach(function(chip) {
    chip.classList.toggle('selected', hobbies.includes(chip.getAttribute('data-hobby')));
  });

  showToast('&#10004; Profile updated successfully!');
}

/* ── Security Save ── */
async function handleSecuritySave() {
  clearErrors(['inputCurrentPassword', 'inputNewPassword', 'inputConfirmPassword', 'inputSecurityEmail']);

  var currentPw  = document.getElementById('inputCurrentPassword').value;
  var newPw      = document.getElementById('inputNewPassword').value;
  var confirmPw  = document.getElementById('inputConfirmPassword').value;
  var secEmail   = document.getElementById('inputSecurityEmail').value.trim();

  var hasPasswordChange = currentPw || newPw || confirmPw;

  if (hasPasswordChange) {
    if (!currentPw) { showFieldError('inputCurrentPassword', 'Please enter your current password.'); return; }
    if (!newPw)     { showFieldError('inputNewPassword', 'Please enter a new password.'); return; }
    if (newPw.length < 8) { showFieldError('inputNewPassword', 'Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { showFieldError('inputConfirmPassword', 'Passwords do not match.'); return; }

    // Call the backend to actually change the password in the database
    try {
      var userId = userState.id;
      if (userId) {
        var res = await fetch(API + '/users/' + userId + '/password', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ current_password: currentPw, new_password: newPw })
        });
        var result = await res.json();
        if (!res.ok) {
          showFieldError('inputCurrentPassword', result.error || 'Password change failed.');
          return;
        }
      }
    } catch (e) {
      console.warn('Backend not available; password not changed on server.');
    }
  }

  if (secEmail) {
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(secEmail)) { showFieldError('inputSecurityEmail', 'Please enter a valid email address.'); return; }
    userState.email = secEmail;
  }

  saveUserState();

  // Clear password fields after save
  ['inputCurrentPassword', 'inputNewPassword', 'inputConfirmPassword'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });

  showToast('&#10004; Security settings updated!');
}

/* ── Preferences ── */
function applyTheme(theme, animate) {
  document.documentElement.setAttribute('data-theme', theme);
}

/* ── Notification Toggles ── */
function handleNotificationToggle(key) {
  var toggle = document.getElementById('toggle-' + key);
  if (!toggle) return;
  userState.notifications[key] = toggle.checked;
  saveUserState();
  showToast((toggle.checked ? '&#128276; ' : '&#128277; ') + key.charAt(0).toUpperCase() + key.slice(1) + ' notifications ' + (toggle.checked ? 'enabled' : 'disabled') + '.');
}

/* ── Privacy ── */
function handlePrivacyChange() {
  var vis = document.getElementById('privacyVisibility');
  var comments = document.getElementById('privacyComments');
  if (vis) userState.privacy.visibility = vis.value;
  if (comments) userState.privacy.whoCanComment = comments.value;
  saveUserState();
  showToast('&#10004; Privacy settings saved.');
}

/* ── Hobby Selection & Rendering in Preferences ── */
function renderPreferencesHobbies() {
  const selectedContainer = document.getElementById('prefSelectedHobbies');
  const availableContainer = document.getElementById('prefAvailableHobbies');
  if (!selectedContainer || !availableContainer) return;

  selectedContainer.innerHTML = '';
  availableContainer.innerHTML = '';

  ALL_HOBBIES.forEach(hobby => {
    const isSelected = userState.hobbies.includes(hobby.id);
    
    const chip = document.createElement('div');
    chip.className = `hobby-chip ${isSelected ? 'selected' : ''}`;
    chip.setAttribute('data-hobby', hobby.id);
    chip.innerHTML = hobby.label;
    
    // On click, immediately toggle its state in userState and re-render
    chip.onclick = function() {
      if (isSelected) {
        userState.hobbies = userState.hobbies.filter(h => h !== hobby.id);
      } else {
        userState.hobbies.push(hobby.id);
      }
      renderPreferencesHobbies();
      syncProfileHobbiesGrid(); // Sync to profile section visually
    };

    if (isSelected) {
      selectedContainer.appendChild(chip);
    } else {
      availableContainer.appendChild(chip);
    }
  });

  if (selectedContainer.children.length === 0) {
    selectedContainer.innerHTML = '<div class="form-hint" style="margin-left: 4px;">No hobbies selected yet.</div>';
  }
  if (availableContainer.children.length === 0) {
    availableContainer.innerHTML = '<div class="form-hint" style="margin-left: 4px;">You have selected all available hobbies!</div>';
  }
}

function syncProfileHobbiesGrid() {
  document.querySelectorAll('#profileHobbies .hobby-chip').forEach(function (chip) {
    chip.classList.toggle('selected', userState.hobbies.includes(chip.getAttribute('data-hobby')));
  });
}

function savePrefHobbies() {
  // Logic has already updated userState on click, just save and sync
  saveUserState();
  showToast('&#10004; Interests updated!');
}

/* ── Hobby Chip Toggle (General) ── */
function toggleHobbyChip(chip) {
  chip.classList.toggle('selected');
}

/* ── Account Actions ── */
function handleSettingsLogout() {
  localStorage.removeItem('pf_user');
  showToast('Logging out…');
  setTimeout(function () { window.location.href = 'landing.html'; }, 900);
}

function handleDeleteAccount() {
  var dialog = document.getElementById('deleteConfirmDialog');
  if (dialog) dialog.classList.add('open');
}

function closeDeleteDialog() {
  var dialog = document.getElementById('deleteConfirmDialog');
  if (dialog) dialog.classList.remove('open');
}

function confirmDeleteAccount() {
  localStorage.clear();
  showToast('Account deleted. Goodbye!');
  setTimeout(function () { window.location.href = 'landing.html'; }, 1200);
}

/* ── Error Helpers ── */
function showFieldError(fieldId, message) {
  var field = document.getElementById(fieldId);
  if (field) {
    field.classList.add('input-error');
    var errEl = document.getElementById('err-' + fieldId);
    if (errEl) { errEl.textContent = message; errEl.style.display = 'block'; }
  }
}

function clearErrors(fieldIds) {
  fieldIds.forEach(function (id) {
    var field = document.getElementById(id);
    if (field) field.classList.remove('input-error');
    var errEl = document.getElementById('err-' + id);
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  });
}

/* ── Toast ── */
function showToast(msg) {
  var t = document.getElementById('settingsToast');
  if (!t) return;
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
}

/* ── Password Visibility Toggle ── */
function togglePasswordVisibility(btnEl, inputId) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btnEl.innerHTML = isText ? '&#128065;' : '&#128064;';
}
