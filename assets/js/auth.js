/**
 * Open Source Local Authentication (Mock)
 *
 * This uses the browser's LocalStorage to simulate a fully functional
 * authentication system without requiring a proprietary backend (like Firebase).
 */

const DB_KEY = 'mindfull_users';
const SESSION_KEY = 'mindfull_session';

// --- Modal Management ---
window.openModal = modalId => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = '';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = modalId => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.switchModal = (closeId, openId) => {
  window.closeModal(closeId);
  window.openModal(openId);
};

// --- Helper Functions ---
window.hashPassword = async function (password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

async function hashPassword(password) {
  return await window.hashPassword(password);
}

function getUsers() {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveUser(user) {
  const users = getUsers();
  if (!user.plan) user.plan = 'Free';
  users.push(user);
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function findUser(email) {
  const users = getUsers();
  return users.find(u => u.email === email);
}

function setSession(user) {
  const sessionData = {
    email: user.email,
    name: user.name,
    id: user.id || Date.now(),
    plan: user.plan || 'Free',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

window.safeRedirect = function (path) {
  const whitelist = [
    '/',
    '/dashboard',
    '/journal',
    '/settings',
    '/courses',
    '/login',
    '/signup',
    '/therapists',
    '/posts',
    '/pricing',
  ];
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    window.location.assign('/');
    return;
  }
  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) {
      window.location.assign('/');
      return;
    }
    const basePath = url.pathname;
    const isSafe = whitelist.some(
      w => basePath === w || (w !== '/' && basePath.startsWith(w + '/')),
    );
    if (isSafe) {
      window.location.assign(url.pathname + url.search + url.hash);
    } else {
      window.location.assign('/');
    }
  } catch (e) {
    window.location.assign('/');
  }
};

// --- Unified Plan UI Logic ---
function updatePlanUI() {
  const user = getSession();
  if (!user) return;

  const currentPlan = (user.plan || 'Free').toLowerCase();
  const allButtons = document.querySelectorAll('[data-plan-btn]');

  // 1. Find weight of current plan
  let currentWeight = 0;
  allButtons.forEach(btn => {
    if (btn.getAttribute('data-plan-btn').toLowerCase() === currentPlan) {
      currentWeight = parseInt(btn.getAttribute('data-plan-weight')) || 0;
    }
  });

  // 2. Update all buttons based on weight comparison
  allButtons.forEach(btn => {
    const planName = btn.getAttribute('data-plan-btn').toLowerCase();
    const planWeight = parseInt(btn.getAttribute('data-plan-weight')) || 0;

    if (planName === currentPlan) {
      btn.textContent = 'Current Plan';
      btn.disabled = true;
      btn.classList.add('bg-gray-100', 'text-gray-400', 'cursor-default', 'dark:bg-gray-800');
      btn.classList.remove(
        'hover:bg-indigo-600',
        'hover:text-white',
        'hover:border-indigo-600',
        'bg-primary',
        'text-white',
      );
      btn.onclick = e => e.preventDefault();
      btn.href = '#';
    } else {
      btn.disabled = false;
      btn.classList.remove('bg-gray-100', 'text-gray-400', 'cursor-default', 'dark:bg-gray-800');

      if (planWeight > currentWeight) {
        btn.textContent = 'Upgrade Plan';
      } else {
        btn.textContent = 'Downgrade Plan';
      }

      // If on pricing page, redirect to settings to handle the "payment/change"
      if (window.location.pathname.includes('/pricing')) {
        btn.href = '/settings#subscription';
        btn.onclick = null;
      }
    }
  });
}

// --- Auth Actions ---
window.handleSignup = async e => {
  e.preventDefault();
  const nameEl =
    document.getElementById('signup-name-modal') || document.getElementById('signup-name');
  const emailEl =
    document.getElementById('signup-email-modal') || document.getElementById('signup-email');
  const passwordEl =
    document.getElementById('signup-password-modal') || document.getElementById('signup-password');

  if (!nameEl || !emailEl || !passwordEl) return;
  const name = nameEl.value;
  const email = emailEl.value;
  const password = passwordEl.value;

  if (findUser(email)) {
    if (window.showToast) window.showToast('User already exists with this email.', 'error');
    return;
  }

  const hashedPassword = await hashPassword(password);
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan') || 'Free';

  const newUser = { name, email, password: hashedPassword, plan: selectedPlan };
  saveUser(newUser);
  setSession(newUser);

  window.closeModal('signupModal');
  if (window.showToast) window.showToast('Account created! Welcome, ' + name, 'success');
  window.safeRedirect('/dashboard');
};

window.handleLogin = async e => {
  e.preventDefault();
  const emailEl =
    document.getElementById('login-email-modal') || document.getElementById('login-email');
  const passwordEl =
    document.getElementById('login-password-modal') || document.getElementById('login-password');

  if (!emailEl || !passwordEl) return;
  const email = emailEl.value;
  const password = passwordEl.value;

  const user = findUser(email);
  const hashedPassword = await hashPassword(password);

  if (user && user.password === hashedPassword) {
    setSession(user);
    window.closeModal('loginModal');
    window.safeRedirect('/dashboard');
  } else {
    if (window.showToast) window.showToast('Invalid email or password.', 'error');
  }
};

window.handleLogout = async () => {
  clearSession();
  window.safeRedirect('/');
};

window.handleGoogleLogin = async () => {
  window.location.href = `${window.mindfullConfig.cmsUrl}/api/auth/google`;
};

window.handleGithubLogin = async () => {
  window.location.href = `${window.mindfullConfig.cmsUrl}/api/auth/github`;
};

window.handleDemoLogin = async () => {
  const demoEmail = 'demo@gmail.com';
  const demoPass = 'password';
  let user = findUser(demoEmail);
  if (!user) {
    const hashedPass = await window.hashPassword(demoPass);
    user = { name: 'Demo User', email: demoEmail, password: hashedPass, plan: 'Pro' };
    saveUser(user);
  }
  setSession(user);
  window.closeModal('loginModal');
  window.safeRedirect('/dashboard');
};

// --- State Observer ---
window.checkAuth = () => {
  const user = getSession();
  const path = window.location.pathname;

  // UI Elements
  const loggedOutDiv = document.getElementById('auth-logged-out');
  const loggedInDiv = document.getElementById('auth-logged-in');
  const userDisplayName = document.getElementById('user-display-name');
  const sidebar = document.querySelector('aside');

  if (user) {
    document.body.classList.add('user-logged-in');
    if (path.includes('/login') || path.includes('/signup')) {
      window.safeRedirect('/dashboard');
      return;
    }

    if (loggedOutDiv) loggedOutDiv.classList.add('hidden');
    if (loggedInDiv) {
      loggedInDiv.classList.remove('hidden');
      loggedInDiv.classList.add('flex');
    }
    if (userDisplayName) userDisplayName.textContent = user.name || user.email;
    if (sidebar) sidebar.classList.remove('hidden');

    // Update Pricing/Subscription Buttons
    updatePlanUI();
  } else {
    document.body.classList.remove('user-logged-in');
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden');
    if (loggedInDiv) loggedInDiv.classList.add('hidden');
    if (sidebar) sidebar.classList.add('hidden');

    // Protect private pages
    const protectedPaths = ['/dashboard', '/journal', '/settings', '/lessons'];
    if (protectedPaths.some(p => path.includes(p))) {
      window.safeRedirect('/login');
    }
  }
};

document.addEventListener('DOMContentLoaded', window.checkAuth);
