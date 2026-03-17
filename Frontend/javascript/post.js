/* ============================================================
   POST.JS  –  Post feed interactions & Create Post module
   ============================================================ */

/* ── Feed / Post interactions ─────────────────────────────── */

function appreciatePost(id, btn) {
  var el = document.getElementById('count-' + id);
  var val = parseInt(el.textContent);
  if (votedPosts[id] === 'up') { el.textContent = val - 1; btn.classList.remove('voted'); votedPosts[id] = null; }
  else {
    if (votedPosts[id] === 'down') { val++; clearVote(id, 'down'); }
    el.textContent = val + 1; btn.classList.add('voted'); votedPosts[id] = 'up';
    showToast('You appreciated this post.');
  }
}

function downPost(id, btn) {
  var el = document.getElementById('count-' + id);
  var val = parseInt(el.textContent);
  if (votedPosts[id] === 'down') { el.textContent = val + 1; btn.classList.remove('voted'); votedPosts[id] = null; }
  else {
    if (votedPosts[id] === 'up') { val--; clearVote(id, 'up'); }
    el.textContent = val - 1; btn.classList.add('voted'); votedPosts[id] = 'down';
  }
}

function clearVote(id, type) {
  var b = document.querySelector('#' + id + ' .vote-btn.' + type);
  if (b) b.classList.remove('voted');
}

function toggleComment(id) {
  var box = document.getElementById('comment-' + id);
  if (box.classList.toggle('hidden')) return;
  box.querySelector('.comment-input').focus();
}

function submitComment(btn) {
  var input = btn.closest('.comment-box').querySelector('.comment-input');
  if (!input.value.trim()) { input.style.borderColor = '#F97316'; input.focus(); return; }
  showToast('Comment posted.'); input.value = ''; input.style.borderColor = '';
  btn.closest('.comment-box').classList.add('hidden');
}

function savePost(btn) {
  btn.classList.toggle('saved');
  btn.classList.toggle('active');
  if (btn.classList.contains('saved')) { btn.innerHTML = '&#9733; Saved'; showToast('Post saved.'); }
  else { btn.innerHTML = '&#9734; Save'; showToast('Removed from saved.'); }
}

function sharePost(title) {
  if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).catch(function(){});
  showToast('Link copied for "' + title + '".');
}

function loadMore() {
  if (extraLoaded) { showToast('No more posts.'); return; }
  extraLoaded = true;
  var feed = document.getElementById('centerFeed');
  var wrap = feed.querySelector('.load-more-wrap');
  var posts = [
    { id:'post-6', cat:'music', ini:'SP', bg:'linear-gradient(135deg,#F59E0B,#FCD34D)', user:'u/sitar_pro', tag:'music-tag', label:'&#9834; Music', time:'8 hours ago', cr:'275 credits', title:'Raga Yaman practice session #45 \u2014 breakthroughs and struggles', preview:'Eight months into learning Sitar and I just managed to hold a steady alaap in Raga Yaman for 12 minutes. My guru says my meend is finally starting to sound natural...', comments:39 },
    { id:'post-7', cat:'photography', ini:'NJ', bg:'linear-gradient(135deg,#EF4444,#F87171)', user:'u/nisha_journeys', tag:'photography-tag', label:'&#9685; Photography', time:'1 day ago', cr:'310 credits', title:'Street photography ethics \u2014 a guide for beginners', preview:'Before you point your lens at a stranger, there\'s a whole conversation about ethics, consent, and cultural sensitivity. Street photography is one of the most powerful art forms...', comments:71 }
  ];
  posts.forEach(function(d) {
    var a = document.createElement('article');
    a.className = 'post-card'; a.id = d.id; a.setAttribute('data-category', d.cat);
    var activeFilter = document.querySelector('.s-item.active[id^="filter-"]');
    var currentCategory = activeFilter ? activeFilter.id.replace('filter-', '') : 'all';
    if (currentCategory !== 'all' && d.cat !== currentCategory) {
      a.classList.add('hidden');
    }
    a.innerHTML = '<div class="post-vote"><button class="vote-btn up" onclick="appreciatePost(\''+d.id+'\',this)">&#9650;</button><span class="vote-count" id="count-'+d.id+'">'+(Math.floor(Math.random()*200)+50)+'</span><button class="vote-btn down" onclick="downPost(\''+d.id+'\',this)">&#9660;</button></div><div class="post-body"><div class="post-meta"><div class="avatar" style="background:'+d.bg+'">'+d.ini+'</div><span class="username">'+d.user+'</span><span class="dot">&middot;</span><span class="cat-tag '+d.tag+'">'+d.label+'</span><span class="dot">&middot;</span><span class="post-time">'+d.time+'</span><span class="credits">&#9733; '+d.cr+'</span></div><h2 class="post-title">'+d.title+'</h2><p class="post-preview">'+d.preview+'</p><div class="post-actions"><button class="action-btn" onclick="toggleComment(\''+d.id+'\')">&#9656; '+d.comments+' Comments</button><button class="action-btn" onclick="sharePost(\''+d.title+'\')">&#8599; Share</button><button class="action-btn save-btn" onclick="savePost(this)">&#9734; Save</button></div><div class="comment-box hidden" id="comment-'+d.id+'"><textarea class="comment-input" placeholder="Write a comment..." rows="2"></textarea><button class="btn-comment-submit" onclick="submitComment(this)">Post Comment</button></div></div>';
    feed.insertBefore(a, wrap);
  });
  showToast('2 new posts loaded.'); wrap.querySelector('.btn-load-more').textContent = 'No more posts';
}

/* ============================================================
   CREATE POST MODULE
   ============================================================ */

// ── User State ─────────────────────────────────────────────────
var U = (function() {
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('pf_user')); } catch(e) {}
  return saved || { id: 'user_sr', name: 'u/you', initials: 'SR', posts: 0, points: 0, badges: [] };
}());

// ── Post Store ─────────────────────────────────────────────────
var postsArray = (function() {
  try { return JSON.parse(localStorage.getItem('pf_posts')) || []; } catch(e) { return []; }
}());

// ── Internal State ─────────────────────────────────────────────
var cpCurrentType     = 'text';
var cpSelectedHobbies = [];
var cpMediaFile       = null;
var cpMediaUrl        = '';

// ── Helpers ────────────────────────────────────────────────────
function generateId() {
  return 'post-user-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
}

function addPoints(pts)  { U.points = (U.points || 0) + pts; }
function updateUI()      { /* extend for future profile panels */ }

function checkBadges() {
  var milestones = [[1,'🎉 First Post!'],[5,'🔥 5 Posts!'],[10,'⭐ 10 Posts Legend!'],[50,'💎 50 Points Club!']];
  milestones.forEach(function(m) {
    var reached = (m[0] <= 10) ? (U.posts === m[0]) : (U.points >= m[0]);
    if (reached && U.badges.indexOf(m[1]) === -1) {
      U.badges.push(m[1]);
      setTimeout(function() { showToast('Badge unlocked: ' + m[1]); }, 1500);
    }
  });
}

function saveState() {
  try {
    localStorage.setItem('pf_user',  JSON.stringify(U));
    var saveable = postsArray.map(function(p) { return Object.assign({}, p, { mediaUrl: '' }); });
    localStorage.setItem('pf_posts', JSON.stringify(saveable));
  } catch(e) {}
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Open / Close ───────────────────────────────────────────────
function openCreatePost() {
  resetCreateForm();
  var overlay = document.getElementById('cpOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(function() { var ta = document.getElementById('cpCaption'); if (ta) ta.focus(); }, 280);
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

// ── Reset ──────────────────────────────────────────────────────
function resetCreateForm() {
  cpCurrentType = 'text'; cpSelectedHobbies = []; cpMediaFile = null; cpMediaUrl = '';
  ['cpCaption','cpHashtags'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var cc = document.getElementById('cpCharCount'); if (cc) cc.textContent = '0';
  var er = document.getElementById('cpError');    if (er) { er.style.display = 'none'; er.textContent = ''; }
  document.querySelectorAll('.cp-type-btn').forEach(function(b) { b.classList.remove('active'); });
  var first = document.querySelector('.cp-type-btn'); if (first) first.classList.add('active');
  document.querySelectorAll('.cp-hobby-tag').forEach(function(b) { b.classList.remove('selected'); });
  var fi = document.getElementById('cpFileInput'); if (fi) fi.value = '';
  hideMediaPreview();
}

// ── Post Type ──────────────────────────────────────────────────
function selectType(type, btn) {
  cpCurrentType = type;
  document.querySelectorAll('.cp-type-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var zone = document.getElementById('cpUploadZone');
  if (zone) zone.style.display = (type === 'text') ? 'none' : 'block';
}

// ── Hobby Tags ─────────────────────────────────────────────────
function toggleHobby(btn, hobby) {
  btn.classList.toggle('selected');
  var idx = cpSelectedHobbies.indexOf(hobby);
  if (idx === -1) cpSelectedHobbies.push(hobby); else cpSelectedHobbies.splice(idx, 1);
}

// ── Char Count ─────────────────────────────────────────────────
function updateCharCount() {
  var ta = document.getElementById('cpCaption'); var cnt = document.getElementById('cpCharCount');
  if (!ta || !cnt) return;
  cnt.textContent = ta.value.length;
  cnt.style.color = ta.value.length > 450 ? '#f87171' : '#6b7280';
}

// ── Media Upload ─────────────────────────────────────────────────
function handleMediaUpload(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) return;
  var allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/ogg'];
  if (allowed.indexOf(file.type) === -1) { showCpError('Unsupported file type. Use JPG, PNG, GIF, MP4 or WEBM.'); return; }
  if (file.size > 50 * 1024 * 1024)      { showCpError('File too large. Maximum size is 50 MB.');                return; }
  hideCpError(); revokeCurrentMedia();
  cpMediaFile = file; cpMediaUrl = URL.createObjectURL(file);
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
    if (cpCurrentType === 'text' || cpCurrentType === 'image') {
      var vb = document.querySelector('.cp-type-btn[title="Video post"]'); if (vb) selectType('video', vb);
    }
  } else {
    if (previewVid) previewVid.style.display = 'none';
    if (previewImg) { previewImg.src = cpMediaUrl; previewImg.style.display = 'block'; }
    if (cpCurrentType === 'text') {
      var ib = document.querySelector('.cp-type-btn[title="Image post"]'); if (ib) selectType('image', ib);
    }
  }
}

function removeMedia() {
  revokeCurrentMedia(); cpMediaFile = null; cpMediaUrl = '';
  var fi = document.getElementById('cpFileInput'); if (fi) fi.value = '';
  hideMediaPreview();
}

function hideMediaPreview() {
  var pd = document.getElementById('cpPreview'); var pi = document.getElementById('cpPreviewImg');
  var pv = document.getElementById('cpPreviewVid'); var ui = document.getElementById('cpUploadInner');
  if (pd) pd.style.display = 'none';
  if (pi) { pi.src = ''; pi.style.display = 'none'; }
  if (pv) { pv.src = ''; pv.style.display = 'none'; }
  if (ui) ui.style.display = 'block';
}

function revokeCurrentMedia() {
  if (cpMediaUrl) { try { URL.revokeObjectURL(cpMediaUrl); } catch(e) {} cpMediaUrl = ''; }
}

// ── Error Helpers ──────────────────────────────────────────────
function showCpError(msg) { var el = document.getElementById('cpError'); if (el) { el.textContent = '⚠ ' + msg; el.style.display = 'block'; } }
function hideCpError()    { var el = document.getElementById('cpError'); if (el) { el.style.display = 'none'; el.textContent = ''; } }

// ── Preview ─────────────────────────────────────────────────────
function previewPost() {
  var caption = (document.getElementById('cpCaption')  || {}).value || '';
  var hashStr = (document.getElementById('cpHashtags') || {}).value || '';
  if (!caption.trim() && !cpMediaUrl) { showCpError('Add a caption or media to preview.'); return; }
  hideCpError();
  var tags = hashStr.split(',').map(function(h){ return h.trim(); }).filter(Boolean);
  var el = document.getElementById('cpPreviewContent');
  if (el) el.innerHTML = buildPostHTML({ id:'preview-item', type:cpCurrentType, caption:caption, mediaUrl:cpMediaUrl,
    mediaIsVideo:!!(cpMediaFile && cpMediaFile.type.startsWith('video/')),
    hobbies:cpSelectedHobbies, hashtags:tags, isPreview:true });
  var ov = document.getElementById('cpPreviewOverlay'); if (ov) ov.classList.add('open');
}

function closePreview(event) {
  if (event && event.target !== event.currentTarget) return;
  var el = document.getElementById('cpPreviewOverlay'); if (el) el.classList.remove('open');
}

// ── Create Post ─────────────────────────────────────────────────
function createPost(fromPreview) {
  var captionEl  = document.getElementById('cpCaption');
  var hashtagsEl = document.getElementById('cpHashtags');
  var caption    = captionEl  ? captionEl.value.trim()  : '';
  var hashStr    = hashtagsEl ? hashtagsEl.value.trim() : '';
  if (!caption && !cpMediaUrl) { showCpError('Please add a caption or upload media before posting.'); return; }
  hideCpError();
  var tags   = hashStr.split(',').map(function(h){ return h.trim(); }).filter(Boolean);
  var postId = generateId();
  var post   = {
    id: postId, userId: U.id, userName: U.name, userInitials: U.initials,
    type: cpCurrentType, caption: caption,
    mediaUrl: cpMediaUrl || '', mediaIsVideo: !!(cpMediaFile && cpMediaFile.type.startsWith('video/')),
    hobbies: cpSelectedHobbies.slice(), hashtags: tags,
    likes: 0, comments: [], shares: 0, timestamp: new Date().toISOString()
  };
  postsArray.unshift(post);
  insertPostIntoFeed(post);
  // Gamification
  U.posts += 1; addPoints(10); checkBadges(); updateUI(); saveState();
  // Close & notify
  closeCreatePost();
  var pov = document.getElementById('cpPreviewOverlay'); if (pov) pov.classList.remove('open');
  document.body.style.overflow = '';
  showToast('🎉 Post published! +10 points earned.');
}

// ── Build Post HTML ─────────────────────────────────────────────
function buildPostHTML(p) {
  var tagMap = {
    music:'<span class="cat-tag music-tag">&#9834; Music</span>',
    singing:'<span class="cat-tag singing-tag">&#127908; Singing</span>',
    dance:'<span class="cat-tag dance-tag">&#9836; Dance</span>',
    painting:'<span class="cat-tag painting-tag">&#10000; Painting</span>',
    writing:'<span class="cat-tag writing-tag">&#9998; Writing</span>',
    photography:'<span class="cat-tag photography-tag">&#9685; Photography</span>'
  };
  var primary  = p.hobbies && p.hobbies.length ? p.hobbies[0] : null;
  var catTag   = (primary && tagMap[primary]) ? tagMap[primary]
    : '<span class="cat-tag" style="background:#3d3d4a;color:#d1d5db;border:none;">' + p.type.charAt(0).toUpperCase() + p.type.slice(1) + '</span>';
  var extraTags = p.hobbies && p.hobbies.length > 1
    ? '<span class="dot">&middot;</span>' + p.hobbies.slice(1).map(function(h){ return tagMap[h]||''; }).join('') : '';
  var mediaHTML = '';
  if (p.mediaUrl) {
    mediaHTML = p.mediaIsVideo
      ? '<div style="margin:10px 0;border-radius:10px;overflow:hidden;"><video src="'+p.mediaUrl+'" controls style="width:100%;max-height:320px;background:#000;display:block;"></video></div>'
      : '<div style="margin:10px 0;border-radius:10px;overflow:hidden;"><img src="'+p.mediaUrl+'" alt="Post media" style="width:100%;max-height:400px;object-fit:cover;display:block;"></div>';
  }
  var hashHTML = p.hashtags && p.hashtags.length
    ? '<div style="margin-top:8px;font-size:12px;color:#F97316;">'+p.hashtags.map(function(h){ return '#'+h; }).join(' ')+'</div>' : '';
  var metaHTML = '<div class="post-meta">'
    +'<div class="avatar" style="background:linear-gradient(135deg,#F97316,#FB923C);width:28px;height:28px;font-size:10px;">'+(p.userInitials||'SR')+'</div>'
    +'<span class="username">'+(p.userName||'u/you')+'</span>'
    +'<span class="dot">&middot;</span>'+catTag+extraTags
    +'<span class="dot">&middot;</span><span class="post-time">Just now</span>'
    +'<span class="credits">&#9733; +10 credits</span></div>';
  if (p.isPreview) {
    return '<div class="post-body" style="padding:0;">'+metaHTML
      +(p.caption ? '<p class="post-preview" style="-webkit-line-clamp:unset;">'+escapeHTML(p.caption)+'</p>' : '')
      +mediaHTML+hashHTML+'</div>';
  }
  return '<div class="post-vote">'
    +'<button class="vote-btn up" onclick="appreciatePost(\''+p.id+'\',this)">&#9650;</button>'
    +'<span class="vote-count" id="count-'+p.id+'">1</span>'
    +'<button class="vote-btn down" onclick="downPost(\''+p.id+'\',this)">&#9660;</button></div>'
    +'<div class="post-body">'+metaHTML
    +(p.caption ? '<h2 class="post-title">'+escapeHTML(p.caption)+'</h2>' : '')
    +mediaHTML+hashHTML
    +'<div class="post-actions">'
    +'<button class="action-btn" onclick="toggleComment(\''+p.id+'\')">&#9656; 0 Comments</button>'
    +'<button class="action-btn" onclick="sharePost(\''+escapeHTML(p.caption||'Post')+'\')">&#8599; Share</button>'
    +'<button class="action-btn save-btn" onclick="savePost(this)">&#9734; Save</button>'
    +'</div>'
    +'<div class="comment-box hidden" id="comment-'+p.id+'">'
    +'<textarea class="comment-input" placeholder="Write a comment..." rows="2"></textarea>'
    +'<button class="btn-comment-submit" onclick="submitComment(this)">Post Comment</button>'
    +'</div></div>';
}

// ── Insert Into Feed ────────────────────────────────────────────
function insertPostIntoFeed(post) {
  var feed = document.getElementById('centerFeed'); if (!feed) return;
  var article = document.createElement('article');
  article.className = 'post-card new-post-highlight';
  article.id = post.id;
  article.setAttribute('data-category', (post.hobbies && post.hobbies.length) ? post.hobbies[0] : post.type);
  article.innerHTML = buildPostHTML(post);
  var header = feed.querySelector('.feed-header');
  if (header && header.nextSibling) feed.insertBefore(article, header.nextSibling);
  else { var w = feed.querySelector('.load-more-wrap'); if (w) feed.insertBefore(article, w); else feed.appendChild(article); }
  article.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(function() { article.classList.remove('new-post-highlight'); }, 3000);
}

// ── Escape to Close ─────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  var pov = document.getElementById('cpPreviewOverlay');
  if (pov && pov.classList.contains('open')) pov.classList.remove('open');
  else closeCreatePost();
});
