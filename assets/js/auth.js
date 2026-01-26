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
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function saveUser(user) {
  const users = getUsers();
  // Default new users to Free plan if not specified
  if (!user.plan) user.plan = 'Free';
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
    plan: user.plan || 'Free',
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

  // Capture plan from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan') || 'Free';

  const newUser = { name, email, password: hashedPassword, plan: selectedPlan };
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
  const navDashboard = document.getElementById('nav-dashboard');
  const navCourses = document.getElementById('nav-courses');

  const path = window.location.pathname;
  const isAuthPage = path.includes('/login') || path.includes('/signup');
  const isAppPage =
    path.includes('/dashboard') || path.includes('/journal') || path.includes('/settings');
  const isProtectedPage = isAppPage || path.includes('/lessons');

  if (user) {
    // User is logged in
    console.log('Session active for:', user.email, 'Plan:', user.plan);

    // Redirect away from auth pages if logged in
    if (isAuthPage) {
      window.location.href = '/dashboard';
      return;
    }

    // Update Header UI
    if (loggedOutDiv) {
      loggedOutDiv.classList.add('hidden');
      loggedOutDiv.classList.remove('sm:flex');
      loggedOutDiv.style.display = 'none';
    }
    if (loggedInDiv) {
      loggedInDiv.classList.remove('hidden');
      loggedInDiv.classList.add('flex');
      loggedInDiv.style.display = 'flex';
    }

    // Show Sidebar if it exists
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.classList.remove('hidden');
      // On small screens it might be hidden by default, but let's ensure it's visible in app state
      sidebar.style.display = '';
    }

    // ... (rest of logged in logic)

    // Display user's name
    if (userDisplayName) {
      userDisplayName.innerText = user.name || user.email;
    }

    // Show authenticated nav links
    if (navDashboard) navDashboard.classList.remove('hidden');
    if (navCourses) navCourses.classList.remove('hidden');

    // Update "Get Started" and "Choose Plan" buttons dynamically
    const allAuthLinks = document.querySelectorAll(
      'a[href="/signup"], a[href="/login"], a[href*="/signup?"], a[href*="/login?"]',
    );
    allAuthLinks.forEach(btn => {
      // Don't touch header links we already handled via hidden classes
      if (btn.closest('#auth-logged-out')) return;

      const btnText = btn.innerText.toLowerCase();
      const currentPlan = (user.plan || 'Free').toLowerCase();

      // If it is a secondary "Login" button next to a primary "Get Started", hide it
      if (
        btn.id === 'hero-login-btn' ||
        (btnText === 'log in' && btn.classList.contains('bg-indigo-100'))
      ) {
        btn.classList.add('hidden');
        btn.style.display = 'none';
        return;
      }

      // Home page Hero / General "Get Started"
      if (btnText.includes('get started')) {
        btn.href = '/dashboard';
        btn.innerText = 'Go to Dashboard';
      }

      // Pricing Section buttons
      if (btn.closest('.divide-y') || btnText.includes('choose')) {
        const planName = btn.getAttribute('href').split('plan=')[1]?.toLowerCase() || '';

        if (planName === currentPlan) {
          btn.innerText = 'Current Plan';
          btn.href = '#';
          btn.classList.add(
            'bg-indigo-100',
            'dark:bg-indigo-900/50',
            'text-indigo-700',
            'dark:text-indigo-300',
            'border-indigo-300',
            'dark:border-indigo-700',
            'cursor-default',
            'shadow-inner',
          );
          btn.classList.remove('bg-primary');
          btn.onclick = e => e.preventDefault();
        } else if (currentPlan === 'free' && (planName === 'pro' || planName === 'premium')) {
          btn.innerText = 'Upgrade to ' + planName.charAt(0).toUpperCase() + planName.slice(1);
          btn.href = '/settings'; // Redirect to settings to "upgrade"
        } else if (currentPlan !== 'free' && planName === 'free') {
          btn.innerText = 'Downgrade to Free';
          btn.href = '/settings';
        } else {
          btn.innerText = 'Switch to ' + planName.charAt(0).toUpperCase() + planName.slice(1);
          btn.href = '/settings';
        }
      }
    });
  } else {
    // User is NOT logged in
    console.log('No active session');

    // Show logged-out state
    if (loggedOutDiv) {
      loggedOutDiv.classList.remove('hidden');
      loggedOutDiv.classList.add('flex');
      loggedOutDiv.style.display = 'flex';
    }
    if (loggedInDiv) {
      loggedInDiv.classList.add('hidden');
      loggedInDiv.style.display = 'none';
    }

    // Hide Sidebar if it exists

    const sidebar = document.querySelector('aside');

    if (sidebar) {
      sidebar.classList.add('hidden');

      sidebar.style.display = 'none';
    }

    // Hide dashboard/protected nav

    if (navDashboard) navDashboard.classList.add('hidden');

    // Redirect if on protected page

    if (isProtectedPage) {
      console.warn('Access denied. Redirecting to login.');

      if (isAuthPage) return; // Already on login/signup

      // If we have modals, use them, otherwise redirect to login page

      const hasModals = document.getElementById('loginModal');

      if (
        hasModals &&
        (path.includes('/dashboard') || path.includes('/journal') || path.includes('/settings'))
      ) {
        setTimeout(() => {
          window.openModal('loginModal');
        }, 500);
      } else {
        window.location.href = '/login';
      }
    }
  }
};

// Run check on load
document.addEventListener('DOMContentLoaded', window.checkAuth);
