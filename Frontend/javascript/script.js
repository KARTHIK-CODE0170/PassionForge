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
});

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
    if (window.NotificationSystem) {
      NotificationSystem.create('system', '\uD83C\uDF1F You joined ' + name + '! Explore and connect with fellow creators.');
    }
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
    var creatorName = btn.closest('.creator-item') && btn.closest('.creator-item').querySelector('.creator-name');
    var name = creatorName ? creatorName.textContent.trim() : 'a creator';
    if (window.NotificationSystem) {
      NotificationSystem.create('system', '\uD83D\uDC65 You\'re now following ' + name + '. Check out their latest posts!');
    }
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
  if (window.NotificationSystem) {
    NotificationSystem.create('challenge', '\uD83C\uDFAF Challenge completed! You\'ve extended your streak to 7 days. +50 credits earned!');
  }
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


