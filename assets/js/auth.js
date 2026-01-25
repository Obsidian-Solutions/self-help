/**
 * Open Source Local Authentication (Mock)
 *
 * This uses the browser's LocalStorage to simulate a fully functional
 * authentication system without requiring a proprietary backend (like Firebase).
 *
 * Perfect for prototyping, themes, and demos.
 * To go to production, replace these functions with calls to your API
 * (e.g., Supabase, Keycloak, or a custom Node/Go backend).
 */

const DB_KEY = 'mindfull_users'; // Simulates a database table
const SESSION_KEY = 'mindfull_session'; // Simulates a session cookie

// --- Modal Management ---
// NOTE: Modal functions are also in baseof.html to handle global modals
// These functions sync with those in baseof.html

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

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getUsers() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function saveUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function findUser(email) {
  const users = getUsers();
  return users.find(u => u.email === email);
}

function setSession(user) {
  // specific session data (don't store password in session)
  const sessionData = {
    email: user.email,
    name: user.name,
    id: user.id || Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Auth Actions ---

// 1. Sign Up
window.handleSignup = async e => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  // Check if user exists
  if (findUser(email)) {
    alert('User already exists with this email.');
    return;
  }

  // Create User
  const hashedPassword = await hashPassword(password);
  const newUser = { name, email, password: hashedPassword };
  saveUser(newUser);

  // Log them in automatically
  setSession(newUser);

  // Close modal and reload
  window.closeModal('signupModal');
  alert('Account created! Welcome, ' + name);
  window.location.href = '/dashboard';
};

// 2. Login
window.handleLogin = async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const user = findUser(email);
  const hashedPassword = await hashPassword(password);

  if (user && user.password === hashedPassword) {
    setSession(user);
    window.closeModal('loginModal');
    window.location.href = '/dashboard';
  } else {
    alert('Invalid email or password.');
  }
};

// 3. Logout
window.handleLogout = async () => {
  clearSession();
  window.location.href = '/';
};

// 4. Mock SSO (Google)
window.handleGoogleLogin = async () => {
  // Simulate a Google User
  const mockGoogleUser = {
    name: 'Demo User',
    email: 'demo@gmail.com',
    password: 'sso-placeholder-hashed', // Mock hash
  };

  if (!findUser(mockGoogleUser.email)) {
    saveUser(mockGoogleUser);
  }
  setSession(mockGoogleUser);
  window.location.href = '/dashboard';
};

// 5. Auth State Observer (Protect Dashboard)
window.checkAuth = () => {
  const user = getSession();
  const loggedOutDiv = document.getElementById('auth-logged-out');
  const loggedInDiv = document.getElementById('auth-logged-in');
  const userDisplayName = document.getElementById('user-display-name');

  if (user) {
    // User is logged in

    // Show logged-in state
    if (loggedOutDiv) loggedOutDiv.classList.add('hidden');
    if (loggedInDiv) loggedInDiv.classList.remove('hidden');

    // Display user's name
    if (userDisplayName) {
      userDisplayName.innerText = user.name || user.email;
    }

    // Show dashboard nav if hidden
    const navDashboard = document.getElementById('nav-dashboard');
    const navCourses = document.getElementById('nav-courses');
    if (navDashboard) navDashboard.classList.remove('hidden');
    if (navCourses) navCourses.classList.remove('hidden');
  } else {
    // User is NOT logged in

    // Show logged-out state
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden');
    if (loggedInDiv) loggedInDiv.classList.add('hidden');

    // Hide dashboard nav if visible
    const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) navDashboard.classList.add('hidden');

    // If on dashboard or journal, prompt to login
    if (
      window.location.pathname.includes('/dashboard') ||
      window.location.pathname.includes('/journal')
    ) {
      // Wait for modals to be available
      setTimeout(() => {
        if (window.openModal) {
          window.openModal('loginModal');
        }
      }, 500);
    }
  }
};

// Run check on load
document.addEventListener('DOMContentLoaded', window.checkAuth);
