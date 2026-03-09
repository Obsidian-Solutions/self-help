/**
 * Open Source Local Authentication (Mock)
 *
 * This uses the browser's LocalStorage to simulate a fully functional
 * authentication system without requiring a proprietary backend (like Firebase).
 *
 * Perfect for prototyping, themes, and demos.
 */

const DB_KEY = 'mindfull_users';
const SESSION_KEY = 'mindfull_session';
const CONFIG = window.mindfullConfig || {};
const CMS_URL = CONFIG.cmsUrl || 'http://localhost:3000';
const BASE_PATH = (CONFIG.basePath || '/').replace(/\/+$/, '');

// --- Helper to normalize internal paths with base path ---
function normalizePath(path) {
  if (!path.startsWith('/')) return path;
  const cleanPath = path.replace(/\/+$/, '');
  return BASE_PATH + (cleanPath || '/');
}

// --- CMS CRM Integration Helper ---
async function logInteraction(type, metadata = '') {
  const session = getSession();
  if (!session || !session.token) return;

  try {
    await fetch(`${CMS_URL}/api/content/interaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ type, metadata }),
    });
  } catch (e) {
    console.warn('CRM logging failed', e);
  }
}

// --- Modal Management ---
window.openModal = modalId => {
  console.log('Opening modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    console.error('Modal not found:', modalId);
  }
};

window.closeModal = modalId => {
  console.log('Closing modal:', modalId);
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
    if (!data) return [];
    return JSON.parse(data);
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
    token: user.token || null, // CMS token if logged in through API
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

// Security: URL Whitelist for redirections
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
    '/privacy',
    '/terms',
    '/cookie-policy',
  ].map(p => normalizePath(p));

  const target = path.startsWith('/') ? path : normalizePath('/' + path);

  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
    window.location.replace(normalizePath('/'));
    return;
  }

  try {
    const url = new URL(target, window.location.origin);
    const currentOrigin = window.location.origin;
    if (url.origin !== currentOrigin) {
      window.location.replace(normalizePath('/'));
      return;
    }

    const basePath = url.pathname.replace(/\/+$/, '') || '/';
    const isSafe = whitelist.some(
      w => basePath === w || (w !== normalizePath('/') && basePath.startsWith(w + '/')),
    );

    if (isSafe) {
      window.location.replace(url.pathname + url.search + url.hash);
    } else {
      window.location.replace(normalizePath('/'));
    }
  } catch (e) {
    window.location.replace(normalizePath('/'));
  }
};

// --- Auth Actions ---

// 1. Sign Up
window.handleSignup = async e => {
  e.preventDefault();
  const nameEl = document.getElementById('signup-name-modal') || document.getElementById('signup-name');
  const emailEl = document.getElementById('signup-email-modal') || document.getElementById('signup-email');
  const passwordEl = document.getElementById('signup-password-modal') || document.getElementById('signup-password');

  if (!nameEl || !emailEl || !passwordEl) return;

  const name = nameEl.value;
  const email = emailEl.value;
  const password = passwordEl.value;

  if (findUser(email)) {
    alert('User already exists with this email.');
    return;
  }

  const hashedPassword = await hashPassword(password);
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan') || 'Free';

  const newUser = { name, email, password: hashedPassword, plan: selectedPlan };
  saveUser(newUser);
  setSession(newUser);

  window.closeModal('signupModal');
  alert('Account created! Welcome, ' + name);

  // Log interaction if CMS is available (this might fail silently if no token yet)
  logInteraction('registration', `Plan: ${selectedPlan}`);

  window.safeRedirect('/dashboard');
};

// 2. Login
window.handleLogin = async e => {
  e.preventDefault();
  const emailEl = document.getElementById('login-email-modal') || document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password-modal') || document.getElementById('login-password');

  if (!emailEl || !passwordEl) return;

  const email = emailEl.value;
  const password = passwordEl.value;

  const user = findUser(email);
  const hashedPassword = await hashPassword(password);

  if (user && user.password === hashedPassword) {
    setSession(user);
    window.closeModal('loginModal');
    logInteraction('login');
    window.safeRedirect('/dashboard');
  } else {
    alert('Invalid email or password.');
  }
};

// 3. Logout
window.handleLogout = async () => {
  logInteraction('logout');
  clearSession();
  window.safeRedirect('/');
};

// 4. State Observer
window.checkAuth = () => {
  const user = getSession();
  const loggedOutDiv = document.getElementById('auth-logged-out');
  const loggedInDiv = document.getElementById('auth-logged-in');
  const mobileLoggedOutDiv = document.getElementById('mobile-auth-logged-out');
  const mobileLoggedInDiv = document.getElementById('mobile-auth-logged-in');
  const userDisplayName = document.getElementById('user-display-name');
  const mobileDisplayName = document.getElementById('mobile-user-name');
  const navDashboard = document.getElementById('nav-dashboard');
  const mobileDashboardLinks = document.querySelectorAll('.mobile-dashboard-link');
  const navCourses = document.getElementById('nav-courses');

  const currentPath = window.location.pathname;
  const isAuthPage =
    currentPath.includes(normalizePath('/login')) || currentPath.includes(normalizePath('/signup'));
  const isAppPage =
    currentPath.includes(normalizePath('/dashboard')) ||
    currentPath.includes(normalizePath('/journal')) ||
    currentPath.includes(normalizePath('/settings'));
  const isProtectedPage = isAppPage || currentPath.includes(normalizePath('/lessons'));

  if (user) {
    document.body.classList.add('user-logged-in');
    if (isAuthPage) {
      window.safeRedirect('/dashboard');
      return;
    }

    if (loggedOutDiv) {
      loggedOutDiv.classList.add('hidden');
      loggedOutDiv.style.display = 'none';
    }
    if (loggedInDiv) {
      loggedInDiv.classList.remove('hidden');
      loggedInDiv.style.display = 'flex';
    }
    if (mobileLoggedOutDiv) mobileLoggedOutDiv.classList.add('hidden');
    if (mobileLoggedInDiv) mobileLoggedInDiv.classList.remove('hidden');
    if (mobileDisplayName) mobileDisplayName.textContent = user.name || user.email;
    mobileDashboardLinks.forEach(link => link.classList.remove('hidden'));

    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.classList.remove('hidden');
      sidebar.style.display = '';
    }
    if (userDisplayName) userDisplayName.textContent = user.name || user.email;
    if (navDashboard) navDashboard.classList.remove('hidden');
    if (navCourses) navCourses.classList.remove('hidden');

    document.querySelectorAll('.auth-only').forEach(el => {
      el.classList.remove('hidden');
      el.style.display = '';
    });

    // Update buttons
    const signupPath = normalizePath('/signup');
    const loginPath = normalizePath('/login');
    document.querySelectorAll(`a[href="${signupPath}"], a[href="${loginPath}"]`).forEach(btn => {
      if (btn.closest('#auth-logged-out') || btn.closest('.mobile-auth-section')) return;
      const btnText = btn.textContent.toLowerCase();
      if (btnText.includes('get started')) {
        btn.href = normalizePath('/dashboard');
        btn.textContent = 'Go to Dashboard';
      }
    });
  } else {
    document.body.classList.remove('user-logged-in');
    if (loggedOutDiv) {
      loggedOutDiv.classList.remove('hidden');
      loggedOutDiv.style.display = 'flex';
    }
    if (loggedInDiv) {
      loggedInDiv.classList.add('hidden');
      loggedInDiv.style.display = 'none';
    }
    if (isProtectedPage) {
      if (isAuthPage) return;
      window.safeRedirect('/login');
    }
  }
};

document.addEventListener('DOMContentLoaded', window.checkAuth);
