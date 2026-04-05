import { supabase } from './supabaseClient.js';

let isLoginMode = true;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRandomGradient() {
  const gradients = [
    'linear-gradient(135deg, #F97316, #FB923C)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    'linear-gradient(135deg, #F59E0B, #FCD34D)',
    'linear-gradient(135deg, #EF4444, #F87171)'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

async function handleAuth(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const nameInput = document.getElementById('name');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!email || !password) {
    showToast('Please fill in all required fields');
    return;
  }

  if (!isLoginMode && !name) {
    showToast('Please enter your name');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = isLoginMode ? 'Signing in...' : 'Creating account...';

  try {
    if (isLoginMode) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      showToast('Login successful!');
      setTimeout(() => {
        window.location.href = '/Frontend/html/index.html';
      }, 500);
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('Signup failed');
      }

      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const initials = getInitials(name);
      const gradient = getRandomGradient();

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          username: username,
          display_name: name,
          avatar_initials: initials,
          avatar_gradient: gradient,
          credits: 100,
          streak_days: 0
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create profile');
      }

      showToast('Account created! Redirecting to hobby selection...');
      setTimeout(() => {
        window.location.href = '/Frontend/html/hobby_selection.html';
      }, 800);
    }
  } catch (error) {
    console.error('Auth error:', error);
    showToast(error.message || 'Authentication failed. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function toggleMode() {
  isLoginMode = !isLoginMode;

  const title = document.getElementById('formTitle');
  const subtitle = document.getElementById('formSubtitle');
  const nameField = document.getElementById('nameField');
  const submitBtn = document.getElementById('submitBtn');
  const toggleText = document.getElementById('toggleText');
  const toggleLink = document.getElementById('toggleLink');

  if (isLoginMode) {
    title.textContent = 'Welcome Back';
    subtitle.textContent = 'Sign in to continue your creative journey';
    if (nameField) nameField.style.display = 'none';
    submitBtn.textContent = 'Sign In';
    toggleText.textContent = "Don't have an account? ";
    toggleLink.textContent = 'Sign up';
  } else {
    title.textContent = 'Create Account';
    subtitle.textContent = 'Join the community of creators';
    if (nameField) nameField.style.display = 'block';
    submitBtn.textContent = 'Sign Up';
    toggleText.textContent = 'Already have an account? ';
    toggleLink.textContent = 'Sign in';
  }
}

async function checkExistingSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = '/Frontend/html/index.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();

  const form = document.getElementById('authForm');
  if (form) {
    form.addEventListener('submit', handleAuth);
  }

  const toggleLink = document.getElementById('toggleLink');
  if (toggleLink) {
    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMode();
    });
  }
});

window.handleAuth = handleAuth;
window.toggleMode = toggleMode;
