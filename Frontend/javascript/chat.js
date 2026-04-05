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
function goToDashboard() { window.location.href = 'index.html'; }


'use strict';

// ─── API & User State ──────────────────────────────────────
const API = '';
const U   = JSON.parse(localStorage.getItem('pf_user') || '{}');

// ─── DOM element references ────────────────────────────────
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
// ... other refs exist

// ─── Current chat state ────────────────────────────────────
let currentUser = 'BlazeFury99'; // Peer username

// ─── Load real conversation ───────────────────────────────
async function loadConversation(username) {
    messagesArea.innerHTML = '';
    if (!U.id) return;

    try {
        const res  = await fetch(`${API}/messages?user_id=${U.id}&peer=${username}`);
        const msgs = await res.json();
        
        // Date divider
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = '<span>Today</span>';
        messagesArea.appendChild(divider);

        msgs.forEach(m => {
            const isMe = (m.sender_id === U.id);
            appendMessage(m.content, isMe ? 'sent' : 'received');
        });
        scrollToBottom();
    } catch (e) { console.error('Failed to load chat', e); }
}

// ─── Send message ──────────────────────────────────────────
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !U.id) return;

    try {
        const res = await fetch(API + '/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender_id: U.id, recipient: currentUser, content: text })
        });
        if (res.ok) {
            appendMessage(text, 'sent');
            messageInput.value = '';
            scrollToBottom();
        }
    } catch (e) { alert('Message failed to send'); }
}

// ─── Append a message to the messages area ─────────────────
function appendMessage(text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `<div class="message-content">${escapeHTML(text)}</div>`;
    messagesArea.appendChild(msgDiv);
}

// ─── Scroll to latest message ─────────────────────────────
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
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
