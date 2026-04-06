/**
 * PassionForge — Chat Interface JavaScript
 * ─────────────────────────────────────────
 * Handles:
 *  • WebSocket real-time messaging
 *  • Chat selection & header updates
 *  • Sending messages (button + Enter key)
 *  • Emoji picker toggle & insertion
 *  • Auto-scroll to latest message
 *  • XSS-safe HTML escaping
 *  • Navigation to dashboard
 */

'use strict';

// ─── API & User State ──────────────────────────────────────
const API = ''; // Relative to origin
const U = JSON.parse(localStorage.getItem('pf_user') || '{}');

// ─── DOM element references ────────────────────────────────
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatList = document.getElementById('chatList');
const searchInput = document.getElementById('searchInput');
const headerUsername = document.getElementById('headerUsername');
const headerAvatar = document.getElementById('headerAvatar');
const headerStatus = document.getElementById('headerStatus');
const emojiPicker = document.getElementById('emojiPicker');
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const chatOptionsMenu = document.getElementById('chatOptionsMenu');
const chatSearchBar = document.getElementById('chatSearchBar');
const chatSearchInput = document.getElementById('chatSearchInput');
const deleteSelectionBar = document.getElementById('deleteSelectionBar');
const selectedCountEl = document.getElementById('selectedCount');
const appContainer = document.querySelector('.app-container');

// ─── State ─────────────────────────────────────────────────
let currentUser = 'Meghana'; // Peer username
let messages = []; // Array of {sender, content, timestamp, isMe, pending, error}
let socket = null;

// ─── Escape HTML to prevent XSS ─────────────────────────────
function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function goToDashboard() { window.location.href = 'index.html'; }

// ─── WebSocket Initialization ──────────────────────────────
function initWebSocket() {
    if (!U.username) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${U.username}`;
    
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Only append if it's from the person we are currently chatting with
        if (data.sender === currentUser) {
            messages.push({
                sender: data.sender,
                content: data.content,
                timestamp: new Date().toISOString(),
                isMe: false
            });
            renderMessages();
        }
    };

    socket.onclose = () => {
        console.warn('WebSocket closed. Reconnecting in 3s...');
        setTimeout(initWebSocket, 3000);
    };

    socket.onerror = (err) => console.error('WebSocket error:', err);
}

// ─── Select a Chat ─────────────────────────────────────────
window.selectChat = function(element, username, status, userId) {
    currentUser = username;
    
    // Update active class in list
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    // Update Header
    headerUsername.textContent = username;
    headerAvatar.textContent = username.charAt(0).toUpperCase();
    headerStatus.innerHTML = `<i class="fa-solid fa-circle status-online-icon"></i> ${status.replace('● ', '')}`;
    messageInput.placeholder = `Message ${username}...`;

    loadConversation(username);
};

// ─── Load Conversation ─────────────────────────────────────
async function loadConversation(username) {
    if (!U.id) return;
    try {
        const res = await fetch(`${API}/messages?user_id=${U.id}&peer=${username}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const rawMsgs = await res.json();
        
        if (rawMsgs.length === 0) {
            // Add dummy messages for demonstration
            messages = [
                { sender: currentUser, content: `Yo welcome to the lobby! 🎮 Ready to grind some ranked tonight?`, timestamp: new Date().toISOString(), isMe: false },
                { sender: 'Me', content: "Haha let's GO! Just finished downloading the update 🔥", timestamp: new Date().toISOString(), isMe: true },
                { sender: currentUser, content: "Nice! Queue up when you're ready, I'll be in the warmup lobby.", timestamp: new Date().toISOString(), isMe: false }
            ];
        } else {
            messages = rawMsgs.map(m => ({
                sender: (m.sender_id === U.id) ? 'Me' : currentUser,
                content: m.content,
                timestamp: m.timestamp,
                isMe: (m.sender_id === U.id)
            }));
        }
        
        renderMessages();
    } catch (e) {
        console.error('Failed to load chat', e);
        // If failed, show empty or local dummy messages
        messages = [];
        renderMessages();
    }
}

// ─── Render Messages ───────────────────────────────────────
function renderMessages() {
    messagesArea.innerHTML = '<div class="date-divider"><span>Today</span></div>';
    
    messages.forEach((msg, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = `msg-group ${msg.isMe ? 'sent' : 'received'}`;
        if (msg.pending) groupDiv.style.opacity = '0.6';
        if (msg.error) groupDiv.classList.add('error');

        let avatarHtml = '';
        if (!msg.isMe) {
            avatarHtml = `<div class="avatar av-orange msg-avatar">${currentUser.charAt(0)}</div>`;
        }

        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        groupDiv.innerHTML = `
            ${avatarHtml}
            <div class="bubbles">
                <div class="bubble">${escapeHTML(msg.content)}</div>
                <span class="msg-time">${timeStr} ${msg.error ? '⚠️' : ''}</span>
            </div>
        `;
        
        messagesArea.appendChild(groupDiv);
    });
    
    scrollToBottom();
}

// ─── Send Message ──────────────────────────────────────────
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !U.id) return;

    // Optimistic Update
    const tempId = Date.now();
    const newMsg = {
        id: tempId,
        sender: 'Me',
        content: text,
        timestamp: new Date().toISOString(),
        isMe: true,
        pending: true
    };
    
    messages.push(newMsg);
    renderMessages();
    messageInput.value = '';

    try {
        const res = await fetch(API + '/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender_id: U.id, recipient: currentUser, content: text })
        });
        
        if (res.ok) {
            newMsg.pending = false;
        } else {
            newMsg.error = true;
        }
    } catch (e) {
        newMsg.error = true;
    }
    renderMessages();
}

// ─── UI Helpers ────────────────────────────────────────────
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

window.toggleEmojiPicker = function() {
    emojiPicker.classList.toggle('visible');
    emojiPicker.style.display = emojiPicker.classList.contains('visible') ? 'flex' : 'none';
};

window.toggleChatMenu = function() {
    chatOptionsMenu.classList.toggle('visible');
};

window.toggleChatSearch = function() {
    if (chatSearchBar.style.display === 'none' || chatSearchBar.style.display === '') {
        chatSearchBar.style.display = 'flex';
        chatSearchInput.focus();
    } else {
        chatSearchBar.style.display = 'none';
        chatSearchInput.value = '';
        chatSearchInput.dispatchEvent(new Event('input'));
    }
};

// ─── Search Functionality ──────────────────────────────────
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.chat-item').forEach(item => {
            const name = item.getAttribute('data-user') || '';
            item.style.display = name.toLowerCase().includes(query) ? 'flex' : 'none';
        });
    });
}

if (chatSearchInput) {
    chatSearchInput.addEventListener('input', () => {
        const query = chatSearchInput.value.toLowerCase().trim();
        const groups = messagesArea.querySelectorAll('.msg-group');
        let visibleCount = 0;
        
        groups.forEach(group => {
            const text = group.innerText.toLowerCase();
            const match = text.includes(query);
            group.style.display = match ? 'flex' : 'none';
            if (match) visibleCount++;
        });
    });
}

// ─── Emoji Insertion ───────────────────────────────────────
if (emojiPicker) {
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
}

// ─── Delete Mode Logic ─────────────────────────────────────
window.enterDeleteMode = function() {
    chatOptionsMenu.classList.remove('visible');
    appContainer.classList.add('in-delete-mode');
    messagesArea.classList.add('delete-mode');
    deleteSelectionBar.style.display = 'flex';
    
    // Inject checkboxes
    document.querySelectorAll('.msg-group').forEach(group => {
        if (!group.querySelector('.msg-checkbox')) {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'msg-checkbox';
            group.appendChild(cb);
        }
    });
};

window.cancelDeleteMode = function() {
    appContainer.classList.remove('in-delete-mode');
    messagesArea.classList.remove('delete-mode');
    deleteSelectionBar.style.display = 'none';
    document.querySelectorAll('.msg-checkbox').forEach(cb => cb.remove());
};

window.confirmDeleteSelected = function() {
    const checked = messagesArea.querySelectorAll('.msg-checkbox:checked');
    if (checked.length === 0) return;
    if (confirm(`Delete ${checked.length} messages?`)) {
        checked.forEach(cb => cb.closest('.msg-group').remove());
        cancelDeleteMode();
    }
};

// ─── Keyboard & Outside Click ──────────────────────────────
messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

document.addEventListener('click', e => {
    if (emojiPicker.classList.contains('visible') && !emojiPicker.contains(e.target) && !emojiToggleBtn.contains(e.target)) {
        emojiPicker.classList.remove('visible');
        emojiPicker.style.display = 'none';
    }
    if (chatOptionsMenu.classList.contains('visible') && !chatOptionsMenu.contains(e.target) && !e.target.closest('button[onclick="toggleChatMenu()"]')) {
        chatOptionsMenu.classList.remove('visible');
    }
});

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadConversation(currentUser);
    messageInput.focus();
});
