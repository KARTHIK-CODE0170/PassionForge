/**
 * PassionForge — Chat Interface JavaScript
 * ─────────────────────────────────────────
 * Handles:
 *  • Chat selection & header updates
 *  • Sending messages (button + Enter key)
 *  • Emoji picker toggle & insertion
 *  • Auto-scroll to latest message
 *  • XSS-safe HTML escaping
 *  • Navigation to dashboard
 */

'use strict';

// ─── Unique avatar & status info per user ──────────────────
const USER_DATA = {
    BlazeFury99: { initials: 'BF', avClass: 'av-orange', statusClass: 'online', statusText: 'online' },
    PixelQueenX: { initials: 'PQ', avClass: 'av-purple', statusClass: 'online', statusText: 'online' },
    NightOwl_Dev: { initials: 'ND', avClass: 'av-teal', statusClass: 'idle', statusText: 'idle' },
    StormRacer7: { initials: 'SR', avClass: 'av-red', statusClass: 'offline', statusText: 'offline' },
    CryptoGhost: { initials: 'CG', avClass: 'av-green', statusClass: 'online', statusText: 'online' },
    ArcadeWitch: { initials: 'AW', avClass: 'av-pink', statusClass: 'online', statusText: 'online' },
};

// ─── DOM element references ────────────────────────────────
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const headerUsername = document.getElementById('headerUsername');
const headerStatus = document.getElementById('headerStatus');
const headerAvatar = document.getElementById('headerAvatar');
const headerStatusDot = document.getElementById('headerStatusDot');
const searchInput = document.getElementById('searchInput');
const chatList = document.getElementById('chatList');

// ─── Current chat state ────────────────────────────────────
let currentUser = 'BlazeFury99';

// ─── Navigation ────────────────────────────────────────────
function goToDashboard() {
    window.location.href = '../html/index.html';
}

// ─── Select a chat from the contacts list ─────────────────
function selectChat(element, username) {
    // Skip if same chat
    if (currentUser === username) return;
    currentUser = username;

    // Update active state on list items
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // Remove unread badge on selected item
    const badge = element.querySelector('.unread-badge');
    if (badge) badge.remove();

    // Update header
    const userData = USER_DATA[username];
    if (!userData) return;

    headerUsername.textContent = username;
    headerAvatar.textContent = userData.initials;
    headerAvatar.className = `avatar ${userData.avClass}`;

    // Status text with colored dot icon
    const isOnline = userData.statusClass === 'online';
    const isIdle = userData.statusClass === 'idle';
    const statusColor = isOnline ? '#4caf50' : isIdle ? '#ffa726' : '#555560';
    headerStatus.innerHTML = `<i class="fa-solid fa-circle status-online-icon" style="color:${statusColor}"></i> ${userData.statusText}`;

    // Status dot on header avatar
    headerStatusDot.className = `status-dot ${userData.statusClass}`;

    // Update placeholder in input
    messageInput.placeholder = `Message ${username}...`;

    // Show transition effect: small pulse on header avatar
    headerAvatar.style.transform = 'scale(1.12)';
    setTimeout(() => { headerAvatar.style.transform = 'scale(1)'; }, 180);

    // Clear message area and load simulated conversation
    loadConversation(username, userData);

    messageInput.focus();
}

// ─── Load a simulated conversation ────────────────────────
function loadConversation(username, userData) {
    messagesArea.innerHTML = '';

    // Date divider
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.innerHTML = '<span>Today</span>';
    messagesArea.appendChild(divider);

    // Simulated message history per user
    const convos = {
        PixelQueenX: [
            { type: 'recv', text: "Heyyy! Are you joining tonight's stream? 🎥", time: '3:00 PM' },
            { type: 'sent', text: "YES definitely! What game are you streaming?", time: '3:02 PM' },
            { type: 'recv', text: "Valorant ranked! Come hop in the discord 🎮", time: '3:03 PM' },
        ],
        NightOwl_Dev: [
            { type: 'recv', text: "yo check out my new build 👾", time: '2:10 PM' },
            { type: 'recv', text: "custom water cooled beast. hits 5.8GHz", time: '2:10 PM' },
            { type: 'sent', text: "No way! That's insane 🤯 post pics!", time: '2:14 PM' },
        ],
        StormRacer7: [
            { type: 'recv', text: "gg last night! close one 🏆", time: 'Yesterday' },
            { type: 'sent', text: "So close! We'll get em next time 💪", time: 'Yesterday' },
        ],
        CryptoGhost: [
            { type: 'recv', text: "Did you see the patch notes? 📋", time: '10:00 AM' },
            { type: 'sent', text: "Not yet, anything major?", time: '10:03 AM' },
            { type: 'recv', text: "They nerfed our main again 😭", time: '10:05 AM' },
        ],
        ArcadeWitch: [
            { type: 'recv', text: "gg wp 😎 rematch tomorrow?", time: 'Mon' },
            { type: 'sent', text: "100%! I'm free after 7pm", time: 'Mon' },
        ],
        BlazeFury99: null, // already rendered in HTML
    };

    const history = convos[username];
    if (!history) { scrollToBottom(); return; }

    history.forEach(msg => {
        appendBubble(msg.type, msg.text, msg.time, userData);
    });

    scrollToBottom();
}

// ─── Append a bubble to the messages area ─────────────────
function appendBubble(type, text, timeStr, userData) {
    const group = document.createElement('div');
    group.className = `msg-group ${type}`;
    group.style.animation = 'msgSlideIn 0.25s ease';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'msg-checkbox';
    
    // Position checkbox on left visually (row for recv, row-reverse for sent)
    if (type === 'recv') group.appendChild(checkbox);

    if (type === 'recv' && userData) {
        const av = document.createElement('div');
        av.className = `avatar msg-avatar ${userData.avClass}`;
        av.textContent = userData.initials;
        group.appendChild(av);
    }

    const bubblesDiv = document.createElement('div');
    bubblesDiv.className = 'bubbles';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr;

    bubblesDiv.appendChild(bubble);
    bubblesDiv.appendChild(timeSpan);
    group.appendChild(bubblesDiv);
    
    // For sent messages, append checkbox last so it appears on left (due to row-reverse)
    if (type === 'sent') group.appendChild(checkbox);
    
    messagesArea.appendChild(group);
}

// ─── Send a message ────────────────────────────────────────
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    appendBubble('sent', text, time, null);

    messageInput.value = '';
    messageInput.focus();
    scrollToBottom();
}



// ─── Auto-scroll to bottom ─────────────────────────────────
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// ─── Emoji Picker toggle ───────────────────────────────────
function toggleEmojiPicker() {
    emojiPicker.classList.toggle('visible');
    emojiPicker.style.display = emojiPicker.classList.contains('visible') ? 'flex' : 'none';
}

// ─── Insert emoji into input ───────────────────────────────
emojiPicker.querySelectorAll('span').forEach(span => {
    span.addEventListener('click', () => {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const val = messageInput.value;
        messageInput.value = val.slice(0, start) + span.textContent + val.slice(end);
        messageInput.selectionStart = messageInput.selectionEnd = start + span.textContent.length;
        messageInput.focus();
    });
});

// ─── Close emoji picker on outside click ──────────────────
document.addEventListener('click', e => {
    if (
        emojiPicker.classList.contains('visible') &&
        !emojiPicker.contains(e.target) &&
        !emojiToggleBtn.contains(e.target)
    ) {
        emojiPicker.classList.remove('visible');
        emojiPicker.style.display = 'none';
    }
});

// ─── Enter key to send ─────────────────────────────────────
messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ─── Search / filter chat list ─────────────────────────────
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll('.chat-item').forEach(item => {
        const name = item.getAttribute('data-user') || '';
        item.style.display = name.toLowerCase().includes(query) ? 'flex' : 'none';
    });
});

// ─── Sidebar nav icon active state ────────────────────────
document.querySelectorAll('.nav-icon').forEach(icon => {
    icon.addEventListener('click', function () {
        // Only toggle active on the sidebar nav group (not settings/profile)
        const parent = this.closest('.sidebar-nav');
        if (parent) {
            parent.querySelectorAll('.nav-icon').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// ─── Chat Options Menu ─────────────────────────────────────
const chatOptionsMenu = document.getElementById('chatOptionsMenu');

function toggleChatMenu() {
    chatOptionsMenu.classList.toggle('visible');
}

// Close options menu when clicking outside
document.addEventListener('click', e => {
    if (
        chatOptionsMenu && 
        chatOptionsMenu.classList.contains('visible') &&
        !chatOptionsMenu.contains(e.target) &&
        !e.target.closest('button[onclick="toggleChatMenu()"]')
    ) {
        chatOptionsMenu.classList.remove('visible');
    }
});

function clearCurrentChat() {
    if (confirm(`Are you sure you want to clear chat history with ${currentUser}?`)) {
        messagesArea.innerHTML = `
            <div class="date-divider"><span>Today</span></div>
        `;
        toggleChatMenu();
    }
}

function viewUserProfile() {
    alert(`Viewing profile for: ${currentUser}`);
    toggleChatMenu();
}

// ─── Search in Chat ────────────────────────────────────────
const chatSearchBar = document.getElementById('chatSearchBar');
const chatSearchInput = document.getElementById('chatSearchInput');

function toggleChatSearch() {
    if (chatSearchBar.style.display === 'none' || chatSearchBar.style.display === '') {
        chatSearchBar.style.display = 'flex';
        chatSearchInput.focus();
    } else {
        chatSearchBar.style.display = 'none';
        chatSearchInput.value = '';
        chatSearchInput.dispatchEvent(new Event('input')); // Reset filter
    }
}

chatSearchInput.addEventListener('input', () => {
    const query = chatSearchInput.value.toLowerCase().trim();
    const words = query.split(/\s+/).filter(w => w.length > 0);
    const groups = messagesArea.querySelectorAll('.msg-group');
    let visibleCount = 0;
    
    groups.forEach(group => {
        const bubbles = group.querySelectorAll('.bubble');
        let match = false;
        
        if (words.length === 0) {
            match = true;
        } else {
            bubbles.forEach(b => {
                const text = b.textContent.toLowerCase();
                words.forEach(word => {
                    if (text.includes(word)) match = true;
                });
            });
        }
        
        group.style.display = match ? 'flex' : 'none';
        if (match) visibleCount++;
    });
    
    // Handle "Cannot found" message
    let noResultsEl = document.getElementById('noSearchResults');
    if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.id = 'noSearchResults';
        noResultsEl.className = 'no-results-msg';
        noResultsEl.style.textAlign = 'center';
        noResultsEl.style.color = 'var(--text-muted)';
        noResultsEl.style.marginTop = '40px';
        noResultsEl.style.fontSize = '14.5px';
        noResultsEl.style.width = '100%';
        messagesArea.appendChild(noResultsEl);
    }
    
    if (visibleCount === 0 && words.length > 0) {
        noResultsEl.textContent = `cannot found`;
        noResultsEl.style.display = 'block';
    } else {
        noResultsEl.style.display = 'none';
    }
});

// ─── Delete Mode Selection ─────────────────────────────────
const deleteSelectionBar = document.getElementById('deleteSelectionBar');
const selectedCountEl = document.getElementById('selectedCount');
const appContainer = document.querySelector('.app-container');

function enterDeleteMode() {
    toggleChatMenu(); // Close the options menu if open
    
    // Auto-inject checkboxes into existing HTML messages if missing
    document.querySelectorAll('.msg-group').forEach(group => {
        if (!group.querySelector('.msg-checkbox')) {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'msg-checkbox';
            if (group.classList.contains('sent')) {
                group.appendChild(cb); // flex-direction: row-reverse -> visually left
            } else {
                group.prepend(cb); // flex-direction: row -> visually left
            }
        }
        // clear selected state
        group.classList.remove('selected');
        const checkbox = group.querySelector('.msg-checkbox');
        if (checkbox) checkbox.checked = false;
    });

    appContainer.classList.add('in-delete-mode');
    messagesArea.classList.add('delete-mode');
    deleteSelectionBar.style.display = 'flex';
    
    if (chatSearchBar.style.display === 'flex') {
        toggleChatSearch(); // Hide search if open
    }
    
    updateSelectedCount();
}

function cancelDeleteMode() {
    appContainer.classList.remove('in-delete-mode');
    messagesArea.classList.remove('delete-mode');
    deleteSelectionBar.style.display = 'none';
    
    document.querySelectorAll('.msg-checkbox').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.msg-group.selected').forEach(group => {
        group.classList.remove('selected');
    });
}

function confirmDeleteSelected() {
    const checked = messagesArea.querySelectorAll('.msg-checkbox:checked');
    if (checked.length === 0) return;
    
    // Check if ALL selected messages were sent by the CURRENT user
    let allSentByMe = true;
    checked.forEach(cb => {
        const group = cb.closest('.msg-group');
        if (!group.classList.contains('sent')) {
            allSentByMe = false;
        }
    });
    
    // Show modal
    const modal = document.getElementById('deleteModal');
    const title = document.getElementById('deleteModalTitle');
    const btnEveryone = document.getElementById('btnDeleteEveryone');
    
    title.textContent = `Delete ${checked.length} message${checked.length > 1 ? 's' : ''}?`;
    btnEveryone.style.display = allSentByMe ? 'block' : 'none';
    modal.style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function executeDeleteForMe() {
    const checked = messagesArea.querySelectorAll('.msg-checkbox:checked');
    checked.forEach(cb => {
        const group = cb.closest('.msg-group');
        if (group) group.remove();
    });
    closeDeleteModal();
    cancelDeleteMode();
}

function executeDeleteForEveryone() {
    const checked = messagesArea.querySelectorAll('.msg-checkbox:checked');
    checked.forEach(cb => {
        const group = cb.closest('.msg-group');
        if (group) {
            // Replace bubbles with "You deleted this message"
            const bubblesContainer = group.querySelector('.bubbles');
            if (bubblesContainer) {
                bubblesContainer.innerHTML = `
                    <div class="bubble" style="background: transparent; border: 1px solid var(--border); color: var(--text-muted); font-style: italic;">
                        <i class="fa-solid fa-ban" style="margin-right: 6px;"></i>You deleted this message
                    </div>
                    <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                `;
            }
        }
    });
    closeDeleteModal();
    cancelDeleteMode();
}

function updateSelectedCount() {
    const checked = messagesArea.querySelectorAll('.msg-checkbox:checked');
    selectedCountEl.textContent = `${checked.length} selected`;
}

// Delegate click events in messages area to handle selection toggling
messagesArea.addEventListener('click', e => {
    if (!messagesArea.classList.contains('delete-mode')) return;
    
    const group = e.target.closest('.msg-group');
    if (!group) return;

    const cb = group.querySelector('.msg-checkbox');
    if (!cb) return;

    // Prevent double toggle if the user explicitly clicked the checkbox
    if (e.target.tagName !== 'INPUT') {
        cb.checked = !cb.checked;
    }
    
    group.classList.toggle('selected', cb.checked);
    updateSelectedCount();
});

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    scrollToBottom();
    messageInput.focus();
});
