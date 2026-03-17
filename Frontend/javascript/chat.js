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

    // Simulate a reply after a short delay (fun demo behaviour)
    simulateReply();
}

// ─── Simulate incoming reply ───────────────────────────────
function simulateReply() {
    const replies = [
        "haha fr though 😂",
        "GG! 🔥",
        "lol no way 💀",
        "bro same 😤",
        "let's GOOO 🚀",
        "wait what?? 👀",
        "100% agree 💯",
        "insane play dude ⚡",
    ];

    setTimeout(() => {
        const userData = USER_DATA[currentUser];
        if (!userData) return;

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        appendBubble('recv', randomReply, time, userData);
        scrollToBottom();
    }, 900 + Math.random() * 600);
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

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    scrollToBottom();
    messageInput.focus();
});
