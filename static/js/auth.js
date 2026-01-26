/**
 * Open Source Local Authentication (Mock)
 */

console.log('MindFull Auth Script Loaded');

const DB_KEY = 'mindfull_users';
const SESSION_KEY = 'mindfull_session';

// --- Pre-seed Demo User ---
if (!localStorage.getItem(DB_KEY)) {
  console.log('Seeding Demo User...');
  // Hashed version of 'password'
  const demoUser = {
    name: 'Demo User',
    email: 'demo@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
  };
  localStorage.setItem(DB_KEY, JSON.stringify([demoUser]));
}

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
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Auth Actions ---

window.handleSignUp = async e => {
  e.preventDefault();
  console.log('Handling Sign Up...');
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (findUser(email)) {
    if (window.showToast) {
      window.showToast('User already exists with this email.', 'error');
    } else {
      alert('User already exists with this email.');
    }
    return;
  }

  const hashedPassword = await hashPassword(password);
  const newUser = { name, email, password: hashedPassword };
  saveUser(newUser);
  setSession(newUser);

  if (window.showToast) {
    window.showToast('Account created! Welcome, ' + name, 'success');
  } else {
    alert('Account created! Welcome, ' + name);
  }

  setTimeout(() => {
    window.location.href = '/dashboard';
  }, 1500);
};

window.handleLogin = async e => {
  e.preventDefault();
  console.log('Handling Login...');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const user = findUser(email);
  const hashedPassword = await hashPassword(password);

  if (user && user.password === hashedPassword) {
    console.log('Login Successful');
    setSession(user);
    if (window.showToast) {
      window.showToast('Login successful! Welcome back.', 'success');
    }
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  } else {
    console.warn('Login Failed');
    if (window.showToast) {
      window.showToast('Invalid email or password.', 'error');
    } else {
      alert('Invalid email or password. (Try demo@example.com / password)');
    }
  }
};

window.handleLogout = async () => {
  clearSession();
  window.location.href = '/';
};

window.handleGoogleLogin = async () => {
  const mockGoogleUser = {
    name: 'Google User',
    email: 'google@example.com',
    password: 'sso-placeholder-hashed',
  };

  if (!findUser(mockGoogleUser.email)) {
    saveUser(mockGoogleUser);
  }
  setSession(mockGoogleUser);
  window.location.href = '/dashboard';
};

window.checkAuth = () => {
  const user = getSession();
  const navDashboard = document.getElementById('nav-dashboard');
  const navCourses = document.getElementById('nav-courses');
  const loggedOutDiv = document.getElementById('auth-logged-out');
  const loggedInDiv = document.getElementById('auth-logged-in');
  const userDisplay = document.getElementById('user-display-name');

  const path = window.location.pathname;
  const isAuthPage = path.includes('/login') || path.includes('/signup');
  const isAppPage =
    path.includes('/dashboard') || path.includes('/journal') || path.includes('/settings');
  const isProtectedPage = isAppPage || path.includes('/lessons');

  if (user) {
    console.log('User is signed in:', user.email, 'Plan:', user.plan);
    document.body.classList.add('user-logged-in');

    // Redirect away from auth pages if logged in
    if (isAuthPage) {
      window.location.href = '/dashboard';
      return;
    }

    // Header UI Updates
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
      sidebar.style.display = '';
    }

    // Header: Show Dashboard & Courses links
    if (navDashboard) {
      navDashboard.classList.remove('hidden');
      navDashboard.classList.add('inline-flex');
    }
    if (navCourses) {
      navCourses.classList.remove('hidden');
      navCourses.classList.add('inline-flex');
    }

    // Header: User Name
    if (userDisplay) userDisplay.innerText = user.name || user.email;

    // Show auth-only elements
    document.querySelectorAll('.auth-only').forEach(el => {
      el.classList.remove('hidden');
      el.style.display = '';
    });

    // Update links logic
    const allAuthLinks = document.querySelectorAll(
      'a[href="/signup"], a[href="/login"], a[href*="/signup?"], a[href*="/login?"]',
    );
    allAuthLinks.forEach(link => {
      if (link.closest('#auth-logged-out') || link.closest('#auth-logged-in')) return;

      const linkText = link.innerText.toLowerCase();
      const currentPlan = (user.plan || 'Free').toLowerCase();

      if (
        link.id === 'hero-login-btn' ||
        (linkText === 'log in' && link.classList.contains('bg-indigo-100'))
      ) {
        link.classList.add('hidden');
        link.style.display = 'none';
        return;
      }

      if (linkText.includes('get started')) {
        link.href = '/dashboard';
        link.innerText = 'Go to Dashboard';
      }

      if (link.closest('.divide-y') || linkText.includes('choose')) {
        const planName = link.getAttribute('href').split('plan=')[1]?.toLowerCase() || '';

        if (planName === currentPlan) {
          link.innerText = 'Current Plan';
          link.href = '#';
          link.classList.add(
            'bg-indigo-100',
            'dark:bg-indigo-900/50',
            'text-indigo-700',
            'dark:text-indigo-300',
            'border-indigo-300',
            'dark:border-indigo-700',
            'cursor-default',
            'shadow-inner',
          );
          link.classList.remove('bg-primary');
          link.onclick = e => e.preventDefault();
        } else if (currentPlan === 'free' && (planName === 'pro' || planName === 'premium')) {
          link.innerText = 'Upgrade to ' + planName.charAt(0).toUpperCase() + planName.slice(1);
          link.href = '/settings';
        } else if (currentPlan !== 'free' && planName === 'free') {
          link.innerText = 'Downgrade to Free';
          link.href = '/settings';
        } else {
          link.innerText = 'Switch to ' + planName.charAt(0).toUpperCase() + planName.slice(1);
          link.href = '/settings';
        }
      }
    });

    // Handle Course Access per Subscription
    const courseStartBtns = document.querySelectorAll('.course-start-btn');
    courseStartBtns.forEach(btn => {
      const isPremium = btn.getAttribute('data-premium') === 'true';
      const userPlan = (user.plan || 'Free').toLowerCase();

      if (isPremium && userPlan === 'free') {
        btn.innerText = 'Upgrade to Pro to Start';
        btn.href = '/settings';
        btn.classList.add('opacity-90');
        btn.onclick = null;
      } else {
        btn.innerText = btn.innerText.includes('Course') ? 'Start Course' : 'Start Learning';
        btn.href = btn.getAttribute('data-auth-href') || btn.href;
      }
    });
  } else {
    console.log('User is not signed in');
    document.body.classList.remove('user-logged-in');

    // Update public buttons to prompt for login
    const courseStartBtns = document.querySelectorAll('.course-start-btn');
    courseStartBtns.forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        if (window.openModal) {
          window.openModal('signupModal');
        } else {
          window.location.href = '/signup';
        }
      };
    });

    // Hide auth-only elements
    document.querySelectorAll('.auth-only').forEach(el => el.classList.add('hidden'));

    // Header UI Updates
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

    // Header: Hide Dashboard & Courses links
    if (navDashboard) {
      navDashboard.classList.add('hidden');
      navDashboard.classList.remove('inline-flex');
    }
    if (navCourses) {
      navCourses.classList.add('hidden');
      navCourses.classList.remove('inline-flex');
    }

    // Protect Routes
    if (isProtectedPage && !isAuthPage) {
      console.warn('Access denied. Redirecting to login.');
      window.location.href = '/login';
    }
  }
};

document.addEventListener('DOMContentLoaded', window.checkAuth);
