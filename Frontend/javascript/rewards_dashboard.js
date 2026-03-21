/**
 * rewards_dashboard.js – Passion Forge Rewards Dashboard Page Logic
 * Uses RewardsSystem (rewards.js) for state; renders all UI.
 */
'use strict';

/* ─── Level helpers ─────────────────────────────────────────── */
function rdGetBasePoints(level) {
  return level <= 1 ? 0 : 50 * level * (level - 1);
}

/* ─── Leaderboard Seed (static + live user) ─────────────────── */
var LEADERBOARD_SEED = [
  { ini: 'AK', name: 'Arjan K.',  level: 'Level 6 – Master',   pts: 1240, colors: '#7c3aed,#a78bfa' },
  { ini: 'SM', name: 'Sneha M.',  level: 'Level 5 – Champion', pts: 876,  colors: '#0ea5e9,#38bdf8' },
  { ini: 'ND', name: 'Nisha D.',  level: 'Level 5 – Champion', pts: 741,  colors: '#10b981,#34d399' },
  { ini: 'KP', name: 'Karan P.',  level: 'Level 4 – Artisan',  pts: 612,  colors: '#ec4899,#f472b6' }
];

/* ─── Daily Streak weekday row ───────────────────────────────── */
var DAYS = ['M','T','W','T','F','S','S'];

function renderDayRow(streak) {
  var row = document.getElementById('rd-day-row');
  if (!row) return;
  var todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  row.innerHTML = '';
  DAYS.forEach(function (d, i) {
    var div = document.createElement('div');
    var cls = 'rd-day';
    if (i === todayIndex) cls += ' today';
    else if (i < todayIndex && i >= todayIndex - streak + 1) cls += ' done';
    div.className = cls;
    div.textContent = d;
    row.appendChild(div);
  });
}

/* ─── Populate all UI from state ────────────────────────────── */
function rdPopulate() {
  if (!window.RewardsSystem) return;
  var s = RewardsSystem.getState();
  var all = RewardsSystem.getAchievements();

  var level = s.level;
  var base  = rdGetBasePoints(level);
  var next  = rdGetBasePoints(level + 1);
  var pct   = next > base ? Math.round(((s.points - base) / (next - base)) * 100) : 100;

  /* Profile card */
  setText('rd-total-points', s.points.toLocaleString());
  setText('rd-level-text',   'Level ' + level);
  setText('rd-level-pct',    pct + '%');
  setText('rd-pts-to-next',  (Math.max(0, next - s.points)) + ' pts to Level ' + (level + 1));
  setText('rd-stat-posts',   s.posts);
  setText('rd-stat-badges',  s.unlocked.length);
  setText('rd-stat-challenges', s.challenges);
  setText('rd-streak-count', s.streak);
  setText('rd-streak-sub',   s.streak >= 7 ? '🔥 You\'re on fire! Keep it up!' :
                              s.streak >= 3 ? '😊 Great streak! Don\'t break it!' :
                              'Log in daily to build your streak!');

  var bar = document.getElementById('rd-bar-fill');
  if (bar) bar.style.width = pct + '%';

  /* Level tag */
  var tag = document.getElementById('rd-level-tag');
  if (tag) tag.textContent = '⭐ Level ' + level + ' – ' + getLevelTitle(level);

  /* Day row */
  renderDayRow(s.streak);

  /* Overview tab */
  setText('ov-points',     s.points.toLocaleString());
  setText('ov-streak',     s.streak);
  setText('ov-badges',     s.unlocked.length);
  setText('ov-posts',      s.posts);
  setText('ov-likes',      s.likesGiven);
  setText('ov-challenges', s.challenges);

  /* Badge count */
  setText('rd-earned-count', s.unlocked.length + ' earned');

  /* Render grids */
  renderBadgeGrid('all');
  renderAchList(all, s.unlocked);
  renderLeaderboard(s);
  renderActivity(s);
}

function getLevelTitle(level) {
  if (level >= 30) return 'Legend';
  if (level >= 20) return 'Master';
  if (level >= 15) return 'Champion';
  if (level >= 10) return 'Artisan';
  if (level >= 5)  return 'Creator';
  return 'Newcomer';
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ─── Badge Grid ────────────────────────────────────────────── */
function renderBadgeGrid(filter) {
  var grid = document.getElementById('rd-badges-grid');
  if (!grid || !window.RewardsSystem) return;
  var all     = RewardsSystem.getAchievements();
  var unlocked = RewardsSystem.getState().unlocked;
  grid.innerHTML = '';
  all
    .filter(function (a) { return filter === 'all' || a.cat === filter; })
    .forEach(function (ach) {
      var isUnlocked = unlocked.indexOf(ach.id) !== -1;
      var card = document.createElement('div');
      card.className = 'rd-badge-card' + (isUnlocked ? ' unlocked' : '');
      card.setAttribute('data-ach-id', ach.id);
      card.innerHTML =
        '<div class="rd-badge-icon-wrap">' +
          '<span style="font-size:28px">' + ach.icon + '</span>' +
          (isUnlocked ? '' : '<div class="rd-badge-lock">🔒</div>') +
        '</div>' +
        '<div class="rd-badge-check">✓</div>' +
        '<div class="rd-badge-name">' + ach.title + '</div>' +
        '<div class="rd-badge-desc">' + ach.desc + '</div>' +
        '<div class="rd-badge-earned">✓ Earned</div>';
      grid.appendChild(card);
    });
}

function filterBadges(cat, chip) {
  document.querySelectorAll('.rd-filter-row .rd-chip').forEach(function (c) { c.classList.remove('active'); });
  chip.classList.add('active');
  renderBadgeGrid(cat);
}

/* ─── Achievements Row List ─────────────────────────────────── */
function renderAchList(all, unlocked) {
  var list = document.getElementById('rd-ach-list');
  if (!list) return;
  list.innerHTML = '';
  all.forEach(function (ach) {
    var isUnlocked = unlocked.indexOf(ach.id) !== -1;
    var row = document.createElement('div');
    row.className = 'rd-ach-row' + (isUnlocked ? ' unlocked' : '');
    row.innerHTML =
      '<div class="rd-ach-row-icon">' + ach.icon + '</div>' +
      '<div class="rd-ach-row-info">' +
        '<div class="rd-ach-row-title">' + ach.title + '</div>' +
        '<div class="rd-ach-row-desc">' + ach.desc + '</div>' +
      '</div>' +
      '<div class="rd-ach-row-status">' + (isUnlocked ? '✓ Earned' : 'Locked') + '</div>';
    list.appendChild(row);
  });
}

/* ─── Leaderboard ────────────────────────────────────────────── */
function renderLeaderboard(s) {
  var list = document.getElementById('rd-lb-list');
  if (!list) return;

  var entries = LEADERBOARD_SEED.slice();
  // Insert current user
  entries.push({ ini:'SR', name:'You', level:'Level ' + s.level + ' – ' + getLevelTitle(s.level), pts: s.points, colors:'#f97316,#fb923c', isMe: true });
  entries.sort(function (a, b) { return b.pts - a.pts; });

  list.innerHTML = '';
  entries.slice(0, 6).forEach(function (e, i) {
    var rank = i + 1;
    var rankCls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    var row = document.createElement('div');
    row.className = 'rd-lb-row' + (e.isMe ? ' me' : '');
    row.innerHTML =
      '<div class="rd-lb-rank ' + rankCls + '">' + rank + '</div>' +
      '<div class="rd-lb-avatar" style="background:linear-gradient(135deg,' + e.colors + ')">' + e.ini + '</div>' +
      '<div class="rd-lb-info">' +
        '<div class="rd-lb-uname">' + e.name + '</div>' +
        '<div class="rd-lb-ulevel">' + e.level + '</div>' +
      '</div>' +
      '<div class="rd-lb-pts">' + e.pts.toLocaleString() + '</div>';
    list.appendChild(row);
  });
}

/* ─── Recent Activity ─────────────────────────────────────────── */
function renderActivity(s) {
  var list = document.getElementById('rd-activity-list');
  if (!list) return;

  var acts = [];
  if (s.posts > 0)      acts.push({ text: 'Created <strong>' + s.posts + ' post' + (s.posts > 1 ? 's' : '') + '</strong>', pts: s.posts * 10 });
  if (s.likesGiven > 0) acts.push({ text: 'Liked <strong>' + s.likesGiven + ' post' + (s.likesGiven > 1 ? 's' : '') + '</strong>', pts: s.likesGiven * 2 });
  if (s.comments > 0)   acts.push({ text: 'Wrote <strong>' + s.comments + ' comment' + (s.comments > 1 ? 's' : '') + '</strong>', pts: s.comments * 2 });
  if (s.challenges > 0) acts.push({ text: 'Completed <strong>' + s.challenges + ' challenge' + (s.challenges > 1 ? 's' : '') + '</strong>', pts: s.challenges * 20 });

  if (!acts.length) {
    list.innerHTML = '<div class="rd-act-row"><div class="rd-act-text" style="color:#6b7280;font-style:italic;">No activity yet. Start creating!</div></div>';
    return;
  }

  list.innerHTML = '';
  acts.forEach(function (a) {
    var row = document.createElement('div');
    row.className = 'rd-act-row';
    row.innerHTML =
      '<div class="rd-act-dot"></div>' +
      '<div class="rd-act-text">' + a.text + '</div>' +
      '<div class="rd-act-pts">+' + a.pts + ' ⭐</div>';
    list.appendChild(row);
  });
}

/* ─── Tab Switch ─────────────────────────────────────────────── */
function switchRdTab(tab, btn) {
  document.querySelectorAll('.rd-tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.rd-tab-content').forEach(function (c) { c.style.display = 'none'; });
  var panel = document.getElementById('rdtab-' + tab);
  if (panel) panel.style.display = 'block';
}

/* ─── Challenge complete from dashboard ───────────────────────── */
function completeDashChallenge(btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = '✓ Done!';
  btn.closest('.rd-challenge-item').style.opacity = '.6';
  if (window.RewardsSystem) RewardsSystem.trackAction('COMPLETE_CHALLENGE');
  rdPopulate();
}

/* ─── Bonus claim ─────────────────────────────────────────────── */
function claimBonus(btn) {
  if (btn.disabled) return;
  var claimed = localStorage.getItem('pf_weekly_bonus') === new Date().toISOString().slice(0,7);
  if (claimed) { showRdToast('Already claimed this week!'); return; }
  localStorage.setItem('pf_weekly_bonus', new Date().toISOString().slice(0,7));
  btn.disabled = true;
  btn.textContent = '✓ Bonus Claimed!';
  if (window.RewardsSystem) {
    // Manually add 50 points
    var s = RewardsSystem.getState();
    // Trigger 5 follow actions as proxy (5×10) – or we just add via a custom path
    // Best approach: use the exposed trackAction
    for (var i = 0; i < 5; i++) RewardsSystem.trackAction('LIKE_POST'); // +50 total
  }
  rdPopulate();
  showRdToast('🎉 +50 pts bonus claimed!');
}

/* ─── Toast ───────────────────────────────────────────────────── */
var rdToastTimer = null;
function showRdToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(rdToastTimer);
  rdToastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
}

/* ─── Listen for achievement unlocks ─────────────────────────── */
window.addEventListener('pf:achievementUnlocked', function (e) {
  rdPopulate();
  var card = document.querySelector('[data-ach-id="' + e.detail.id + '"]');
  if (card) { card.classList.add('unlocked', 'newly-unlocked'); setTimeout(function () { card.classList.remove('newly-unlocked'); }, 600); }
});

window.addEventListener('pf:levelUp', function () { rdPopulate(); });

/* ─── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  rdPopulate();
  // Override RewardsSystem.showToast to use page toast
  window.showToast = showRdToast;
  // Default tab: badges
  switchRdTab('badges', document.getElementById('tab-badges'));
});
