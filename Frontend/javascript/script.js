var votedPosts = {}, challengeDone = false, extraLoaded = false, toastTimer = null;

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('searchInput');
  var clearBtn = document.getElementById('searchClear');
  if (input && clearBtn) {
    input.addEventListener('input', function() {
      clearBtn.classList.toggle('visible', input.value.length > 0);
    });
    clearBtn.addEventListener('click', function() {
      input.value = '';
      clearBtn.classList.remove('visible');
      input.focus();
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && input.value.trim()) showToast('Searching for "' + input.value.trim() + '"...');
    });
  }
});

function toggleSection(id, header) {
  var menu = document.getElementById(id);
  var chevron = header.querySelector('.chevron');
  menu.classList.toggle('collapsed');
  chevron.classList.toggle('rotated');
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  showToast('Sorted by ' + name.charAt(0).toUpperCase() + name.slice(1));
}

function filterFeed(category, clicked) {
  document.querySelectorAll('.s-item[id^="filter-"]').forEach(function(i) { i.classList.remove('active'); });
  clicked.classList.add('active');
  document.querySelectorAll('.post-card').forEach(function(post) {
    post.classList.toggle('hidden', category !== 'all' && post.getAttribute('data-category') !== category);
  });
  showToast('Filtered by ' + category);
}

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

function joinCommunity(item, name) {
  var tag = item.querySelector('.join-tag');
  tag.classList.toggle('joined');
  tag.textContent = tag.classList.contains('joined') ? 'Joined \u2713' : 'Join';
  showToast(tag.classList.contains('joined') ? 'Welcome to ' + name + '!' : 'Left ' + name + '.');
}

function followCreator(btn) {
  btn.classList.toggle('following');
  btn.textContent = btn.classList.contains('following') ? 'Following \u2713' : 'Follow';
  showToast(btn.classList.contains('following') ? 'Now following.' : 'Unfollowed.');
}

function completeChallenge() {
  if (challengeDone) return;
  challengeDone = true;
  var btn = document.querySelector('.btn-challenge');
  btn.textContent = '\u2713 Completed!'; btn.classList.add('done');
  document.getElementById('streakFill').style.width = '100%';
  document.querySelector('.streak-label').textContent = '\u2605 7-day streak \u2014 amazing!';
  showToast('+50 credits earned! Streak extended.');
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

function handleLogin()  { window.location.href = 'landing.html'; }
function handleSignup() { window.location.href = 'landing.html'; }

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2800);
}
