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

// ─── API & User State ──────────────────────────────────────
const API = '';
const U   = JSON.parse(localStorage.getItem('pf_user') || '{}');

// ─── DOM element references ────────────────────────────────
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn      = document.getElementById('sendBtn');
const emojiPicker  = document.getElementById('emojiPicker');
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const searchInput  = document.getElementById('searchInput');

// Header refs
const headerUsername  = document.getElementById('headerUsername');
const headerAvatar    = document.getElementById('headerAvatar');
const headerStatus    = document.getElementById('headerStatus');
const headerStatusDot = document.getElementById('headerStatusDot');

// ─── Current chat state ────────────────────────────────────
let currentUser = 'Karthik'; // Peer username default

// ─── Utility: XSS-safe HTML escaping ──────────────────────
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function goToDashboard() { 
    window.location.href = 'index.html'; 
}

// ─── Demo Messages (Fallback for empty DB) ─────────────────
const DEMO_MESSAGES = {
    'Karthik': [
        { sender_id: 'peer', content: "Yo welcome to the group! 🎮 Ready to work on the project tonight?" },
        { sender_id: 'me',   content: "Haha let's GO! Just finished the latest code update 🔥" },
        { sender_id: 'peer', content: "Nice! I'll check the repository now." }
    ],
    'Surya': [
        { sender_id: 'peer', content: "Are you joining the group call tonight?" },
        { sender_id: 'me',   content: "Yes, I'll be there by 8 PM!" }
    ],
    'Sowjanya': [
        { sender_id: 'peer', content: "Yo check out the new design I made for the landing page! 👾" },
        { sender_id: 'me',   content: "Looking good! Very clean." }
    ],
    'Nagasri': [
        { sender_id: 'peer', content: "Did you finish the documentation?" },
        { sender_id: 'me',   content: "Almost! Sending it by EOD." }
    ],
    'Meghana': [
        { sender_id: 'peer', content: "Did you see the new update in PassionForge?" },
        { sender_id: 'me',   content: "Yeah, the chat looks points system is cool! 😎" }
    ]
};

// ─── Load real conversation ───────────────────────────────
async function loadConversation(username) {
    // Clear area & show divider
    messagesArea.innerHTML = '';
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.innerHTML = '<span>Today</span>';
    messagesArea.appendChild(divider);

    // If we have demo messages for this user, always show them first (or as fallback)
    if (DEMO_MESSAGES[username]) {
        DEMO_MESSAGES[username].forEach(m => {
            appendMessage(m.content, m.sender_id === 'me' ? 'sent' : 'received');
        });
    }

    // Now try to fetch real ones if logged in
    if (!U.id) {
        console.log("No user session. Showing demo chat only.");
        scrollToBottom();
        return;
    }

    try {
        const res  = await fetch(`${API}/messages?user_id=${U.id}&peer=${username}`);
        if (!res.ok) throw new Error('API failed');
        const msgs = await res.json();
        
        // If there are real messages, they will be appended AFTER the demo messages.
        // If you want to ONLY show real ones if they exist, we'd need to clear again.
        // For a student project, showing demo + real is usually fine or we can clear demp.
        if (msgs.length > 0) {
            // If real messages exist, clear the demo ones and show real ones
            messagesArea.innerHTML = '';
            messagesArea.appendChild(divider);
            msgs.forEach(m => {
                const isMe = (m.sender_id === U.id);
                appendMessage(m.content, isMe ? 'sent' : 'received', m.sender_id);
            });
        }
        scrollToBottom();
    } catch (e) { 
        console.error('Failed to load chat history:', e); 
    }
}

// ─── Select a Chat from the Sidebar ───────────────────────
function selectChat(el, username, status, userId) {
    // 1. UI Update — active states
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');

    // 2. Set state
    currentUser = username;

    // 3. Update Header
    if (headerUsername) headerUsername.textContent = username;
    if (headerStatus)   headerStatus.innerHTML = `<i class="fa-solid fa-circle status-online-icon"></i> ${status.replace('● ', '')}`;
    if (headerAvatar) {
        headerAvatar.textContent = username.substring(0, 2).toUpperCase();
        headerAvatar.className = el.querySelector('.avatar').className; // Keep color
    }
    
    // Reset background status dot
    if (headerStatusDot) {
        const dot = el.querySelector('.status-dot');
        headerStatusDot.className = dot ? dot.className : 'status-dot';
    }

    // 4. Update input placeholder
    if (messageInput) messageInput.placeholder = `Message ${username}...`;

    // 5. Load History
    loadConversation(username);
}

// ─── Send message ──────────────────────────────────────────
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    if (!U.id) {
        alert('You must be logged in to send messages.');
        return;
    }

    try {
        const res = await fetch(`${API}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sender_id: U.id, 
                recipient: currentUser, 
                content: text 
            })
        });
        
        if (res.ok) {
            appendMessage(text, 'sent');
            messageInput.value = '';
            scrollToBottom();
        } else {
            const err = await res.json();
            throw new Error(err.error || 'Failed to send');
        }
    } catch (e) { 
        console.error('Send failed:', e);
        alert('Message failed to send. Check your connection.'); 
    }
}

// ─── Append a message to the messages area ─────────────────
function appendMessage(text, type, senderId) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg-group ${type}`; // type is 'sent' or 'received'
    
    let avatarHTML = '';
    if (type === 'received') {
        const initials = currentUser.substring(0, 2).toUpperCase();
        avatarHTML = `<div class="avatar av-orange msg-avatar">${initials}</div>`;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    msgDiv.innerHTML = `
        ${avatarHTML}
        <div class="bubbles">
            <div class="bubble">${escapeHTML(text)}</div>
            <span class="msg-time">${time}</span>
        </div>
    `;
    
    messagesArea.appendChild(msgDiv);
    scrollToBottom();
}

// ─── Scroll to latest message ─────────────────────────────
function scrollToBottom() {
    if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

// ─── Emoji Picker toggle ───────────────────────────────────
function toggleEmojiPicker() {
    if (!emojiPicker) return;
    emojiPicker.classList.toggle('visible');
    emojiPicker.style.display = emojiPicker.classList.contains('visible') ? 'flex' : 'none';
}

// ─── Insert emoji into input ───────────────────────────────
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

// ─── Close emoji picker on outside click ──────────────────
document.addEventListener('click', e => {
    if (
        emojiPicker &&
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
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.chat-item').forEach(item => {
            const name = item.getAttribute('data-user') || '';
            item.style.display = name.toLowerCase().includes(query) ? 'flex' : 'none';
        });
    });
}

// ─── Sidebar nav icon active state ────────────────────────
document.querySelectorAll('.nav-icon').forEach(icon => {
    icon.addEventListener('click', function () {
        const parent = this.closest('.sidebar-nav');
        if (parent) {
            parent.querySelectorAll('.nav-icon').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

/**
 * OPTIONS MENU & CHAT SEARCH (Simplified)
 */
const chatOptionsMenu = document.getElementById('chatOptionsMenu');

function toggleChatMenu() {
    if (chatOptionsMenu) chatOptionsMenu.classList.toggle('visible');
}

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
        messagesArea.innerHTML = `<div class="date-divider"><span>Today</span></div>`;
        if (chatOptionsMenu) chatOptionsMenu.classList.remove('visible');
    }
}

function viewUserProfile() {
    alert(`Viewing profile for: ${currentUser}`);
    if (chatOptionsMenu) chatOptionsMenu.classList.remove('visible');
}

// ─── Search in Chat ────────────────────────────────────────
const chatSearchBar = document.getElementById('chatSearchBar');
const chatSearchInput = document.getElementById('chatSearchInput');

function toggleChatSearch() {
    if (!chatSearchBar) return;
    if (chatSearchBar.style.display === 'none' || chatSearchBar.style.display === '') {
        chatSearchBar.style.display = 'flex';
        chatSearchInput.focus();
    } else {
        chatSearchBar.style.display = 'none';
        if (chatSearchInput) chatSearchInput.value = '';
        // resetting visibility of bubbles... (logic omitted for brevity or implement if needed)
    }
}

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    if (U.id && currentUser) {
        loadConversation(currentUser);
    }
    
    if (messageInput) messageInput.focus();
    scrollToBottom();
});

// Added to handle the delete mode functions called from HTML
function enterDeleteMode() { alert("Delete mode coming soon in advanced version."); toggleChatMenu(); }
function cancelDeleteMode() {}
function confirmDeleteSelected() {}
