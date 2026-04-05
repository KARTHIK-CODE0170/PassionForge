import { supabase, requireAuth, getCurrentProfile, signOut } from './supabaseClient.js';

let currentUser = null;
let currentProfile = null;
let votedPosts = {};
let challengeDone = false;
let toastTimer = null;

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;

  currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    window.location.href = '/Frontend/html/hobby_selection.html';
    return;
  }

  setupUI();
  await Promise.all([
    loadPosts(),
    loadCommunities(),
    loadCreators(),
    loadUserVotes()
  ]);

  setupSearch();
}

function setupUI() {
  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl && currentProfile) {
    avatarEl.textContent = currentProfile.avatar_initials;
    avatarEl.style.background = currentProfile.avatar_gradient;
  }

  const profilePopupAvatar = document.querySelector('.profile-popup-avatar');
  const profilePopupName = document.querySelector('.profile-popup-name');
  const profilePopupHandle = document.querySelector('.profile-popup-handle');

  if (profilePopupAvatar && currentProfile) {
    profilePopupAvatar.textContent = currentProfile.avatar_initials;
    profilePopupAvatar.style.background = currentProfile.avatar_gradient;
  }
  if (profilePopupName && currentProfile) {
    profilePopupName.textContent = currentProfile.display_name;
  }
  if (profilePopupHandle && currentProfile) {
    profilePopupHandle.textContent = `u/${currentProfile.username}`;
  }
}

async function loadPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(username, display_name, avatar_initials, avatar_gradient)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const feed = document.getElementById('centerFeed');
    const loadMoreWrap = feed.querySelector('.load-more-wrap');

    document.querySelectorAll('.post-card').forEach(post => {
      if (post.id && post.id.startsWith('post-')) {
        post.remove();
      }
    });

    data.forEach(post => {
      const postEl = createPostElement(post);
      feed.insertBefore(postEl, loadMoreWrap);
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    showToast('Failed to load posts');
  }
}

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  article.id = `post-${post.id}`;
  article.setAttribute('data-category', post.category);

  const timeAgo = getTimeAgo(new Date(post.created_at));
  const categoryTag = getCategoryTag(post.category);

  article.innerHTML = `
    <div class="post-vote">
      <button class="vote-btn up" onclick="window.appreciatePost('${post.id}', this)">&#9650;</button>
      <span class="vote-count" id="count-post-${post.id}">${post.vote_count}</span>
      <button class="vote-btn down" onclick="window.downPost('${post.id}', this)">&#9660;</button>
    </div>
    <div class="post-body">
      <div class="post-meta">
        <div class="avatar" style="background:${post.author.avatar_gradient}">${post.author.avatar_initials}</div>
        <span class="username">u/${post.author.username}</span>
        <span class="dot">&middot;</span>
        <span class="cat-tag ${categoryTag.class}">${categoryTag.icon} ${post.category}</span>
        <span class="dot">&middot;</span>
        <span class="post-time">${timeAgo}</span>
        <span class="credits">&#9733; ${Math.floor(post.vote_count * 1.3)} credits</span>
      </div>
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      <p class="post-preview">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
      <div class="post-actions">
        <button class="action-btn" onclick="window.toggleComment('post-${post.id}')">&#9656; ${post.comment_count} Comments</button>
        <button class="action-btn" onclick="window.sharePost('${escapeHtml(post.title)}')">&#8599; Share</button>
        <button class="action-btn save-btn" onclick="window.savePost(this, '${post.id}')">&#9734; Save</button>
      </div>
      <div class="comment-box hidden" id="comment-post-${post.id}">
        <textarea class="comment-input" placeholder="Write a comment..." rows="2"></textarea>
        <button class="btn-comment-submit" onclick="window.submitComment(this, '${post.id}')">Post Comment</button>
      </div>
    </div>
  `;

  return article;
}

function getCategoryTag(category) {
  const tags = {
    music: { class: 'music-tag', icon: '&#9834;' },
    painting: { class: 'painting-tag', icon: '&#10000;' },
    writing: { class: 'writing-tag', icon: '&#9998;' },
    dance: { class: 'dance-tag', icon: '&#9836;' },
    photography: { class: 'photography-tag', icon: '&#9685;' }
  };
  return tags[category.toLowerCase()] || { class: 'music-tag', icon: '&#9670;' };
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadUserVotes() {
  try {
    const { data, error } = await supabase
      .from('post_votes')
      .select('post_id, vote_type')
      .eq('user_id', currentUser.id);

    if (error) throw error;

    data.forEach(vote => {
      votedPosts[vote.post_id] = vote.vote_type;
      const btn = document.querySelector(`#post-${vote.post_id} .vote-btn.${vote.vote_type}`);
      if (btn) btn.classList.add('voted');
    });
  } catch (error) {
    console.error('Error loading votes:', error);
  }
}

async function loadCommunities() {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .limit(4);

    if (error) throw error;

    const { data: memberships, error: memberError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', currentUser.id);

    if (memberError) throw memberError;

    const joinedIds = new Set(memberships.map(m => m.community_id));

    const commMenu = document.getElementById('commMenu');
    const items = commMenu.querySelectorAll('.s-item');
    items.forEach((item, index) => {
      if (data[index]) {
        const community = data[index];
        item.setAttribute('data-community-id', community.id);
        const tag = item.querySelector('.join-tag');
        if (tag) {
          if (joinedIds.has(community.id)) {
            tag.classList.add('joined');
            tag.textContent = 'Joined ✓';
          } else {
            tag.classList.remove('joined');
            tag.textContent = 'Join';
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading communities:', error);
  }
}

async function loadCreators() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_initials, avatar_gradient')
      .neq('id', currentUser.id)
      .limit(4);

    if (error) throw error;

    const { data: follows, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id);

    if (followError) throw followError;

    const followingIds = new Set(follows.map(f => f.following_id));

    const creatorsList = document.querySelector('.creators-list');
    if (creatorsList && data.length > 0) {
      creatorsList.innerHTML = '';
      data.forEach(creator => {
        const li = document.createElement('li');
        li.className = 'creator-item';
        const isFollowing = followingIds.has(creator.id);
        li.innerHTML = `
          <div class="creator-avatar" style="background:${creator.avatar_gradient}">${creator.avatar_initials}</div>
          <div class="creator-info">
            <span class="creator-name">${creator.display_name}</span>
            <span class="creator-hobby">Creator</span>
          </div>
          <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="window.followCreator(this, '${creator.id}')">
            ${isFollowing ? 'Following ✓' : 'Follow'}
          </button>
        `;
        creatorsList.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error loading creators:', error);
  }
}

async function appreciatePost(id, btn) {
  const el = document.getElementById(`count-post-${id}`);
  const val = parseInt(el.textContent);

  try {
    if (votedPosts[id] === 'up') {
      await supabase.from('post_votes').delete().match({ post_id: id, user_id: currentUser.id });
      el.textContent = val - 1;
      btn.classList.remove('voted');
      votedPosts[id] = null;
    } else {
      if (votedPosts[id] === 'down') {
        await supabase.from('post_votes').update({ vote_type: 'up' }).match({ post_id: id, user_id: currentUser.id });
        el.textContent = val + 2;
        clearVote(id, 'down');
      } else {
        await supabase.from('post_votes').insert({ post_id: id, user_id: currentUser.id, vote_type: 'up' });
        el.textContent = val + 1;
      }
      btn.classList.add('voted');
      votedPosts[id] = 'up';
      showToast('You appreciated this post.');
    }
  } catch (error) {
    console.error('Error voting:', error);
    showToast('Failed to vote');
  }
}

async function downPost(id, btn) {
  const el = document.getElementById(`count-post-${id}`);
  const val = parseInt(el.textContent);

  try {
    if (votedPosts[id] === 'down') {
      await supabase.from('post_votes').delete().match({ post_id: id, user_id: currentUser.id });
      el.textContent = val + 1;
      btn.classList.remove('voted');
      votedPosts[id] = null;
    } else {
      if (votedPosts[id] === 'up') {
        await supabase.from('post_votes').update({ vote_type: 'down' }).match({ post_id: id, user_id: currentUser.id });
        el.textContent = val - 2;
        clearVote(id, 'up');
      } else {
        await supabase.from('post_votes').insert({ post_id: id, user_id: currentUser.id, vote_type: 'down' });
        el.textContent = val - 1;
      }
      btn.classList.add('voted');
      votedPosts[id] = 'down';
    }
  } catch (error) {
    console.error('Error voting:', error);
    showToast('Failed to vote');
  }
}

function clearVote(id, type) {
  const b = document.querySelector(`#post-${id} .vote-btn.${type}`);
  if (b) b.classList.remove('voted');
}

async function submitComment(btn, postId) {
  const box = btn.closest('.comment-box');
  const input = box.querySelector('.comment-input');
  const content = input.value.trim();

  if (!content) {
    input.style.borderColor = '#F97316';
    input.focus();
    return;
  }

  try {
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: currentUser.id,
        content: content
      });

    if (error) throw error;

    showToast('Comment posted.');
    input.value = '';
    input.style.borderColor = '';
    box.classList.add('hidden');
  } catch (error) {
    console.error('Error posting comment:', error);
    showToast('Failed to post comment');
  }
}

async function savePost(btn, postId) {
  try {
    const isSaved = btn.classList.contains('saved');

    if (isSaved) {
      await supabase.from('saved_posts').delete().match({ user_id: currentUser.id, post_id: postId });
      btn.classList.remove('saved', 'active');
      btn.innerHTML = '&#9734; Save';
      showToast('Removed from saved.');
    } else {
      await supabase.from('saved_posts').insert({ user_id: currentUser.id, post_id: postId });
      btn.classList.add('saved', 'active');
      btn.innerHTML = '&#9733; Saved';
      showToast('Post saved.');
    }
  } catch (error) {
    console.error('Error saving post:', error);
    showToast('Failed to save post');
  }
}

async function joinCommunity(item, name) {
  const communityId = item.getAttribute('data-community-id');
  if (!communityId) return;

  const tag = item.querySelector('.join-tag');
  const isJoined = tag.classList.contains('joined');

  try {
    if (isJoined) {
      await supabase.from('community_members').delete().match({ community_id: communityId, user_id: currentUser.id });
      tag.classList.remove('joined');
      tag.textContent = 'Join';
      showToast(`Left ${name}.`);
    } else {
      await supabase.from('community_members').insert({ community_id: communityId, user_id: currentUser.id });
      tag.classList.add('joined');
      tag.textContent = 'Joined ✓';
      showToast(`Welcome to ${name}!`);
    }
  } catch (error) {
    console.error('Error joining community:', error);
    showToast('Failed to update community membership');
  }
}

async function followCreator(btn, creatorId) {
  const isFollowing = btn.classList.contains('following');

  try {
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUser.id, following_id: creatorId });
      btn.classList.remove('following');
      btn.textContent = 'Follow';
      showToast('Unfollowed.');
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: creatorId });
      btn.classList.add('following');
      btn.textContent = 'Following ✓';
      showToast('Now following.');
    }
  } catch (error) {
    console.error('Error following creator:', error);
    showToast('Failed to update follow status');
  }
}

function toggleComment(id) {
  const box = document.getElementById(`comment-${id}`);
  if (box.classList.toggle('hidden')) return;
  box.querySelector('.comment-input').focus();
}

function sharePost(title) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }
  showToast(`Link copied for "${title}".`);
}

function filterFeed(category, clicked) {
  document.querySelectorAll('.s-item[id^="filter-"]').forEach(i => i.classList.remove('active'));
  clicked.classList.add('active');
  document.querySelectorAll('.post-card').forEach(post => {
    post.classList.toggle('hidden', category !== 'all' && post.getAttribute('data-category') !== category);
  });
  showToast(`Filtered by ${category}`);
}

function toggleSection(id, header) {
  const menu = document.getElementById(id);
  const chevron = header.querySelector('.chevron');
  menu.classList.toggle('collapsed');
  chevron.classList.toggle('rotated');
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Sorted by ${name.charAt(0).toUpperCase() + name.slice(1)}`);
}

function toggleProfileMenu(e) {
  e.stopPropagation();
  const popup = document.getElementById('profilePopup');
  popup.classList.toggle('open');
}

function toggleRewardsMenu() {
  const sub = document.getElementById('rewardsSubmenu');
  const chevron = document.getElementById('rewardsChevron');
  sub.classList.toggle('open');
  chevron.classList.toggle('rotated');
}

async function handleLogout() {
  document.getElementById('profilePopup').classList.remove('open');
  showToast('Logging out...');
  try {
    await signOut();
    setTimeout(() => {
      window.location.href = '/Frontend/html/landing.html';
    }, 900);
  } catch (error) {
    console.error('Error logging out:', error);
    showToast('Failed to log out');
  }
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  if (input && clearBtn) {
    input.addEventListener('input', () => {
      clearBtn.classList.toggle('visible', input.value.length > 0);
    });
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.remove('visible');
      input.focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        showToast(`Searching for "${input.value.trim()}"...`);
      }
    });
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

document.addEventListener('click', (e) => {
  const popup = document.getElementById('profilePopup');
  const avatar = document.getElementById('profileAvatar');
  if (popup && popup.classList.contains('open')) {
    if (!popup.contains(e.target) && e.target !== avatar) {
      popup.classList.remove('open');
    }
  }
});

init();

window.appreciatePost = appreciatePost;
window.downPost = downPost;
window.toggleComment = toggleComment;
window.submitComment = submitComment;
window.savePost = savePost;
window.sharePost = sharePost;
window.joinCommunity = joinCommunity;
window.followCreator = followCreator;
window.filterFeed = filterFeed;
window.toggleSection = toggleSection;
window.switchTab = switchTab;
window.toggleProfileMenu = toggleProfileMenu;
window.toggleRewardsMenu = toggleRewardsMenu;
window.handleLogout = handleLogout;
