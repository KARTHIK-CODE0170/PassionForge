/* ============================================================
   NOTIFICATIONS.JS  –  Passion Forge Notification System
   Handles: create, render, mark read, persist, UI toggle
   ============================================================ */

var NotificationSystem = (function () {

  /* ── Constants ─────────────────────────────────────────── */
  var STORAGE_KEY = 'pf_notifications';
  var MAX_NOTIFICATIONS = 50;

  /* ── Notification Type Config ───────────────────────────── */
  var TYPE_CONFIG = {
    like:        { icon: '❤️',  bubbleClass: 'type-like'        },
    comment:     { icon: '💬',  bubbleClass: 'type-comment'     },
    achievement: { icon: '🏆',  bubbleClass: 'type-achievement' },
    challenge:   { icon: '🎯',  bubbleClass: 'type-challenge'   },
    system:      { icon: '🔔',  bubbleClass: 'type-system'      },
    levelup:     { icon: '⚡',  bubbleClass: 'type-levelup'     }
  };

  /* ── State ──────────────────────────────────────────────── */
  var _notifications = [];
  var _isOpen        = false;

  /* ── Storage Helpers ────────────────────────────────────── */
  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      _notifications = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(_notifications)) _notifications = [];
    } catch (e) {
      _notifications = [];
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_notifications));
    } catch (e) {}
  }

  /* ── ID Generator ───────────────────────────────────────── */
  function _genId() {
    return 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
  }

  /* ── Duplicate Guard ────────────────────────────────────── */
  function _isDuplicate(type, message) {
    var recent = Date.now() - 3000; // 3 seconds window
    return _notifications.some(function (n) {
      return n.type === type &&
             n.message === message &&
             new Date(n.timestamp).getTime() > recent;
    });
  }

  /* ── Timestamp Formatter ────────────────────────────────── */
  function _formatTime(isoStr) {
    var d   = new Date(isoStr);
    var now = new Date();
    var diff = Math.floor((now - d) / 1000);
    if (diff < 10)    return 'Just now';
    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  /* ── Core: Create Notification ──────────────────────────── */
  function create(type, message) {
    if (!type || !message) return;
    if (_isDuplicate(type, message)) return;

    var notif = {
      id:        _genId(),
      type:      type,
      message:   message,
      isRead:    false,
      timestamp: new Date().toISOString()
    };

    _notifications.unshift(notif);

    // Enforce max cap
    if (_notifications.length > MAX_NOTIFICATIONS) {
      _notifications = _notifications.slice(0, MAX_NOTIFICATIONS);
    }

    _save();
    _render();
    _updateBadge();

    // Pulse badge to draw attention
    var badge = document.getElementById('notifBadge');
    if (badge) {
      badge.classList.remove('pulse');
      void badge.offsetWidth; // reflow
      badge.classList.add('pulse');
    }
  }

  /* ── Core: Render List ──────────────────────────────────── */
  function _render() {
    var list  = document.getElementById('notifList');
    var empty = document.getElementById('notifEmpty');
    if (!list) return;

    list.innerHTML = '';

    if (_notifications.length === 0) {
      if (empty) empty.classList.add('visible');
      _updateUnreadChip();
      return;
    }

    if (empty) empty.classList.remove('visible');

    _notifications.forEach(function (notif, index) {
      var cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;

      var item = document.createElement('div');
      item.className = 'notif-item' + (notif.isRead ? '' : ' unread');
      item.setAttribute('data-id', notif.id);
      item.style.animationDelay = (index * 0.04) + 's';

      item.innerHTML =
        '<div class="notif-icon-bubble ' + cfg.bubbleClass + '">' + cfg.icon + '</div>' +
        '<div class="notif-content">' +
          '<div class="notif-message">' + _escapeHTML(notif.message) + '</div>' +
          '<div class="notif-time">' + _formatTime(notif.timestamp) + '</div>' +
        '</div>';

      item.addEventListener('click', function () {
        markAsRead(notif.id);
      });

      list.appendChild(item);
    });

    _updateUnreadChip();
  }

  /* ── Core: Update Badge Count ───────────────────────────── */
  function _updateBadge() {
    var badge = document.getElementById('notifBadge');
    if (!badge) return;

    var unread = _notifications.filter(function (n) { return !n.isRead; }).length;

    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }

  /* ── Update "X unread" chip in header ───────────────────── */
  function _updateUnreadChip() {
    var chip   = document.getElementById('notifUnreadChip');
    var footer = document.getElementById('notifFooterCount');
    var unread = _notifications.filter(function (n) { return !n.isRead; }).length;
    var total  = _notifications.length;

    if (chip) {
      if (unread > 0) {
        chip.textContent = unread + ' unread';
        chip.classList.add('visible');
      } else {
        chip.classList.remove('visible');
      }
    }

    if (footer) {
      footer.textContent = total;
    }
  }

  /* ── Mark Single as Read ────────────────────────────────── */
  function markAsRead(id) {
    var notif = _notifications.find(function (n) { return n.id === id; });
    if (!notif || notif.isRead) return;

    notif.isRead = true;
    _save();

    // Update DOM in-place (no full re-render, smoother UX)
    var item = document.querySelector('.notif-item[data-id="' + id + '"]');
    if (item) item.classList.remove('unread');

    _updateBadge();
    _updateUnreadChip();
  }

  /* ── Mark All as Read ───────────────────────────────────── */
  function markAllAsRead() {
    var changed = false;
    _notifications.forEach(function (n) {
      if (!n.isRead) { n.isRead = true; changed = true; }
    });
    if (!changed) return;
    _save();
    _render();
    _updateBadge();
    if (typeof showToast === 'function') showToast('All notifications marked as read ✓');
  }

  /* ── Toggle Panel ───────────────────────────────────────── */
  function toggle(event) {
    if (event) event.stopPropagation();

    // Close profile popup if open
    var profilePopup = document.getElementById('profilePopup');
    if (profilePopup && profilePopup.classList.contains('open')) {
      profilePopup.classList.remove('open');
    }

    var panel = document.getElementById('notifPanel');
    var bell  = document.getElementById('notifBell');
    if (!panel) return;

    _isOpen = !_isOpen;

    if (_isOpen) {
      panel.classList.add('open');
      if (bell) bell.classList.add('active');
      _render(); // Refresh timestamps on open
    } else {
      _close();
    }
  }

  function _close() {
    _isOpen = false;
    var panel = document.getElementById('notifPanel');
    var bell  = document.getElementById('notifBell');
    if (panel) panel.classList.remove('open');
    if (bell)  bell.classList.remove('active');
  }

  /* ── Escape HTML ────────────────────────────────────────── */
  function _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Seed Initial Notifications ─────────────────────────── */
  function _seed() {
    if (_notifications.length > 0) return; // Already has data

    var seeds = [
      { type: 'system',      message: '👋 Welcome to Passion Forge! Start exploring and sharing your passion.',  minutesAgo: 120 },
      { type: 'challenge',   message: '🎯 New daily challenge available: Practice for 20 minutes today!',       minutesAgo: 60  },
      { type: 'like',        message: '❤️ aria_melody appreciated your recent post. Keep it up!',               minutesAgo: 30  },
      { type: 'achievement', message: '🏆 You earned the "First Steps" badge for joining the community!',       minutesAgo: 10  }
    ];

    seeds.forEach(function (s) {
      var ts = new Date(Date.now() - s.minutesAgo * 60 * 1000).toISOString();
      _notifications.push({
        id:        _genId(),
        type:      s.type,
        message:   s.message,
        isRead:    false,
        timestamp: ts
      });
    });

    _save();
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    _load();
    _seed();
    _updateBadge();

    // Close panel when clicking outside
    document.addEventListener('click', function (e) {
      if (!_isOpen) return;
      var panel = document.getElementById('notifPanel');
      var bell  = document.getElementById('notifBell');
      if (panel && !panel.contains(e.target) && bell && !bell.contains(e.target)) {
        _close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _isOpen) _close();
    });
  }

  /* ── Public API ─────────────────────────────────────────── */
  return {
    init:          init,
    create:        create,
    markAsRead:    markAsRead,
    markAllAsRead: markAllAsRead,
    toggle:        toggle
  };

}());

/* ── Auto-init on DOM ready ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  NotificationSystem.init();
});
