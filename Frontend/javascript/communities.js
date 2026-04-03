document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════ ELEMENTS ═══════════════

    const createToggleBtn = document.getElementById('createToggleBtn');
    const createFormContainer = document.getElementById('createFormContainer');
    
    const joinModalOverlay = document.getElementById('joinModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalGroupName = document.getElementById('modalGroupName');
    const joinModalHobby = document.getElementById('joinModalHobby');
    
    const joinGroupForm = document.getElementById('joinGroupForm');
    const createGroupForm = document.getElementById('createGroupForm');

    // ═══════════════ SIDEBAR NAVIGATION ═══════════════
    const navIcons = document.querySelectorAll('.nav-icon');
    
    navIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const parent = this.closest('.sidebar-nav');
            if (parent) {
                parent.querySelectorAll('.nav-icon').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    window.goToDashboard = () => {
        window.location.href = 'index.html';
    };

    // ═══════════════ JOIN MODAL ═══════════════
    window.openJoinModal = (name) => {
        modalGroupName.textContent = name;
        joinModalHobby.value = name.replace(' Lovers', '').replace(' Enthusiasts', '').replace("’ Hub", '').replace(' Community', '');
        joinModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scroll
    };

    closeModalBtn.addEventListener('click', () => {
        joinModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    joinModalOverlay.addEventListener('click', (e) => {
        if (e.target === joinModalOverlay) {
            joinModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ═══════════════ CREATE GROUP ═══════════════
    createToggleBtn.addEventListener('click', () => {
        if (createFormContainer.style.display === 'none') {
            createFormContainer.style.display = 'block';
            createToggleBtn.textContent = 'Cancel';
            createFormContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            createFormContainer.style.display = 'none';
            createToggleBtn.textContent = 'Create Group';
        }
    });

    // ═══════════════ FORM SUBMISSIONS ═══════════════
    joinGroupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert(`Successfully joined ${modalGroupName.textContent}! Welcome to the community.`);
        joinModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        joinGroupForm.reset();
    });

    createGroupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const gName = createGroupForm.querySelector('input[placeholder="Community Name"]').value;
        alert(`Congratulations! Your group "${gName}" has been created.`);
        createFormContainer.style.display = 'none';
        createToggleBtn.textContent = 'Create Group';
        createGroupForm.reset();
    });

    // ═══════════════ CATEGORY FILTER (MOCK) ═══════════════


    // ═══════════════ DEEP LINKING ═══════════════
    if (window.location.hash === '#create' || window.location.search.includes('action=create')) {
        setTimeout(() => {
            if (createFormContainer.style.display === 'none') {
                createFormContainer.style.display = 'block';
                createToggleBtn.textContent = 'Cancel';
                createFormContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    }
});
