document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════ ELEMENTS ═══════════════
    const exploreBtn = document.getElementById('exploreBtn');
    const categoriesSection = document.getElementById('categoriesSection');
    const createToggleBtn = document.getElementById('createToggleBtn');
    const createFormContainer = document.getElementById('createFormContainer');
    
    const joinModalOverlay = document.getElementById('joinModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalGroupName = document.getElementById('modalGroupName');
    const joinModalHobby = document.getElementById('joinModalHobby');
    
    const joinGroupForm = document.getElementById('joinGroupForm');
    const createGroupForm = document.getElementById('createGroupForm');

    // ═══════════════ EXPLORE GROUPS ═══════════════
    exploreBtn.addEventListener('click', () => {
        if (categoriesSection.style.display === 'none') {
            categoriesSection.style.display = 'block';
            categoriesSection.scrollIntoView({ behavior: 'smooth' });
            exploreBtn.textContent = 'Hide Categories';
        } else {
            categoriesSection.style.display = 'none';
            exploreBtn.textContent = 'Explore Groups';
        }
    });

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
    window.filterGroups = (category) => {
        alert(`Showing groups for: ${category}`);
        // In a real app, you would filter the groups-grid here
    };
});
