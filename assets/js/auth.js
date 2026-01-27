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
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
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
  ];

  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    window.location.assign('/');
    return;
  }

  try {
    // Stricter parsing to avoid any possibility of cross-origin redirect
    const url = new URL(path, window.location.origin);

    // Explicitly check that origin matches current origin exactly
    const currentOrigin = window.location.origin;
    if (url.origin !== currentOrigin) {
      window.location.assign('/');
      return;
    }

    const basePath = url.pathname;
    const isSafe = whitelist.some(
      w => basePath === w || (w !== '/' && basePath.startsWith(w + '/')),
    );

    if (isSafe) {
      // Re-construct the URL from parts to be absolutely certain no malicious strings bypass checks
      const safePath = url.pathname + url.search + url.hash;
      window.location.assign(safePath);
    } else {
      window.location.assign('/');
    }
  } catch (e) {
    window.location.assign('/');
  }
};

// --- Auth Actions ---

// 1. Sign Up
window.handleSignup = async e => {
  e.preventDefault();
  const nameEl = document.getElementById('signup-name');
  const emailEl = document.getElementById('signup-email');
  const passwordEl = document.getElementById('signup-password');

  if (!nameEl || !emailEl || !passwordEl) return;

  const name = nameEl.value;
  const email = emailEl.value;
  const password = passwordEl.value;

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
  window.safeRedirect('/dashboard');
};

// 2. Login
window.handleLogin = async e => {
  e.preventDefault();
  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');

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
    alert('Invalid email or password.');
  }
};

// 3. Logout
window.handleLogout = async () => {
  clearSession();
  window.safeRedirect('/');
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
  window.safeRedirect('/dashboard');
};

// 5. One-Click Demo Login
window.handleDemoLogin = async () => {
  const demoEmail = 'demo@gmail.com';
  const demoPass = 'password'; // Plain text for recreating hash

  // Check if demo user exists in local DB
  let user = findUser(demoEmail);

  if (!user) {
    // Auto-create demo user if missing (e.g. after clearing cookies)
    const hashedPass = await window.hashPassword(demoPass);
    user = {
      name: 'Demo User',
      email: demoEmail,
      password: hashedPass,
      plan: 'Pro', // Give demo user Pro features
    };
    saveUser(user);
  }

  // Log them in
  setSession(user);
  window.closeModal('loginModal');
  window.safeRedirect('/dashboard');
};

// 6. Auth State Observer (Protect Dashboard)
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

  const path = window.location.pathname;
  const isAuthPage = path.includes('/login') || path.includes('/signup');
  const isAppPage =
    path.includes('/dashboard') || path.includes('/journal') || path.includes('/settings');
  const isProtectedPage = isAppPage || path.includes('/lessons');

  if (user) {
    // User is logged in
    document.body.classList.add('user-logged-in');

    // Redirect away from auth pages if logged in
    if (isAuthPage) {
      window.safeRedirect('/dashboard');
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

    // Update Mobile UI
    if (mobileLoggedOutDiv) mobileLoggedOutDiv.classList.add('hidden');
    if (mobileLoggedInDiv) mobileLoggedInDiv.classList.remove('hidden');
    if (mobileDisplayName) mobileDisplayName.textContent = user.name || user.email;
    mobileDashboardLinks.forEach(link => link.classList.remove('hidden'));

    // Show Sidebar if it exists
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.classList.remove('hidden');
      sidebar.style.display = '';
    }

    // Display user's name
    if (userDisplayName) {
      userDisplayName.textContent = user.name || user.email;
    }

    // Show authenticated nav links
    if (navDashboard) navDashboard.classList.remove('hidden');
    if (navCourses) navCourses.classList.remove('hidden');

    // Show auth-only elements (progress bars)
    document.querySelectorAll('.auth-only').forEach(el => {
      el.classList.remove('hidden');
      el.style.display = '';
    });

    // Update "Get Started" and "Choose Plan" buttons dynamically
    const allAuthLinks = document.querySelectorAll(
      'a[href="/signup"], a[href="/login"], a[href*="/signup?"], a[href*="/login?"]',
    );
    allAuthLinks.forEach(btn => {
      // Don't touch header links we already handled via hidden classes
      if (btn.closest('#auth-logged-out') || btn.closest('.mobile-auth-section')) return;

      const btnText = btn.textContent.toLowerCase();
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
        btn.textContent = 'Go to Dashboard';
      }

      // Pricing Section buttons
      if (btn.closest('.divide-y') || btnText.includes('choose')) {
        const planName = btn.getAttribute('href').split('plan=')[1]?.toLowerCase() || '';

        if (planName === currentPlan) {
          btn.textContent = 'Current Plan';
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
          btn.textContent = 'Upgrade to ' + planName.charAt(0).toUpperCase() + planName.slice(1);
          btn.href = '/settings'; // Redirect to settings to "upgrade"
        } else if (currentPlan !== 'free' && planName === 'free') {
          btn.textContent = 'Downgrade to Free';
          btn.href = '/settings';
        } else {
          btn.textContent = 'Switch to ' + planName.charAt(0).toUpperCase() + planName.slice(1);
          btn.href = '/settings';
        }
      }
    });

    // Handle Course Access per Subscription
    const courseStartBtns = document.querySelectorAll('.course-start-btn');
    courseStartBtns.forEach(btn => {
      const isPremium = btn.getAttribute('data-premium') === 'true';
      const userPlan = (user.plan || 'Free').toLowerCase();

      if (isPremium && userPlan === 'free') {
        btn.textContent = 'Upgrade to Pro to Start';
        btn.href = '/settings';
        btn.classList.add('opacity-90');
        btn.onclick = null;
      } else {
        const currentText = btn.textContent;
        btn.textContent = currentText.includes('Course') ? 'Start Course' : 'Start Learning';

        const authHref = btn.getAttribute('data-auth-href');
        // Security check for authHref
        if (
          typeof authHref === 'string' &&
          authHref.startsWith('/') &&
          !authHref.startsWith('//') &&
          !authHref.includes(':')
        ) {
          // Use event listener instead of direct href for extra safety
          btn.addEventListener('click', e => {
            e.preventDefault();
            window.safeRedirect(authHref);
          });
        }
      }
    });
  } else {
    // User is NOT logged in
    document.body.classList.remove('user-logged-in');

    // Update public buttons to prompt for login
    const courseStartBtns = document.querySelectorAll('.course-start-btn');
    courseStartBtns.forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        window.openModal('signupModal');
      };
    });

    // Hide auth-only elements
    document.querySelectorAll('.auth-only').forEach(el => el.classList.add('hidden'));

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

    // Update Mobile UI
    if (mobileLoggedOutDiv) mobileLoggedOutDiv.classList.remove('hidden');
    if (mobileLoggedInDiv) mobileLoggedInDiv.classList.add('hidden');
    mobileDashboardLinks.forEach(link => link.classList.add('hidden'));

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
        window.safeRedirect('/login');
      }
    }
  }
};

// Run check on load
document.addEventListener('DOMContentLoaded', window.checkAuth);
