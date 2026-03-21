/**
 * rewards.js – Passion Forge Dynamic Rewards System
 * Points, Levels, and 32 structured achievements.
 */
'use strict';

(function () {

  /* ─────────────────── CONSTANTS ─────────────────── */

  var POINTS_TABLE = {
    CREATE_POST:        10,
    LIKE_POST:          2,
    COMMENT_POST:       2,
    COMPLETE_CHALLENGE: 20,
    FOLLOW:             0,
    JOIN_COMMUNITY:     0
  };

  var ALL_HOBBIES = ['music', 'singing', 'dance', 'painting', 'writing', 'photography'];

  /* Level n starts at getBasePoints(n) total points.
     Base(n) = 50 * n * (n-1), e.g. L2=100, L3=300, L4=600 … */
  function getBasePoints(level) {
    return level <= 1 ? 0 : 50 * level * (level - 1);
  }

  function calcLevel(pts) {
    // Solve 50L²-50L ≤ pts → L = floor((1+sqrt(1+8pts/50))/2)
    if (pts <= 0) return 1;
    var L = Math.floor((1 + Math.sqrt(1 + (8 * pts) / 50)) / 2);
    return Math.max(1, L);
  }

  /* ─────────────────── 32 ACHIEVEMENTS ─────────────── */

  var ACHIEVEMENTS = [
    // ── Onboarding (4)
    { id: 'first_step',      cat: 'onboarding',  icon: '🚀', title: 'First Step',        desc: 'Join Passion Forge',                      check: function(s){ return true; } },
    { id: 'first_post',      cat: 'onboarding',  icon: '✒️', title: 'First Post',         desc: 'Create your first post',                  check: function(s){ return s.posts >= 1; } },
    { id: 'first_comment',   cat: 'onboarding',  icon: '💬', title: 'First Comment',      desc: 'Leave your first comment',                check: function(s){ return s.comments >= 1; } },
    { id: 'first_like',      cat: 'onboarding',  icon: '❤️', title: 'First Like',         desc: 'Appreciate someone\'s post',              check: function(s){ return s.likesGiven >= 1; } },
    // ── Activity (3)
    { id: 'active_user',     cat: 'activity',    icon: '🔥', title: 'Active User',        desc: 'Create 5 posts',                          check: function(s){ return s.posts >= 5; } },
    { id: 'consistent',      cat: 'activity',    icon: '🌟', title: 'Consistent Creator', desc: 'Create 15 posts',                         check: function(s){ return s.posts >= 15; } },
    { id: 'weekly_star',     cat: 'activity',    icon: '📅', title: 'Weekly Star',        desc: 'Maintain a 7-day streak',                 check: function(s){ return s.streak >= 7; } },
    // ── Engagement (3)
    { id: 'appreciator',     cat: 'engagement',  icon: '👏', title: 'Appreciator',        desc: 'Give 20 likes',                           check: function(s){ return s.likesGiven >= 20; } },
    { id: 'socializer',      cat: 'engagement',  icon: '🗨️', title: 'Socializer',         desc: 'Leave 20 comments',                       check: function(s){ return s.comments >= 20; } },
    { id: 'connector',       cat: 'engagement',  icon: '🤝', title: 'Connector',          desc: 'Follow 5 creators',                       check: function(s){ return s.follows >= 5; } },
    // ── Popularity (3)
    { id: 'rising_star',     cat: 'popularity',  icon: '📈', title: 'Rising Star',        desc: 'Get 50 likes on a single post',           check: function(s){ return s.maxPostLikes >= 50; } },
    { id: 'trending',        cat: 'popularity',  icon: '🔥', title: 'Trending Creator',   desc: 'Receive 200 total likes',                 check: function(s){ return s.likesReceived >= 200; } },
    { id: 'viral_post',      cat: 'popularity',  icon: '💥', title: 'Viral Post',         desc: 'Get 500 likes on a single post',          check: function(s){ return s.maxPostLikes >= 500; } },
    // ── Skill-Based (4)
    { id: 'singer',          cat: 'skill',       icon: '🎤', title: 'Singer',             desc: 'Post 5 times in Singing',                 check: function(s){ return (s.hobbyCounts.singing || 0) >= 5; } },
    { id: 'artist',          cat: 'skill',       icon: '🎨', title: 'Artist',             desc: 'Post 5 times in Painting',                check: function(s){ return (s.hobbyCounts.painting || 0) >= 5; } },
    { id: 'performer',       cat: 'skill',       icon: '💃', title: 'Performer',          desc: 'Post 5 times in Dance',                   check: function(s){ return (s.hobbyCounts.dance || 0) >= 5; } },
    { id: 'writer',          cat: 'skill',       icon: '✍️', title: 'Writer',             desc: 'Post 5 times in Writing',                 check: function(s){ return (s.hobbyCounts.writing || 0) >= 5; } },
    // ── Milestones (3)
    { id: 'beginner',        cat: 'milestones',  icon: '🐣', title: 'Beginner Creator',   desc: 'Reach Level 5',                           check: function(s){ return s.level >= 5; } },
    { id: 'advanced',        cat: 'milestones',  icon: '🦅', title: 'Advanced Creator',   desc: 'Reach Level 15',                          check: function(s){ return s.level >= 15; } },
    { id: 'master',          cat: 'milestones',  icon: '👑', title: 'Master Creator',     desc: 'Reach Level 30',                          check: function(s){ return s.level >= 30; } },
    // ── Challenge-Based (3)
    { id: 'ch_beginner',     cat: 'challenges',  icon: '🎯', title: 'Challenge Beginner', desc: 'Complete 1 challenge',                    check: function(s){ return s.challenges >= 1; } },
    { id: 'ch_warrior',      cat: 'challenges',  icon: '⚔️', title: 'Challenge Warrior',  desc: 'Complete 10 challenges',                  check: function(s){ return s.challenges >= 10; } },
    { id: 'ch_master',       cat: 'challenges',  icon: '🏆', title: 'Challenge Master',   desc: 'Complete 30 challenges',                  check: function(s){ return s.challenges >= 30; } },
    // ── Streaks (3)
    { id: 'streak_3',        cat: 'streaks',     icon: '🥉', title: '3-Day Streak',       desc: 'Be active 3 days in a row',               check: function(s){ return s.streak >= 3; } },
    { id: 'streak_7',        cat: 'streaks',     icon: '🥈', title: '7-Day Streak',       desc: 'Be active 7 days in a row',               check: function(s){ return s.streak >= 7; } },
    { id: 'streak_30',       cat: 'streaks',     icon: '🥇', title: '30-Day Streak',      desc: 'Be active 30 days in a row',              check: function(s){ return s.streak >= 30; } },
    // ── Advanced (6)
    { id: 'skill_improver',  cat: 'advanced',    icon: '🛠️', title: 'Skill Improver',     desc: 'Post in 3 different hobbies',             check: function(s){ return Object.keys(s.hobbyCounts).length >= 3; } },
    { id: 'consistency',     cat: 'advanced',    icon: '🛡️', title: 'Consistency Champ',  desc: 'Be active for 30 total days',             check: function(s){ return s.totalDays >= 30; } },
    { id: 'collaborator',    cat: 'advanced',    icon: '👥', title: 'Collaborator',        desc: 'Join 3 communities',                      check: function(s){ return s.communities >= 3; } },
    { id: 'practice_pro',    cat: 'advanced',    icon: '🎓', title: 'Practice Pro',       desc: 'Complete 50 challenges',                  check: function(s){ return s.challenges >= 50; } },
    { id: 'all_rounder',     cat: 'advanced',    icon: '🌍', title: 'All-Rounder',        desc: 'Post in all 6 hobby categories',          check: function(s){ return Object.keys(s.hobbyCounts).length >= ALL_HOBBIES.length; } },
    { id: 'mentor',          cat: 'advanced',    icon: '👨‍🏫', title: 'Mentor',             desc: 'Leave 50 comments',                       check: function(s){ return s.comments >= 50; } }
  ];

  /* ─────────────────── STATE ─────────────────── */

  var STORAGE_KEY = 'pf_rewards_v2';

  var defaultState = {
    points: 0,
    level: 1,
    posts: 0,
    comments: 0,
    likesGiven: 0,
    likesReceived: 0,
    maxPostLikes: 0,
    challenges: 0,
    follows: 0,
    communities: 0,
    streak: 0,
    totalDays: 0,
    lastActive: null,
    hobbyCounts: {},
    unlocked: []   // array of achievement ids
  };

  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        // Merge defaults to cover any new keys
        return Object.assign({}, defaultState, parsed, {
          hobbyCounts: parsed.hobbyCounts || {},
          unlocked: parsed.unlocked || []
        });
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, defaultState, { hobbyCounts: {}, unlocked: [] });
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ─────────────────── STREAK ─────────────────── */

  function refreshStreak() {
    var today = new Date().toISOString().slice(0, 10);
    if (state.lastActive === today) return;  // already counted today
    if (state.lastActive) {
      var prev  = new Date(state.lastActive);
      var now   = new Date(today);
      var diff  = Math.round((now - prev) / 86400000);
      state.streak = (diff === 1) ? state.streak + 1 : 1;
    } else {
      state.streak = 1;
    }
    state.totalDays++;
    state.lastActive = today;
  }

  /* ─────────────────── ACHIEVEMENT CHECK ─────────────────── */

  function checkAchievements() {
    ACHIEVEMENTS.forEach(function (ach) {
      if (state.unlocked.indexOf(ach.id) !== -1) return;  // already unlocked
      try {
        if (ach.check(state)) {
          state.unlocked.push(ach.id);
          scheduleToast('🏆 Achievement Unlocked: ' + ach.title + ' ' + ach.icon, 1600);
          animateAchievementCard(ach.id);
          window.dispatchEvent(new CustomEvent('pf:achievementUnlocked', { detail: ach }));
        }
      } catch (e) { /* ignore bad checks */ }
    });
  }

  var toastQueue = [];
  var toastBusy = false;

  function scheduleToast(msg, delay) {
    setTimeout(function () {
      toastQueue.push(msg);
      drainToasts();
    }, delay || 0);
  }

  function drainToasts() {
    if (toastBusy || !toastQueue.length) return;
    toastBusy = true;
    var msg = toastQueue.shift();
    if (typeof window.showToast === 'function') window.showToast(msg);
    setTimeout(function () { toastBusy = false; drainToasts(); }, 3200);
  }

  function animateAchievementCard(achId) {
    var card = document.querySelector('[data-ach-id="' + achId + '"]');
    if (!card) return;
    card.classList.add('unlocked', 'newly-unlocked');
    setTimeout(function () { card.classList.remove('newly-unlocked'); }, 600);
  }

  /* ─────────────────── POINTS & LEVEL ─────────────────── */

  function addPoints(pts) {
    if (!pts) return;
    state.points += pts;
    var oldLevel = state.level;
    state.level = calcLevel(state.points);
    if (state.level > oldLevel) {
      scheduleToast('⭐ Level Up! You are now Level ' + state.level + '! 🎉', 400);
      window.dispatchEvent(new CustomEvent('pf:levelUp', { detail: { level: state.level } }));
    }
  }

  /* ─────────────────── PUBLIC ACTION HANDLER ─────────────── */

  function trackAction(action, meta) {
    meta = meta || {};
    refreshStreak();

    switch (action) {
      case 'CREATE_POST':
        state.posts++;
        if (meta.hobbies && meta.hobbies.length) {
          meta.hobbies.forEach(function (h) {
            state.hobbyCounts[h] = (state.hobbyCounts[h] || 0) + 1;
          });
        }
        addPoints(POINTS_TABLE.CREATE_POST);
        scheduleToast('🎉 Post published! +' + POINTS_TABLE.CREATE_POST + ' points earned.', 0);
        break;

      case 'LIKE_POST':
        state.likesGiven++;
        addPoints(POINTS_TABLE.LIKE_POST);
        scheduleToast('You appreciated this post. +' + POINTS_TABLE.LIKE_POST + ' pts', 0);
        break;

      case 'COMMENT_POST':
        state.comments++;
        addPoints(POINTS_TABLE.COMMENT_POST);
        scheduleToast('Comment posted. +' + POINTS_TABLE.COMMENT_POST + ' pts', 0);
        break;

      case 'COMPLETE_CHALLENGE':
        state.challenges++;
        addPoints(POINTS_TABLE.COMPLETE_CHALLENGE);
        scheduleToast('+' + POINTS_TABLE.COMPLETE_CHALLENGE + ' points! Challenge complete! 🔥', 0);
        break;

      case 'FOLLOW':
        state.follows++;
        break;

      case 'JOIN_COMMUNITY':
        state.communities++;
        break;

      default:
        break;
    }

    checkAchievements();
    saveState();
    updateUI();
  }

  /* ─────────────────── UI UPDATE ─────────────────── */

  function updateUI() {
    // Sidebar points + level
    var ptsEl  = document.getElementById('rw-points');
    var lvlEl  = document.getElementById('rw-level');
    var barEl  = document.getElementById('rw-bar');
    var lblEl  = document.getElementById('rw-next-label');

    if (ptsEl) ptsEl.textContent = state.points.toLocaleString();
    if (lvlEl) lvlEl.textContent = 'Level ' + state.level;

    if (barEl) {
      var base     = getBasePoints(state.level);
      var next     = getBasePoints(state.level + 1);
      var progress = next > base ? ((state.points - base) / (next - base)) * 100 : 100;
      barEl.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }

    if (lblEl) {
      var nextPts = getBasePoints(state.level + 1);
      var needed  = Math.max(0, nextPts - state.points);
      lblEl.textContent = needed > 0
        ? needed + ' pts to Level ' + (state.level + 1)
        : 'Max level reached!';
    }

    // Profile popup badges count
    var badgeEl = document.getElementById('rw-badge-count');
    if (badgeEl) badgeEl.textContent = state.unlocked.length;

    // Profile popup credits count
    var creditEl = document.getElementById('rw-credit-count');
    if (creditEl) creditEl.textContent = state.points.toLocaleString();
  }



  /* ─────────────────── INIT ─────────────────── */

  function init() {
    refreshStreak();
    checkAchievements();  // unlock "First Step" on load
    saveState();
    updateUI();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ─────────────────── PUBLIC API ─────────────────── */

  window.RewardsSystem = {
    trackAction: trackAction,
    getState:     function () { return Object.assign({}, state); },
    getAchievements: function () { return ACHIEVEMENTS.slice(); },
    updateUI:     updateUI
  };

}());
