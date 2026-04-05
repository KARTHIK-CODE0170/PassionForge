import { supabase, requireAuth } from './supabaseClient.js';

var selected = [];
let allHobbies = [];
let userId = null;

async function init() {
  const user = await requireAuth();
  if (!user) return;
  userId = user.id;

  await loadHobbies();
}

async function loadHobbies() {
  try {
    const { data, error } = await supabase
      .from('hobbies')
      .select('*')
      .order('name');

    if (error) throw error;
    allHobbies = data;
  } catch (error) {
    console.error('Error loading hobbies:', error);
  }
}

function toggleHobby(card) {
  var hobby = card.getAttribute('data-hobby');
  var idx = selected.indexOf(hobby);

  if (idx > -1) {
    selected.splice(idx, 1);
    card.classList.remove('selected');
  } else {
    selected.push(hobby);
    card.classList.add('selected');
  }

  updateUI();
}

function updateUI() {
  var info = document.getElementById('selectedInfo');
  var btn = document.getElementById('continueBtn');

  if (selected.length === 0) {
    info.innerHTML = 'Select at least <span>1 hobby</span> to continue';
    btn.disabled = true;
  } else {
    info.innerHTML = 'You have selected <span>' + selected.length + ' ' + (selected.length === 1 ? 'hobby' : 'hobbies') + '</span>';
    btn.disabled = false;
  }
}

async function handleContinue() {
  if (selected.length === 0) return;

  const btn = document.getElementById('continueBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const hobbyRecords = selected.map(hobbyName => {
      const hobby = allHobbies.find(h => h.name === hobbyName);
      return {
        user_id: userId,
        hobby_id: hobby.id
      };
    });

    const { error } = await supabase
      .from('user_hobbies')
      .insert(hobbyRecords);

    if (error) throw error;

    var tagsList = document.getElementById('hobbyTagsList');
    tagsList.innerHTML = '';
    selected.forEach(function(h) {
      var tag = document.createElement('span');
      tag.className = 'hobby-tag';
      tag.textContent = h;
      tagsList.appendChild(tag);
    });

    document.getElementById('successOverlay').classList.add('show');
  } catch (error) {
    console.error('Error saving hobbies:', error);
    alert('Failed to save hobbies. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Continue →';
  }
}

function goToDashboard() {
  window.location.href = '/Frontend/html/index.html';
}

init();

window.toggleHobby = toggleHobby;
window.handleContinue = handleContinue;
window.goToDashboard = goToDashboard;