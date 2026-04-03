/**
 * rewards.js – Passion Forge Rewards System
 * Simplified Version: Points, Levels, and 12 curated achievements.
 */
'use strict';

(function () {

  /* ─────────────────── CONSTANTS ─────────────────── */

  var POINTS_TABLE = {
    CREATE_POST:        10,
    LIKE_POST:          2,
    COMMENT_POST:       2,
    COMPLETE_CHALLENGE: 20
  };

  /* Simple Leveling: 100 points per level */
  function calcLevel(pts) {
    if (pts <= 0) return 1;
    return Math.floor(pts / 100) + 1;
  }

  /* ─────────────────── 12 ACHIEVEMENTS ─────────────── */

  var ACHIEVEMENTS = [
    { id: 'first_step',      cat: 'onboarding',  icon: '🚀', title: 'First Step',        desc: 'Join Passion Forge',               check: function(s){ return true; } },
    { id: 'first_post',      cat: 'onboarding',  icon: '✒️', title: 'First Post',         desc: 'Create your first post',           check: function(s){ return s.posts >= 1; } },
    { id: 'first_comment',   cat: 'onboarding',  icon: '💬', title: 'First Comment',      desc: 'Leave your first comment',         check: function(s){ return s.comments >= 1; } },
    { id: 'active_user',     cat: 'activity',    icon: '🔥', title: 'Active User',        desc: 'Create 5 posts',                   check: function(s){ return s.posts >= 5; } },
    { id: 'consistent',      cat: 'activity',    icon: '🌟', title: 'Consistent Creator', desc: 'Create 15 posts',                  check: function(s){ return s.posts >= 15; } },
    { id: 'appreciator',     cat: 'engagement',  icon: '👏', title: 'Appreciator',        desc: 'Give 20 likes',                    check: function(s){ return s.likesGiven >= 20; } },
    { id: 'socializer',      cat: 'engagement',  icon: '🗨️', title: 'Socializer',         desc: 'Leave 20 comments',                check: function(s){ return s.comments >= 20; } },
    { id: 'beginner',        cat: 'milestones',  icon: '🐣', title: 'Beginner',          desc: 'Reach Level 5',                    check: function(s){ return s.level >= 5; } },
    { id: 'master',          cat: 'milestones',  icon: '👑', title: 'Master',            desc: 'Reach Level 10',                   check: function(s){ return s.level >= 10; } },
    { id: 'ch_beginner',     cat: 'challenges',  icon: '🎯', title: 'Challenge Novice',   desc: 'Complete 1 challenge',             check: function(s){ return s.challenges >= 1; } },
    { id: 'ch_warrior',      cat: 'challenges',  icon: '⚔️', title: 'Challenge Warrior',  desc: 'Complete 10 challenges',           check: function(s){ return s.challenges >= 10; } },
    { id: 'streak_7',        cat: 'streaks',     icon: '🥈', title: '7-Day Streak',       desc: 'Be active 7 days in a row',        check: function(s){ return s.streak >= 7; } }
  ];

  /* ─────────────────── STATE ─────────────────── */

  var STORAGE_KEY = 'pf_rewards_v2';

  var defaultState = {
    points: 0,
    level: 1,
    posts: 0,
    comments: 0,
    likesGiven: 0,
    challenges: 0,
    streak: 0,
    lastActive: null,
    unlocked: []
  };

  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign({}, defaultState, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return Object.assign({}, defaultState);
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ─────────────────── LOGIC ─────────────────── */

  function refreshStreak() {
    var today = new Date().toISOString().slice(0, 10);
    if (state.lastActive === today) return;
    if (state.lastActive) {
      var prev = new Date(state.lastActive);
      var now = new Date(today);
      var diff = Math.round((now - prev) / 86400000);
      state.streak = (diff === 1) ? state.streak + 1 : 1;
    } else {
      state.streak = 1;
    }
    state.lastActive = today;
  }

  function checkAchievements() {
    ACHIEVEMENTS.forEach(function (ach) {
      if (state.unlocked.indexOf(ach.id) !== -1) return;
      if (ach.check(state)) {
        state.unlocked.push(ach.id);
        showToast('🏆 Achievement Unlocked: ' + ach.title);
        window.dispatchEvent(new CustomEvent('pf:achievementUnlocked', { detail: ach }));
      }
    });
  }

  function addPoints(pts) {
    state.points += pts;
    var oldLevel = state.level;
    state.level = calcLevel(state.points);
    if (state.level > oldLevel) {
      showToast('⭐ Level Up! You are now Level ' + state.level);
      window.dispatchEvent(new CustomEvent('pf:levelUp', { detail: { level: state.level } }));
    }
  }

  function trackAction(action) {
    refreshStreak();
    if (action === 'CREATE_POST') {
      state.posts++;
      addPoints(POINTS_TABLE.CREATE_POST);
    } else if (action === 'LIKE_POST') {
      state.likesGiven++;
      addPoints(POINTS_TABLE.LIKE_POST);
    } else if (action === 'COMMENT_POST') {
      state.comments++;
      addPoints(POINTS_TABLE.COMMENT_POST);
    } else if (action === 'COMPLETE_CHALLENGE') {
      state.challenges++;
      addPoints(POINTS_TABLE.COMPLETE_CHALLENGE);
    }
    checkAchievements();
    saveState();
    updateUI();
  }

  function updateUI() {
    var ptsEl = document.getElementById('rw-points');
    var lvlEl = document.getElementById('rw-level');
    if (ptsEl) ptsEl.textContent = state.points.toLocaleString();
    if (lvlEl) lvlEl.textContent = 'Level ' + state.level;
  }

  function showToast(msg) {
    if (typeof window.showRdToast === 'function') {
      window.showRdToast(msg);
    } else {
      console.log('Toast:', msg);
    }
  }

  function init() {
    refreshStreak();
    checkAchievements();
    saveState();
    updateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RewardsSystem = {
    trackAction: trackAction,
    getState: function () { return state; },
    getAchievements: function () { return ACHIEVEMENTS; }
  };

}());

