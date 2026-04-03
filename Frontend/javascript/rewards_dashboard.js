/**
 * rewards_dashboard.js – Passion Forge Rewards Dashboard Page Logic
 * Simplified rendering logic for the rewards page.
 */
'use strict';

function rdPopulate() {
  if (!window.RewardsSystem) return;
  var s = RewardsSystem.getState();
  var all = RewardsSystem.getAchievements();

  // Progress to next level (100 pts per level)
  var nextLevelPts = s.level * 100;
  var progress = (s.points % 100);
  
  // Update Profile Card
  setText('rd-total-points', s.points.toLocaleString());
  setText('rd-level-text', 'Level ' + s.level);
  setText('rd-level-pct', progress + '%');
  setText('rd-pts-to-next', (100 - progress) + ' pts to next level');
  setText('rd-stat-posts', s.posts);
  setText('rd-stat-badges', s.unlocked.length);
  setText('rd-stat-challenges', s.challenges);
  setText('rd-streak-count', s.streak);

  var bar = document.getElementById('rd-bar-fill');
  if (bar) bar.style.width = progress + '%';

  // Overview
  setText('ov-points', s.points.toLocaleString());
  setText('ov-streak', s.streak);
  setText('ov-badges', s.unlocked.length);
  setText('ov-posts', s.posts);
  setText('ov-challenges', s.challenges);

  renderBadgeGrid('all');
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderBadgeGrid(filter) {
  var grid = document.getElementById('rd-badges-grid');
  if (!grid || !window.RewardsSystem) return;
  var all = RewardsSystem.getAchievements();
  var unlocked = RewardsSystem.getState().unlocked;
  
  grid.innerHTML = '';
  all.forEach(function (ach) {
    if (filter !== 'all' && ach.cat !== filter) return;
    var isUnlocked = unlocked.indexOf(ach.id) !== -1;
    var card = document.createElement('div');
    card.className = 'rd-badge-card' + (isUnlocked ? ' unlocked' : '');
    card.innerHTML = 
      '<div class="rd-badge-icon-wrap"><span style="font-size:28px">' + ach.icon + '</span></div>' +
      (isUnlocked ? '' : '<div class="rd-badge-lock">🔒</div>') +
      '<div class="rd-badge-name">' + ach.title + '</div>' +
      '<div class="rd-badge-desc">' + ach.desc + '</div>';
    grid.appendChild(card);
  });
}

function filterBadges(cat, chip) {
  document.querySelectorAll('.rd-chip').forEach(function (c) { c.classList.remove('active'); });
  chip.classList.add('active');
  renderBadgeGrid(cat);
}

function switchRdTab(tab, btn) {
  document.querySelectorAll('.rd-tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.rd-tab-content').forEach(function (c) { c.style.display = 'none'; });
  var panel = document.getElementById('rdtab-' + tab);
  if (panel) panel.style.display = 'block';
}

function completeDashChallenge(btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = '✓ Done!';
  if (window.RewardsSystem) RewardsSystem.trackAction('COMPLETE_CHALLENGE');
  rdPopulate();
}

function showRdToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

window.showRdToast = showRdToast;

document.addEventListener('DOMContentLoaded', function () {
  rdPopulate();
  switchRdTab('badges', document.getElementById('tab-badges'));
});

window.addEventListener('pf:achievementUnlocked', rdPopulate);
window.addEventListener('pf:levelUp', rdPopulate);

