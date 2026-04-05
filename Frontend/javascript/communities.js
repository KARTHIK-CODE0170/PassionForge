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

    // ═══════════════ API HELPERS ═══════════════
    const API = ''; // Relative paths
    const U   = JSON.parse(localStorage.getItem('pf_user') || '{}');

    async function fetchCommunities() {
        try {
            const res = await fetch(API + '/communities');
            const data = await res.json();
            renderCommunitiesGrid(data);
        } catch (e) { console.error('Failed to load communities', e); }
    }

    function renderCommunitiesGrid(list) {
        const grid = document.querySelector('.groups-grid');
        if (!grid || !list.length) return;
        
        // We only replace the dynamic part if needed, but for student project, 
        // let's just log or append a newly created one if we want.
        // For now, let's just make the JOIN buttons work.
    }

    // ═══════════════ FORM SUBMISSIONS ═══════════════
    joinGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!U.id) { alert('Please login first'); return; }

        try {
            const res = await fetch(API + '/communities/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: U.id, community_name: modalGroupName.textContent })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Successfully joined ${modalGroupName.textContent}!`);
                joinModalOverlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            } else {
                alert(data.error || 'Failed to join');
            }
        } catch (err) { alert('Connection error'); }
    });

    createGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const gName = createGroupForm.querySelector('input[placeholder="Community Name"]').value;
        const gDesc = createGroupForm.querySelector('textarea').value;

        try {
            const res = await fetch(API + '/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: gName, description: gDesc })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Congratulations! Your group "${gName}" has been created.`);
                createFormContainer.style.display = 'none';
                createToggleBtn.textContent = 'Create Group';
                createGroupForm.reset();
                fetchCommunities();
            } else {
                alert(data.error || 'Failed to create');
            }
        } catch (err) { alert('Connection error'); }
    });

    // ═══════════════ INITIAL LOAD ═══════════════
    fetchCommunities();

    // ═══════════════ CATEGORY FILTER (MOCK) ═══════════════
    window.filterGroups = (category) => {
        alert(`Showing groups for: ${category}`);
    };

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
