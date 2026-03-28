// opportunities.js — Standalone Page Script

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Data ─────────────────────────────────────────────────────────────────────

let opportunitiesArray = [];
let activeFilter = 'all';      // category filter
let activeStatus  = 'all';     // status filter
let searchQuery   = '';

function loadOpportunities() {
  const stored = localStorage.getItem('opportunities');
  if (stored) {
    opportunitiesArray = JSON.parse(stored);
  } else {
    const now = new Date();

    const d = (days, hours = 0) =>
      new Date(now.getTime() + days * 864e5 + hours * 36e5).toISOString();

    opportunitiesArray = [
      {
        id: generateId(),
        title: 'Voice of Forge 2026 – Singing Audition',
        category: 'Audition',
        description:
          'Open mic for all genres! Looking for talented singers for the upcoming Voice of Forge showcase. Record a 1-minute pitch and submit online.',
        deadline: d(2, 5),
        link: '#',
        status: 'active',
      },
      {
        id: generateId(),
        title: 'Mastering Watercolors Workshop',
        category: 'Workshop',
        description:
          'Join top artists and learn wet-on-wet watercolor techniques. Free for online attendees. Limited seats available.',
        deadline: d(0, 14),
        link: '#',
        status: 'active',
      },
      {
        id: generateId(),
        title: 'Annual Short Story Competition',
        category: 'Competition',
        description:
          "Submit a 500-word short story under the theme 'Midnight Echoes'. Winner gets ₹5,000 + 500 Forge Credits!",
        deadline: d(-2),
        link: '#',
        status: 'closed',
      },
      {
        id: generateId(),
        title: 'Dance Reality Show – Open Call',
        category: 'Audition',
        description:
          'We are scouting solo and duo dancers for a national reality show. All styles welcome. Auditions held virtually and in-person.',
        deadline: d(5),
        link: '#',
        status: 'active',
      },
      {
        id: generateId(),
        title: 'Landscape Photography Cup',
        category: 'Competition',
        description:
          'Submit your best landscape photograph taken in 2025–2026. National-level event with cash prizes and feature in Forge Magazine.',
        deadline: d(10),
        link: '#',
        status: 'active',
      },
    ];

    saveOpportunities();
  }
}

function saveOpportunities() {
  localStorage.setItem('opportunities', JSON.stringify(opportunitiesArray));
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function getFilteredOpportunities() {
  return opportunitiesArray.filter((opp) => {
    const matchCat =
      activeFilter === 'all' ||
      opp.category.toLowerCase() === activeFilter;
    const matchStatus =
      activeStatus === 'all' || opp.status === activeStatus;
    const matchSearch =
      searchQuery === '' ||
      opp.title.toLowerCase().includes(searchQuery) ||
      opp.description.toLowerCase().includes(searchQuery);
    return matchCat && matchStatus && matchSearch;
  });
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.opp-filter-btn').forEach((b) => {
    if (['filter-all','filter-audition','filter-workshop','filter-competition'].some(id => document.getElementById(id) === b)) {
      b.classList.remove('active');
    }
  });
  btn.classList.add('active');
  renderOpportunities();
}

function setStatusFilter(status, btn) {
  activeStatus = status;
  document.querySelectorAll('.opp-filter-btn').forEach((b) => {
    if (['status-all','status-active','status-closed'].some(id => document.getElementById(id) === b)) {
      b.classList.remove('active-status');
    }
  });
  btn.classList.add('active-status');
  renderOpportunities();
}

function filterOpportunities() {
  const input = document.getElementById('oppSearchInput');
  searchQuery = input ? input.value.trim().toLowerCase() : '';

  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';

  renderOpportunities();
}

function clearSearch() {
  const input = document.getElementById('oppSearchInput');
  if (input) input.value = '';
  searchQuery = '';
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.style.display = 'none';
  renderOpportunities();
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function calculateCountdown(deadlineStr) {
  const distance = new Date(deadlineStr).getTime() - Date.now();
  if (distance <= 0) return { text: 'Expired', cls: 'expired' };

  const days    = Math.floor(distance / 864e5);
  const hours   = Math.floor((distance % 864e5) / 36e5);
  const minutes = Math.floor((distance % 36e5) / 6e4);
  const seconds = Math.floor((distance % 6e4) / 1e3);

  let text, cls;
  if (days > 1) {
    text = `${days} Days Left`;
    cls = '';
  } else if (days === 1 || hours > 0) {
    text = `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m Left`;
    cls = 'closing-soon';
  } else {
    text = `${minutes}m ${seconds}s Left`;
    cls = 'closing-soon';
  }
  return { text, cls };
}

let countdownInterval = null;

function updateAllCountdowns() {
  let stateChanged = false;

  opportunitiesArray.forEach((opp) => {
    const el = document.getElementById(`countdown-${opp.id}`);
    if (!el) return;

    if (opp.status === 'closed') {
      el.className = 'opp-countdown expired';
      el.innerHTML = '&#10005; Closed';
      return;
    }

    const { text, cls } = calculateCountdown(opp.deadline);

    if (text === 'Expired') {
      opp.status = 'closed';
      stateChanged = true;
      el.className = 'opp-countdown expired';
      el.innerHTML = '&#10005; Closed';
      // also disable button
      const btn = document.getElementById(`apply-btn-${opp.id}`);
      if (btn) { btn.disabled = true; btn.textContent = 'Closed'; }
    } else {
      el.className = `opp-countdown ${cls}`;
      el.innerHTML = `⏳ ${text}`;
    }
  });

  if (stateChanged) saveOpportunities();
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderOpportunities() {
  const container = document.getElementById('opportunitiesContainer');
  const emptyEl   = document.getElementById('oppEmpty');
  const badge      = document.getElementById('opp-count-badge');
  if (!container) return;

  const filtered = getFilteredOpportunities();
  container.innerHTML = '';

  // Update hero badge
  if (badge) {
    const active = opportunitiesArray.filter(o => o.status === 'active').length;
    badge.textContent = `${active} Active Opportunit${active === 1 ? 'y' : 'ies'}`;
  }

  // Update sidebar stats
  const statTotal  = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statClosed = document.getElementById('stat-closed');
  if (statTotal)  statTotal.textContent  = opportunitiesArray.length;
  if (statActive) statActive.textContent = opportunitiesArray.filter(o => o.status === 'active').length;
  if (statClosed) statClosed.textContent = opportunitiesArray.filter(o => o.status === 'closed').length;

  if (filtered.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  filtered.forEach((opp) => {
    const isClosed = opp.status === 'closed';

    let catClass = 'cat-audition';
    if (opp.category.toLowerCase() === 'workshop')    catClass = 'cat-workshop';
    if (opp.category.toLowerCase() === 'competition') catClass = 'cat-competition';

    const countdownInit = isClosed
      ? '<span class="opp-countdown expired">&#10005; Closed</span>'
      : '<span class="opp-countdown" id="countdown-' + opp.id + '">⏳ Loading...</span>';

    const card = `
      <article class="opp-card ${isClosed ? 'card-closed' : ''}" id="opp-${opp.id}">
        <div class="opp-card-top">
          <span class="opp-category-tag ${catClass}">${opp.category}</span>
          <span class="opp-status-dot ${isClosed ? 'closed' : 'active'}">${isClosed ? 'Closed' : 'Active'}</span>
        </div>
        <h3 class="opp-card-title">${opp.title}</h3>
        <p class="opp-card-desc">${opp.description}</p>
        <div class="opp-card-footer">
          <div class="opp-card-meta">
            <span class="opp-deadline-label">Deadline: ${new Date(opp.deadline).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
            ${countdownInit}
          </div>
          <button
            class="opp-apply-btn"
            id="apply-btn-${opp.id}"
            onclick="handleApply('${opp.id}')"
            ${isClosed ? 'disabled' : ''}
          >${isClosed ? 'Closed' : 'Apply Now'}</button>
        </div>
      </article>
    `;

    container.insertAdjacentHTML('beforeend', card);
  });

  // kick countdown immediately after render
  updateAllCountdowns();
}

// ── Apply ─────────────────────────────────────────────────────────────────────

function handleApply(id) {
  const opp = opportunitiesArray.find((o) => o.id === id);
  if (!opp) return;

  if (opp.status === 'closed') {
    showToast('This opportunity has already closed ❌');
    return;
  }

  showToast(`✅ Successfully applied to "${opp.title}"!`);
}

// ── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadOpportunities();
  renderOpportunities();

  // Live countdown — tick every second
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateAllCountdowns, 1000);
});
