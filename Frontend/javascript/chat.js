// chat.js
// Handles simple UI interactions for the chat mock

document.addEventListener('DOMContentLoaded', () => {
    // Handle input Enter key to send message
    const msgInput = document.getElementById('messageInput');
    msgInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Handle Mic Icon replacing Send Icon logic
    // (If user types, show send icon; if empty, show mic)
    const sendBtnIcon = document.querySelector('#sendBtn i');
    msgInput.addEventListener('input', function() {
        if(this.value.trim().length > 0) {
            sendBtnIcon.classList.remove('fa-microphone');
            sendBtnIcon.classList.add('fa-paper-plane');
        } else {
            sendBtnIcon.classList.remove('fa-paper-plane');
            sendBtnIcon.classList.add('fa-microphone');
        }
    });
});

// Function to handle switching active contact
function selectContact(element, contactName) {
    // 1. Remove active class from all contacts
    const contacts = document.querySelectorAll('.contact-item');
    contacts.forEach(c => c.classList.remove('active'));

    // 2. Add active class to clicked contact
    element.classList.add('active');

    // 3. Update the chat header info
    const headerName = document.querySelector('.current-chat-info .user-name');
    if (headerName) {
        headerName.textContent = contactName;
    }

    // Replace the avatar in the header to match the selected contact
    const avatarInnerHtml = element.querySelector('.contact-avatar').innerHTML;
    const avatarClasses = element.querySelector('.contact-avatar').className;
    
    const headerAvatar = document.querySelector('.current-chat-info .contact-avatar');
    if(headerAvatar) {
        headerAvatar.className = avatarClasses;
        headerAvatar.innerHTML = avatarInnerHtml;
    }

    // Note: In a real app, you would fetch and display the chat history for this user via AJAX/WebSocket.
}

// Function to send a message
function sendMessage() {
    const input = document.getElementById('messageInput');
    const messageText = input.value.trim();

    if (messageText === '') return; // Don't send empty messages

    // 1. Create a new message wrapper
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row sent';

    // 2. Construct inner HTML (the bubble)
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageRow.innerHTML = `
        <div class="message bubble accent-bg">
            <p>${escapeHTML(messageText)}</p>
            <span class="message-time">${timeString} <i class="fa-solid fa-check"></i></span>
        </div>
    `;

    // 3. Append to chat area
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.appendChild(messageRow);

    // 4. Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 5. Clear input and reset icon
    input.value = '';
    const sendBtnIcon = document.querySelector('#sendBtn i');
    sendBtnIcon.classList.remove('fa-paper-plane');
    sendBtnIcon.classList.add('fa-microphone');
}

// Helper to escape HTML to prevent XSS (basic implementation)
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
