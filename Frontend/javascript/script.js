/* script.js – Global dashboard logic (search, sidebar, tabs, profile popup, toast) */
/* Post interactions & Create Post module → see post.js */

var votedPosts = {}, challengeDone = false, extraLoaded = false, toastTimer = null;

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('searchInput');
  var clearBtn = document.getElementById('searchClear');
  if (input && clearBtn) {
    input.addEventListener('input', function() {
      clearBtn.classList.toggle('visible', input.value.length > 0);
    });
    clearBtn.addEventListener('click', function() {
      input.value = '';
      clearBtn.classList.remove('visible');
      input.focus();
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && input.value.trim()) showToast('Searching for "' + input.value.trim() + '"...');
    });
  }
  
  // Initialize user profile data from session
  loadPFUser();
});

/* SESSION & PROFILE LOGIC */
function loadPFUser() {
  const userStr = localStorage.getItem('pf_user');
  if (!userStr) return;
  
  try {
    const user = JSON.parse(userStr);
    const initials = user.username ? user.username.substring(0, 2).toUpperCase() : '??';
    
    // Update Navbar Avatar
    const navAvatar = document.getElementById('profileAvatar');
    if (navAvatar) navAvatar.textContent = initials;

    // Update Profile Popup Header
    const popupAvatar = document.querySelector('.profile-popup-avatar');
    if (popupAvatar) popupAvatar.textContent = initials;

    const popupName = document.querySelector('.profile-popup-name');
    if (popupName) popupName.textContent = user.username || 'Guest';

    const popupHandle = document.querySelector('.profile-popup-handle');
    if (popupHandle) {
      const handle = (user.username || 'guest').toLowerCase().replace(/\s+/g, '_');
      popupHandle.textContent = 'u/' + handle;
    }
    
    // Update "My Posts" panel avatar if exists in index.html
    const mpAvatar = document.getElementById('mpAvatar');
    if (mpAvatar) mpAvatar.textContent = initials;
  } catch (err) {
    console.error('Error loading session user:', err);
  }
}

function toggleSection(id, header) {
  var menu = document.getElementById(id);
  var chevron = header.querySelector('.chevron');
  menu.classList.toggle('collapsed');
  chevron.classList.toggle('rotated');
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  showToast('Sorted by ' + name.charAt(0).toUpperCase() + name.slice(1));
}

function filterFeed(category, clicked) {
  document.querySelectorAll('.s-item[id^="filter-"]').forEach(function(i) { i.classList.remove('active'); });
  clicked.classList.add('active');
  document.querySelectorAll('.post-card').forEach(function(post) {
    post.classList.toggle('hidden', category !== 'all' && post.getAttribute('data-category') !== category);
  });
  showToast('Filtered by ' + category);
}

function joinCommunity(item, name) {
  var tag = item.querySelector('.join-tag');
  tag.classList.toggle('joined');
  tag.textContent = tag.classList.contains('joined') ? 'Joined \u2713' : 'Join';
  if (tag.classList.contains('joined')) {
    if (window.RewardsSystem) { RewardsSystem.trackAction('JOIN_COMMUNITY'); }
    else { showToast('Welcome to ' + name + '!'); }
  } else {
    showToast('Left ' + name + '.');
  }
}

function followCreator(btn) {
  btn.classList.toggle('following');
  btn.textContent = btn.classList.contains('following') ? 'Following \u2713' : 'Follow';
  if (btn.classList.contains('following')) {
    if (window.RewardsSystem) { RewardsSystem.trackAction('FOLLOW'); }
    else { showToast('Now following.'); }
  } else {
    showToast('Unfollowed.');
  }
}

function completeChallenge() {
  if (challengeDone) return;
  challengeDone = true;
  var btn = document.querySelector('.btn-challenge');
  if (btn) { btn.textContent = '\u2713 Completed!'; btn.classList.add('done'); }
  document.getElementById('streakFill').style.width = '100%';
  document.querySelector('.streak-label').textContent = '\u2605 7-day streak \u2014 amazing!';
  if (window.RewardsSystem) { RewardsSystem.trackAction('COMPLETE_CHALLENGE'); }
  else { showToast('+20 credits earned! Streak extended.'); }
}

function handleLogin()  { window.location.href = 'landing.html'; }
function handleSignup() { window.location.href = 'landing.html'; }

/* PROFILE POPUP */
function toggleProfileMenu(e) {
  e.stopPropagation();
  var popup = document.getElementById('profilePopup');
  popup.classList.toggle('open');
}



function handleLogout() {
  document.getElementById('profilePopup').classList.remove('open');
  localStorage.removeItem('pf_user');
  showToast('Logging out...');
  setTimeout(function() { window.location.href = 'landing.html'; }, 900);
}

document.addEventListener('click', function(e) {
  var popup = document.getElementById('profilePopup');
  var avatar = document.getElementById('profileAvatar');
  if (popup && popup.classList.contains('open')) {
    if (!popup.contains(e.target) && e.target !== avatar) {
      popup.classList.remove('open');
    }
  }
});

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2800);
}


