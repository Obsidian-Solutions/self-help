/**
 * Open Source Local Authentication (Mock)
 */

console.log('MindFull Auth Script Loaded');

const DB_KEY = 'mindfull_users';
const SESSION_KEY = 'mindfull_session';

// --- Pre-seed Demo User ---
if (!localStorage.getItem(DB_KEY)) {
  console.log('Seeding Demo User...');
  const demoUser = { name: 'Demo User', email: 'demo@example.com', password: 'password' };
  localStorage.setItem(DB_KEY, JSON.stringify([demoUser]));
}

// --- Helper Functions ---

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

  const newUser = { name, email, password };
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

  if (user && user.password === password) {
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
    password: 'sso-placeholder',
  };

  if (!findUser(mockGoogleUser.email)) {
    saveUser(mockGoogleUser);
  }
  setSession(mockGoogleUser);
  window.location.href = '/dashboard';
};

window.checkAuth = () => {
  const user = getSession();
  const path = window.location.pathname;

  // UI Elements
  const navDashboard = document.getElementById('nav-dashboard');
  const navCourses = document.getElementById('nav-courses');
  const heroCoursesBtn = document.getElementById('hero-courses-btn');
  const heroLoginBtn = document.getElementById('hero-login-btn');
  const userDisplay = document.getElementById('user-display-name');
  const loginLink = document.querySelector('a[href="/login"]');
  const signupBtn = document.querySelector('a[href="/signup"]');

  if (user) {
    console.log('User is signed in:', user.email);

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

    // Header: Change "Log In" to "Log Out"
    if (loginLink) {
      loginLink.href = '#';
      loginLink.innerText = 'Log Out';
      loginLink.onclick = e => {
        e.preventDefault();
        window.handleLogout();
      };
    }

    // Header: Hide "Sign Up"
    if (signupBtn) signupBtn.style.display = 'none';

    // Homepage Hero: Swap buttons
    if (heroLoginBtn) {
      heroLoginBtn.href = '/dashboard';
      heroLoginBtn.innerText = 'Go to Dashboard';
    }
    // "Browse Courses" button remains visible for logged-in users

    // Redirect if on login/signup pages
    if (path.includes('/login') || path.includes('/signup')) {
      window.location.href = '/dashboard';
    }
  } else {
    console.log('User is not signed in');

    // Header: Hide Dashboard & Courses links
    if (navDashboard) {
      navDashboard.classList.add('hidden');
      navDashboard.classList.remove('inline-flex');
    }
    if (navCourses) {
      navCourses.classList.add('hidden');
      navCourses.classList.remove('inline-flex');
    }

    // Protect Routes: Dashboard, Journal, AND Courses
    if (
      path.includes('/dashboard') ||
      path.includes('/journal') ||
      path.includes('/courses') ||
      path.includes('/lessons')
    ) {
      console.warn('Access denied. Redirecting to login.');
      // Store return URL? For now simple redirect.
      window.location.href = '/login';
    }

    // Homepage Hero: Ensure "Browse Courses" redirects to login if clicked (optional, but handled by protected route above)
    // Actually, if we want to be strict "advertisement only":
    if (heroCoursesBtn) {
      // We can change the text or make it redirect to login explicitly
      // But since /courses is protected, clicking it will naturally redirect.
      // Let's leave it as "Browse Courses" -> clicks -> redirects to login.
    }
  }
};

document.addEventListener('DOMContentLoaded', window.checkAuth);
