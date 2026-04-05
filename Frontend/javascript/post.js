/* ============================================================
   post.js  –  Post feed interactions & Create Post module
   All API calls go to the Flask backend at localhost:5000
   ============================================================ */

// ── Backend URL ─────────────────────────────────────────────
// Change this if you run the backend on a different port
// Use relative paths since app.py serves the frontend too
var API = '';

/* ── Vote tracking (local, resets on page refresh) ─────────── */
var votedPosts  = {};
var extraLoaded = false;
var toastTimer  = null;

/* ============================================================
   VOTE / LIKE SYSTEM
   ============================================================ */

async function appreciatePost(id, btn) {
  var el = document.getElementById('count-' + id);
  if (!el) return;
  var val = parseInt(el.textContent) || 0;

  if (votedPosts[id] === 'up') {
    // Already liked — undo the like
    el.textContent    = val - 1;
    btn.classList.remove('voted');
    votedPosts[id]    = null;
    await voteBackend(id, '-1');
  } else {
    // Cancel a downvote first if there was one
    if (votedPosts[id] === 'down') {
      clearVote(id, 'down');
      val++;
      await voteBackend(id, '+1'); // Undo the downvote
    }
    el.textContent = val + 1;
    btn.classList.add('voted');
    votedPosts[id] = 'up';
    await voteBackend(id, '+1');

    // Award points via rewards system (if available)
    if (window.RewardsSystem) {
      RewardsSystem.trackAction('LIKE_POST');
    } else {
      showToast('You appreciated this post!');
    }
  }
}

async function downPost(id, btn) {
  var el = document.getElementById('count-' + id);
  if (!el) return;
  var val = parseInt(el.textContent) || 0;

  if (votedPosts[id] === 'down') {
    // Already downvoted — undo it
    el.textContent    = val + 1;
    btn.classList.remove('voted');
    votedPosts[id]    = null;
    await voteBackend(id, '+1');
  } else {
    // Cancel an upvote first if there was one
    if (votedPosts[id] === 'up') {
      clearVote(id, 'up');
      val--;
      await voteBackend(id, '-1'); // Undo the upvote
    }
    el.textContent = Math.max(0, val - 1);
    btn.classList.add('voted');
    votedPosts[id] = 'down';
    await voteBackend(id, '-1');
  }
}

function clearVote(id, type) {
  // Remove the "voted" highlight from a specific button
  var btn = document.querySelector('#' + id + ' .vote-btn.' + type);
  if (btn) btn.classList.remove('voted');
}

async function voteBackend(postId, action) {
  // Send the vote to the backend so it persists across refreshes
  try {
    await fetch(API + '/posts/' + postId + '/vote', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: action })
    });
  } catch (e) {
    // Backend unreachable — vote still shows locally
    console.warn('Vote not saved to backend:', e);
  }
}

/* ============================================================
   COMMENTS
   ============================================================ */

function toggleComment(id) {
  var box = document.getElementById('comment-' + id);
  if (!box) return;
  if (box.classList.toggle('hidden')) return;
  var inp = box.querySelector('.comment-input');
  if (inp) inp.focus();
}

async function submitComment(btn) {
  var commentBox = btn.closest('.comment-box');
  var input      = commentBox.querySelector('.comment-input');
  var text       = input ? input.value.trim() : '';

  if (!text) {
    if (input) input.style.borderColor = '#F97316';
    return;
  }
  input.style.borderColor = '';

  // The post's ID is stored on the parent article element
  var postCard = btn.closest('.post-card');
  var postId   = postCard ? postCard.id : null;

  // Show the comment immediately (don't wait for backend)
  var list = postCard.querySelector('.comments-list');
  if (!list) {
    list = document.createElement('div');
    list.className = 'comments-list';
    postCard.querySelector('.post-body').appendChild(list);
  }

  var commentEl = document.createElement('div');
  commentEl.style.cssText = 'padding:6px 0;border-top:1px solid #3d3d4a;font-size:13px;color:#d1d5db;';
  commentEl.innerHTML = '<strong>' + escapeHTML(U.username || 'u/you') + ':</strong> ' + escapeHTML(text);
  list.appendChild(commentEl);
  input.value = '';
  commentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Save comment to backend
  try {
    await fetch(API + '/posts/' + postId + '/comment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text:     text,
        username: U.name || ('u/' + U.username) || 'u/you'
      })
    });
    showToast('Comment posted!');
  } catch (e) {
    console.warn('Comment not saved to backend:', e);
  }
}

/* ============================================================
   SAVE / SHARE BUTTONS
   ============================================================ */

function savePost(btn) {
  btn.classList.toggle('saved');
  btn.classList.toggle('active');
  if (btn.classList.contains('saved')) {
    btn.innerHTML = '★ Saved';
    showToast('Post saved!');
  } else {
    btn.innerHTML = '☆ Save';
    showToast('Removed from saved.');
  }
}

function sharePost(title) {
  // Copy the page URL (simplified — a real app would generate a post link)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).catch(function(){});
  }
  showToast('Link copied for "' + title + '".');
}

function loadMore() {
  if (extraLoaded) { showToast('No more posts.'); return; }
  extraLoaded = true;

  var feed = document.getElementById('centerFeed');
  var wrap = feed ? feed.querySelector('.load-more-wrap') : null;

  // TODO: In a real app, fetch the next page of posts from the backend
  // For now we just add a couple of sample posts
  var samples = [
    {
      id: 'post-6', cat: 'music', ini: 'SP',
      bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
      user: 'u/sitar_pro', tag: 'music-tag', label: '🎵 Music',
      time: '8 hours ago', cr: '275 credits',
      title: 'Raga Yaman practice session #45 — breakthroughs and struggles',
      preview: 'Eight months into learning Sitar and I just managed to hold a steady alaap for 12 minutes...',
      comments: 39
    },
    {
      id: 'post-7', cat: 'photography', ini: 'NJ',
      bg: 'linear-gradient(135deg,#EF4444,#F87171)',
      user: 'u/nisha_journeys', tag: 'photography-tag', label: '📷 Photography',
      time: '1 day ago', cr: '310 credits',
      title: 'Street photography ethics — a guide for beginners',
      preview: 'Before you point your lens at a stranger, there\'s a whole conversation about consent...',
      comments: 71
    }
  ];

  samples.forEach(function(d) {
    var a = document.createElement('article');
    a.className = 'post-card';
    a.id        = d.id;
    a.setAttribute('data-category', d.cat);

    a.innerHTML = buildSamplePostHTML(d);
    if (wrap) feed.insertBefore(a, wrap);
    else      feed.appendChild(a);
  });

  showToast('2 more posts loaded!');
  if (wrap) {
    var btn = wrap.querySelector('.btn-load-more');
    if (btn) btn.textContent = 'No more posts';
  }
}

function buildSamplePostHTML(d) {
  var count = Math.floor(Math.random() * 200) + 50;
  return (
    '<div class="post-vote">' +
      '<button class="vote-btn up" onclick="appreciatePost(\'' + d.id + '\',this)">▲</button>' +
      '<span class="vote-count" id="count-' + d.id + '">' + count + '</span>' +
      '<button class="vote-btn down" onclick="downPost(\'' + d.id + '\',this)">▼</button>' +
    '</div>' +
    '<div class="post-body">' +
      '<div class="post-meta">' +
        '<div class="avatar" style="background:' + d.bg + '">' + d.ini + '</div>' +
        '<span class="username">' + d.user + '</span>' +
        '<span class="dot">&middot;</span>' +
        '<span class="cat-tag ' + d.tag + '">' + d.label + '</span>' +
        '<span class="dot">&middot;</span>' +
        '<span class="post-time">' + d.time + '</span>' +
        '<span class="credits">★ ' + d.cr + '</span>' +
      '</div>' +
      '<h2 class="post-title">' + d.title + '</h2>' +
      '<p class="post-preview">' + d.preview + '</p>' +
      '<div class="post-actions">' +
        '<button class="action-btn" onclick="toggleComment(\'' + d.id + '\')">▶ ' + d.comments + ' Comments</button>' +
        '<button class="action-btn" onclick="sharePost(\'' + d.title + '\')">↗ Share</button>' +
        '<button class="action-btn save-btn" onclick="savePost(this)">☆ Save</button>' +
      '</div>' +
      '<div class="comment-box hidden" id="comment-' + d.id + '">' +
        '<textarea class="comment-input" placeholder="Write a comment..." rows="2"></textarea>' +
        '<button class="btn-comment-submit" onclick="submitComment(this)">Post Comment</button>' +
      '</div>' +
    '</div>'
  );
}


/* ============================================================
   USER STATE
   Read from localStorage — set when user logs in via landing.html
   ============================================================ */

var U = (function () {
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('pf_user')); } catch (e) {}

  // Make sure all expected fields exist
  if (saved) {
    if (!saved.name     && saved.username) saved.name     = 'u/' + saved.username;
    if (!saved.initials && saved.username) saved.initials = saved.username.substring(0, 2).toUpperCase();
  }

  // Fallback for when no one is logged in
  return saved || { id: null, name: 'u/guest', username: 'guest', initials: 'GU', posts: 0, points: 0, badges: [] };
}());


/* ============================================================
   CREATE POST — internal state
   ============================================================ */

var cpCurrentType     = 'text';
var cpSelectedHobbies = [];
var cpMediaFile       = null;
var cpMediaUrl        = '';
var postsArray        = []; // All posts from backend, kept in memory

/* ── Helpers ── */

function generateId() {
  return 'post-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function addPoints(pts) { U.points = (U.points || 0) + pts; }

function checkBadges() {
  var milestones = [
    [1,  '🎉 First Post!'],
    [5,  '🔥 5 Posts!'],
    [10, '⭐ 10 Posts Legend!']
  ];
  milestones.forEach(function (m) {
    if (U.posts === m[0] && (!U.badges || U.badges.indexOf(m[1]) === -1)) {
      if (!U.badges) U.badges = [];
      U.badges.push(m[1]);
      setTimeout(function () { showToast('Badge unlocked: ' + m[1]); }, 1500);
    }
  });
}

function saveUserState() {
  try { localStorage.setItem('pf_user', JSON.stringify(U)); } catch (e) {}
}

/* ── Open / Close Create Post Modal ── */

function openCreatePost() {
  resetCreateForm();
  var overlay = document.getElementById('cpOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(function () {
    var ta = document.getElementById('cpCaption');
    if (ta) ta.focus();
  }, 280);
}

function closeCreatePost() {
  var overlay = document.getElementById('cpOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  revokeCurrentMedia();
}

function overlayClose(event) {
  if (event.target === event.currentTarget) closeCreatePost();
}

function resetCreateForm() {
  cpCurrentType = 'text'; cpSelectedHobbies = []; cpMediaFile = null; cpMediaUrl = '';
  ['cpCaption', 'cpHashtags'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var cc = document.getElementById('cpCharCount'); if (cc) cc.textContent = '0';
  hideCpError();
  document.querySelectorAll('.cp-type-btn').forEach(function (b) { b.classList.remove('active'); });
  var first = document.querySelector('.cp-type-btn'); if (first) first.classList.add('active');
  document.querySelectorAll('.cp-hobby-tag').forEach(function (b) { b.classList.remove('selected'); });
  var fi = document.getElementById('cpFileInput'); if (fi) fi.value = '';
  hideMediaPreview();
}

/* ── Post Type Selector ── */

function selectType(type, btn) {
  cpCurrentType = type;
  document.querySelectorAll('.cp-type-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var zone = document.getElementById('cpUploadZone');
  if (zone) zone.style.display = (type === 'text') ? 'none' : 'block';
}

/* ── Hobby Tags ── */

function toggleHobby(btn, hobby) {
  btn.classList.toggle('selected');
  var idx = cpSelectedHobbies.indexOf(hobby);
  if (idx === -1) cpSelectedHobbies.push(hobby);
  else            cpSelectedHobbies.splice(idx, 1);
}

/* ── Character Counter ── */

function updateCharCount() {
  var ta  = document.getElementById('cpCaption');
  var cnt = document.getElementById('cpCharCount');
  if (!ta || !cnt) return;
  cnt.textContent = ta.value.length;
  cnt.style.color = ta.value.length > 450 ? '#f87171' : '#6b7280';
}

/* ── Media Upload ── */

function handleMediaUpload(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) return;

  var allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
  if (allowed.indexOf(file.type) === -1) {
    showCpError('Unsupported file type. Use JPG, PNG, GIF, MP4 or WEBM.');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showCpError('File too large. Maximum size is 50 MB.');
    return;
  }

  hideCpError();
  revokeCurrentMedia();
  cpMediaFile = file;
  cpMediaUrl  = URL.createObjectURL(file);

  var isVideo     = file.type.startsWith('video/');
  var previewDiv  = document.getElementById('cpPreview');
  var previewImg  = document.getElementById('cpPreviewImg');
  var previewVid  = document.getElementById('cpPreviewVid');
  var uploadInner = document.getElementById('cpUploadInner');

  if (previewDiv)  previewDiv.style.display  = 'block';
  if (uploadInner) uploadInner.style.display = 'none';

  if (isVideo) {
    if (previewImg) previewImg.style.display = 'none';
    if (previewVid) { previewVid.src = cpMediaUrl; previewVid.style.display = 'block'; }
    var vb = document.querySelector('.cp-type-btn[title="Video post"]');
    if (vb) selectType('video', vb);
  } else {
    if (previewVid) previewVid.style.display = 'none';
    if (previewImg) { previewImg.src = cpMediaUrl; previewImg.style.display = 'block'; }
    if (cpCurrentType === 'text') {
      var ib = document.querySelector('.cp-type-btn[title="Image post"]');
      if (ib) selectType('image', ib);
    }
  }
}

function removeMedia() {
  revokeCurrentMedia(); cpMediaFile = null; cpMediaUrl = '';
  var fi = document.getElementById('cpFileInput'); if (fi) fi.value = '';
  hideMediaPreview();
}

function hideMediaPreview() {
  var pd = document.getElementById('cpPreview');
  var pi = document.getElementById('cpPreviewImg');
  var pv = document.getElementById('cpPreviewVid');
  var ui = document.getElementById('cpUploadInner');
  if (pd) pd.style.display = 'none';
  if (pi) { pi.src = ''; pi.style.display = 'none'; }
  if (pv) { pv.src = ''; pv.style.display = 'none'; }
  if (ui) ui.style.display = 'block';
}

function revokeCurrentMedia() {
  if (cpMediaUrl) {
    try { URL.revokeObjectURL(cpMediaUrl); } catch (e) {}
    cpMediaUrl = '';
  }
}

/* ── Error Helpers ── */

function showCpError(msg) {
  var el = document.getElementById('cpError');
  if (el) { el.textContent = '⚠ ' + msg; el.style.display = 'block'; }
}
function hideCpError() {
  var el = document.getElementById('cpError');
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

/* ── Preview Post ── */

function previewPost() {
  var caption = (document.getElementById('cpCaption')  || {}).value || '';
  var hashStr = (document.getElementById('cpHashtags') || {}).value || '';
  if (!caption.trim() && !cpMediaUrl) { showCpError('Add a caption or media to preview.'); return; }
  hideCpError();

  var tags = hashStr.split(',').map(function (h) { return h.trim(); }).filter(Boolean);
  var el   = document.getElementById('cpPreviewContent');
  if (el) {
    el.innerHTML = buildPostHTML({
      id: 'preview-item', type: cpCurrentType, caption: caption,
      mediaUrl: cpMediaUrl,
      mediaIsVideo: !!(cpMediaFile && cpMediaFile.type.startsWith('video/')),
      hobbies: cpSelectedHobbies, hashtags: tags, isPreview: true
    });
  }
  var ov = document.getElementById('cpPreviewOverlay');
  if (ov) ov.classList.add('open');
}

function closePreview(event) {
  if (event && event.target !== event.currentTarget) return;
  var el = document.getElementById('cpPreviewOverlay');
  if (el) el.classList.remove('open');
}

/* ── Create Post  ── */

async function createPost(fromPreview) {
  var captionEl  = document.getElementById('cpCaption');
  var hashtagsEl = document.getElementById('cpHashtags');
  var caption    = captionEl  ? captionEl.value.trim()  : '';
  var hashStr    = hashtagsEl ? hashtagsEl.value.trim() : '';

  if (!caption && !cpMediaUrl) {
    showCpError('Please add a caption or upload media before posting.');
    return;
  }
  hideCpError();

  // Step 1 — Upload media to backend if there's a file
  var finalMediaUrl = cpMediaUrl;
  if (cpMediaFile) {
    var formData = new FormData();
    formData.append('file', cpMediaFile);
    try {
      showToast('Uploading media...');
      var uploadRes  = await fetch(API + '/upload', { method: 'POST', body: formData });
      var uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      
      // Ensure the path is exactly what the backend returned
      finalMediaUrl = uploadData.url; 
    } catch (err) {
      showCpError('Media upload failed: ' + err.message);
      return;
    }
  }

  // Step 2 — Build the post payload
  var tags = hashStr.split(',').map(function (h) { return h.trim(); }).filter(Boolean);
  var post = {
    user_id:      U.id,
    userName:     U.name     || ('u/' + U.username),
    userInitials: U.initials || (U.username ? U.username.substring(0, 2).toUpperCase() : '??'),
    type:         cpCurrentType,
    caption:      caption,
    mediaUrl:     finalMediaUrl || '',
    mediaIsVideo: !!(cpMediaFile && cpMediaFile.type.startsWith('video/')),
    hobbies:      cpSelectedHobbies.slice(),
    hashtags:     tags
  };

  console.log('--- DEBUG: Pre-Post Payload ---', JSON.stringify(post, null, 2));

  // Step 3 — Send to backend
  try {
    var postRes = await fetch(API + '/posts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(post)
    });

    if (!postRes.ok) {
      var err = await postRes.json();
      throw new Error(err.error || 'Post failed');
    }

    // Step 4 — Refresh the feed so the new post appears
    await loadPostsFromBackend();

    // Step 5 — Gamification
    if (window.RewardsSystem) {
      RewardsSystem.trackAction('CREATE_POST', { hobbies: cpSelectedHobbies });
    } else {
      U.posts = (U.posts || 0) + 1;
      addPoints(10);
      checkBadges();
      saveUserState();
      showToast('🎉 Post published! +10 points earned.');
    }

    // Step 6 — Close the create post modal
    closeCreatePost();
    var pov = document.getElementById('cpPreviewOverlay');
    if (pov) pov.classList.remove('open');
    document.body.style.overflow = '';

  } catch (err) {
    showCpError('Failed to publish: ' + err.message);
  }
}

/* ── Build Post HTML (for the feed) ── */

function buildPostHTML(p) {
  // Category tag styling
  var tagMap = {
    music:       '<span class="cat-tag music-tag">🎵 Music</span>',
    singing:     '<span class="cat-tag singing-tag">🎤 Singing</span>',
    dance:       '<span class="cat-tag dance-tag">💃 Dance</span>',
    painting:    '<span class="cat-tag painting-tag">🎨 Painting</span>',
    writing:     '<span class="cat-tag writing-tag">✍️ Writing</span>',
    photography: '<span class="cat-tag photography-tag">📷 Photography</span>'
  };

  var primary = p.hobbies && p.hobbies.length ? p.hobbies[0].toLowerCase() : null;
  var catTag  = (primary && tagMap[primary]) ? tagMap[primary]
    : '<span class="cat-tag" style="background:#3d3d4a;color:#d1d5db;border:none;">'
      + (p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : 'Post') + '</span>';

  var extraTags = (p.hobbies && p.hobbies.length > 1)
    ? '<span class="dot">&middot;</span>' + p.hobbies.slice(1).map(function (h) {
        return tagMap[h.toLowerCase()] || '';
      }).join('')
    : '';

  var mediaHTML = '';
  if (p.mediaUrl) {
    mediaHTML = p.mediaIsVideo
      ? '<div style="margin:10px 0;border-radius:10px;overflow:hidden;">'
        + '<video src="' + p.mediaUrl + '" controls style="width:100%;max-height:320px;background:#000;display:block;"></video>'
        + '</div>'
      : '<div style="margin:10px 0;border-radius:10px;overflow:hidden;">'
        + '<img src="' + p.mediaUrl + '" alt="Post media" style="width:100%;max-height:400px;object-fit:cover;display:block;">'
        + '</div>';
  }

  var hashHTML = (p.hashtags && p.hashtags.length)
    ? '<div style="margin-top:8px;font-size:12px;color:#F97316;">'
      + p.hashtags.map(function (h) { return '#' + h; }).join(' ')
      + '</div>'
    : '';

  var displayInitials = p.userInitials || '??';
  var displayName     = p.userName     || 'u/someone';
  var displayTime     = p.timestamp    ? mpFormatDate(p.timestamp) : 'Just now';

  var metaHTML = '<div class="post-meta">'
    + '<div class="avatar" style="background:linear-gradient(135deg,#F97316,#FB923C);width:28px;height:28px;font-size:10px;">'
    + displayInitials + '</div>'
    + '<span class="username">' + escapeHTML(displayName) + '</span>'
    + '<span class="dot">&middot;</span>' + catTag + extraTags
    + '<span class="dot">&middot;</span>'
    + '<span class="post-time">' + displayTime + '</span>'
    + '<span class="credits">★ +10 credits</span>'
    + '</div>';

  // Preview mode (used in the preview modal — no vote buttons or comment section)
  if (p.isPreview) {
    return '<div class="post-body" style="padding:0;">' + metaHTML
      + (p.caption ? '<p class="post-preview" style="-webkit-line-clamp:unset;">' + escapeHTML(p.caption) + '</p>' : '')
      + mediaHTML + hashHTML + '</div>';
  }

  // Full post card (shown in the main feed)
  var commentsHTML = (p.comments && p.comments.length)
    ? p.comments.map(function (c) {
        return '<div style="padding:4px 0;font-size:12px;color:#9ca3af;">'
          + '<strong>' + escapeHTML(c.user || 'Anon') + ':</strong> '
          + escapeHTML(c.text)
          + '</div>';
      }).join('')
    : '';

  return '<div class="post-vote">'
    + '<button class="vote-btn up" onclick="appreciatePost(\'' + p.id + '\',this)">▲</button>'
    + '<span class="vote-count" id="count-' + p.id + '">' + (p.likes || 0) + '</span>'
    + '<button class="vote-btn down" onclick="downPost(\'' + p.id + '\',this)">▼</button>'
    + '</div>'
    + '<div class="post-body">' + metaHTML
    + (p.caption ? '<h2 class="post-title">' + escapeHTML(p.caption) + '</h2>' : '')
    + mediaHTML + hashHTML
    + '<div class="post-actions">'
    + '<button class="action-btn" onclick="toggleComment(\'' + p.id + '\')">▶ '
    + (p.comments ? p.comments.length : 0) + ' Comments</button>'
    + '<button class="action-btn" onclick="sharePost(\'' + escapeHTML(p.caption || 'Post') + '\')">↗ Share</button>'
    + '<button class="action-btn save-btn" onclick="savePost(this)">☆ Save</button>'
    + '</div>'
    + '<div class="comment-box hidden" id="comment-' + p.id + '">'
    + '<div class="comments-list" style="margin-bottom:12px;max-height:200px;overflow-y:auto;">'
    + commentsHTML
    + '</div>'
    + '<textarea class="comment-input" placeholder="Write a comment..." rows="2" '
    + 'style="width:100%;background:#1e1e2d;border:1px solid #3d3d4a;border-radius:6px;color:#fff;padding:8px;margin-bottom:8px;"></textarea>'
    + '<button class="btn-comment-submit" onclick="submitComment(this)" '
    + 'style="background:#F97316;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Post Comment</button>'
    + '</div></div>';
}

/* ── Insert a post into the feed ── */

function insertPostIntoFeed(post, skipScroll) {
  var feed = document.getElementById('centerFeed');
  if (!feed) return;

  // Skip if this post already exists in the DOM
  if (document.getElementById(post.id)) return;

  var article = document.createElement('article');
  article.className = 'post-card' + (skipScroll ? '' : ' new-post-highlight');
  article.id        = String(post.id); // make sure it's a string for getElementById
  article.setAttribute('data-category', (post.hobbies && post.hobbies.length) ? post.hobbies[0].toLowerCase() : post.type);
  article.innerHTML = buildPostHTML(post);

  // Insert right after the feed header
  var header = feed.querySelector('.feed-header');
  if (header && header.nextSibling) {
    feed.insertBefore(article, header.nextSibling);
  } else {
    var w = feed.querySelector('.load-more-wrap');
    if (w) feed.insertBefore(article, w);
    else   feed.appendChild(article);
  }

  if (!skipScroll) {
    article.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { article.classList.remove('new-post-highlight'); }, 3000);
  }
}

/* ── Load all posts from backend ── */

async function loadPostsFromBackend() {
  try {
    var response = await fetch(API + '/posts');
    if (!response.ok) throw new Error('Server error');
    var posts = await response.json();

    if (Array.isArray(posts)) {
      postsArray = posts;

      // Remove any dynamically inserted posts before re-inserting
      document.querySelectorAll('.post-card').forEach(function (el) {
        // Only remove posts with numeric IDs (database posts) — keep the HTML sample posts
        if (!isNaN(el.id)) el.remove();
      });

      // Show newest posts first (backend returns newest-first already)
      posts.forEach(function (p) { insertPostIntoFeed(p, true); });

      // Update the My Posts badge count
      updateMyPostsBadge();
    }
  } catch (err) {
    console.warn('Could not load posts from backend:', err);
  }
}

/* ============================================================
   MY POSTS PANEL
   ============================================================ */

var _mpCurrentFilter = 'all';

function openMyPostsPanel() {
  // Close profile popup if open
  var popup = document.getElementById('profilePopup');
  if (popup) popup.classList.remove('open');

  _mpCurrentFilter = 'all';
  document.querySelectorAll('.mp-filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var allBtn = document.getElementById('mpFilterAll');
  if (allBtn) allBtn.classList.add('active');

  _mpRefreshProfileBar();
  renderMyPosts();

  var ov = document.getElementById('mpOverlay');
  if (ov) {
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMyPostsPanel() {
  var ov = document.getElementById('mpOverlay');
  if (ov) ov.classList.remove('open');
  document.body.style.overflow = '';
}

function mpOverlayClose(event) {
  if (event.target === event.currentTarget) closeMyPostsPanel();
}

function _mpRefreshProfileBar() {
  // Filter posts belonging to the current user
  var myPosts    = postsArray.filter(function (p) { return String(p.user_id) === String(U.id); });
  var totalLikes = myPosts.reduce(function (acc, p) { return acc + (p.likes || 0); }, 0);

  var g = function (id) { return document.getElementById(id); };
  if (g('mpAvatar'))        g('mpAvatar').textContent        = U.initials || '??';
  if (g('mpProfileName'))   g('mpProfileName').textContent   = (U.name || U.username || 'you').replace('u/', '').replace(/_/g, ' ');
  if (g('mpProfileHandle')) g('mpProfileHandle').textContent = U.name || ('u/' + U.username);
  if (g('mpStatPosts'))     g('mpStatPosts').textContent     = myPosts.length;
  if (g('mpStatLikes'))     g('mpStatLikes').textContent     = totalLikes;
  if (g('mpStatPoints'))    g('mpStatPoints').textContent    = U.points || 0;
}

function renderMyPosts() {
  var grid  = document.getElementById('myPostsGrid');
  var empty = document.getElementById('mpEmpty');
  if (!grid) return;

  var myPosts  = postsArray.filter(function (p) { return String(p.user_id) === String(U.id); });
  var filtered = (_mpCurrentFilter === 'all')
    ? myPosts
    : myPosts.filter(function (p) { return p.type === _mpCurrentFilter; });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.style.display  = 'none';
    if (empty) {
      empty.style.display = 'flex';
      var desc = empty.querySelector('.mp-empty-desc');
      if (desc) desc.textContent = (_mpCurrentFilter === 'all')
        ? 'Start sharing your passion with the world!'
        : 'No ' + _mpCurrentFilter + ' posts yet.';
    }
  } else {
    grid.style.display  = 'grid';
    if (empty) empty.style.display = 'none';
    filtered.forEach(function (post) {
      var card = document.createElement('div');
      card.innerHTML = buildMyPostCard(post);
      grid.appendChild(card.firstElementChild);
    });
  }

  _mpRefreshProfileBar();
  updateMyPostsBadge();
}

function buildMyPostCard(post) {
  var typeIcons = { text: '✒️', image: '🖼️', video: '🎬', reel: '🎦' };
  var mediaHTML = '';

  if (post.mediaUrl && post.mediaUrl.length > 0) {
    if (post.mediaIsVideo) {
      mediaHTML = '<div class="mp-card-media">'
        + '<span class="mp-video-badge">▶ Video</span>'
        + '<video src="' + post.mediaUrl + '" muted preload="metadata" style="pointer-events:none;"></video>'
        + '</div>';
    } else {
      mediaHTML = '<div class="mp-card-media">'
        + '<img src="' + post.mediaUrl + '" alt="Post media" loading="lazy">'
        + '</div>';
    }
  } else {
    var icon  = typeIcons[post.type] || '📝';
    var label = post.type ? (post.type.charAt(0).toUpperCase() + post.type.slice(1)) : 'Post';
    mediaHTML = '<div class="mp-card-media-placeholder">'
      + '<span class="mp-type-icon">' + icon + '</span>'
      + '<span class="mp-type-label">' + label + '</span>'
      + '</div>';
  }

  var captionText = post.caption ? escapeHTML(post.caption) : 'No caption';
  var tagsHTML    = '';
  if (post.hobbies && post.hobbies.length) {
    tagsHTML = '<div class="mp-card-tags">'
      + post.hobbies.slice(0, 2).map(function (h) {
          return '<span class="mp-card-tag">' + h + '</span>';
        }).join('')
      + (post.hobbies.length > 2 ? '<span class="mp-card-tag">+' + (post.hobbies.length - 2) + '</span>' : '')
      + '</div>';
  }

  var dateStr  = mpFormatDate(post.timestamp);
  var likes    = post.likes    || 0;
  var comments = (post.comments && post.comments.length) ? post.comments.length : 0;

  return '<div class="mp-card" data-post-id="' + post.id + '">'
    + mediaHTML
    + '<div class="mp-card-body">'
    +   '<div class="mp-card-caption">' + captionText + '</div>'
    +   tagsHTML
    +   '<div class="mp-card-date">🕐 ' + dateStr + '</div>'
    + '</div>'
    + '<div class="mp-card-actions">'
    +   '<button class="mp-action-btn">❤ ' + likes + '</button>'
    +   '<button class="mp-action-btn">💬 ' + comments + '</button>'
    +   '<span class="mp-action-spacer"></span>'
    +   '<button class="mp-card-delete-btn" onclick="deleteMyPost(\'' + post.id + '\')">🗑</button>'
    + '</div>'
    + '</div>';
}

async function deleteMyPost(postId) {
  if (!confirm('Delete this post? This cannot be undone.')) return;

  try {
    var res = await fetch(API + '/posts/' + postId, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');

    // Remove from local array
    postsArray = postsArray.filter(function (p) { return String(p.id) !== String(postId); });

    // Remove from the main feed immediately
    var feedCard = document.getElementById(String(postId));
    if (feedCard) feedCard.remove();

    renderMyPosts();
    showToast('Post deleted.');
  } catch (err) {
    showToast('Error deleting post. Try again.');
  }
}

function filterMyPosts(type, btn) {
  _mpCurrentFilter = type;
  document.querySelectorAll('.mp-filter-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderMyPosts();
}

function updateMyPostsBadge() {
  var badge = document.getElementById('myPostsCountBadge');
  if (!badge) return;
  var count = postsArray.filter(function (p) { return String(p.user_id) === String(U.id); }).length;
  if (count > 0) {
    badge.textContent    = count;
    badge.style.display  = 'inline-block';
  } else {
    badge.style.display  = 'none';
  }
}

function mpFormatDate(isoStr) {
  if (!isoStr) return 'Just now';
  var d    = new Date(isoStr);
  var now  = new Date();
  var diff = Math.floor((now - d) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Close on Escape ── */

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var pov = document.getElementById('cpPreviewOverlay');
  if (pov && pov.classList.contains('open')) pov.classList.remove('open');
  else closeCreatePost();
});

/* ── Load posts when the page finishes loading ── */

document.addEventListener('DOMContentLoaded', function () {
  loadPostsFromBackend();
});
