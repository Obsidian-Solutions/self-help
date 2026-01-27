/**
 * MindFull Command Center v3.2
 * Hardened Authentication & Connection Management
 */

const API_BASE = window.location.origin + '/api';

// --- Core Helper: API Fetcher ---
async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    // Add CSRF if available
    const csrf = getCookie('XSRF-TOKEN');
    if (csrf) headers['x-xsrf-token'] = csrf;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (res.status === 401 || res.status === 403) {
            const data = await res.json();
            if (data.message !== 'CSRF token mismatch') {
                logout();
                return null;
            }
        }
        return res.json();
    } catch (e) {
        console.error(`[API ERROR] ${endpoint}:`, e);
        return null;
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// --- Login Handler ---
async function handleLogin(e) {
    if (e) e.preventDefault();
    console.log("Attempting authentication...");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-btn');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Verifying...';

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok && data.token) {
            console.log("Login success! Redirecting...");
            localStorage.setItem('mindfull_admin_token', data.token);
            localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
            window.location.href = window.location.pathname; // Clear any query params
        } else {
            console.warn("Login failed:", data.message);
            alert("Authentication Failed: " + (data.message || "Invalid credentials"));
            btn.disabled = false;
            btn.textContent = 'Sign In →';
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Connection Error: The CMS server might be offline. Run 'npm start' in the cms folder.");
        btn.disabled = false;
        btn.textContent = 'Sign In →';
    }
    return false; // Triple-lock against form refresh
}

function logout() {
    console.log("Logging out...");
    localStorage.clear();
    window.location.reload();
}

// --- Initialization ---
async function init() {
    console.log("Command Center Initializing...");
    
    // Check Health
    try {
        const health = await fetch(`${API_BASE}/health`);
        if (!health.ok) throw new Error("Offline");
    } catch (e) {
        showOfflineScreen();
        return;
    }

    const token = localStorage.getItem('mindfull_admin_token');
    const userStr = localStorage.getItem('mindfull_admin_user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'therapist') {
            setupDashboard(user);
        } else { logout(); }
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
        document.body.classList.remove('opacity-0');
    }
}

function setupDashboard(user) {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('admin-name').textContent = user.name;
    document.getElementById('admin-role').textContent = user.role.toUpperCase();
    document.getElementById('admin-avatar').src = `https://i.pravatar.cc/100?u=${user.email}`;
    
    document.body.classList.remove('opacity-0');
    showSection('dashboard');
    
    // Init SimpleMDE if on content section
    if (document.getElementById("editor-textarea")) {
        simplemde = new SimpleMDE({ element: document.getElementById("editor-textarea") });
    }
}

function showOfflineScreen() {
    document.body.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-slate-900 text-white p-10">
            <div class="text-center max-w-md">
                <div class="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                    <i class="fa-solid fa-plug-circle-xmark text-3xl"></i>
                </div>
                <h1 class="text-3xl font-black mb-4">Command Center Offline</h1>
                <p class="text-slate-400 font-medium leading-relaxed mb-8">The CMS server is not running. Start it by running <code class="bg-slate-800 px-2 py-1 rounded text-pink-400">npm start</code> in the <code class="text-indigo-400">/cms</code> directory.</p>
                <button onclick="location.reload()" class="bg-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Retry Link</button>
            </div>
        </div>
    `;
    document.body.classList.remove('opacity-0');
}

// --- Dashboard Logic ---
async function loadDashboardData() {
    const stats = await api('/admin/stats');
    if (!stats) return;

    document.getElementById('stat-users').textContent = stats.totalUsers;
    document.getElementById('stat-views').textContent = stats.totalViews;
    document.getElementById('stat-rating').textContent = stats.averageRating;
    document.getElementById('stat-new-leads').textContent = stats.newInquiries;

    const [popular, comments, activity, trends] = await Promise.all([
        api('/admin/popular'), api('/admin/comments'), api('/admin/activity'), api('/admin/analytics/trends')
    ]);

    if (activity) renderActivity(activity);
    if (popular) renderPopular(popular);
    if (comments) renderComments(comments);
    if (trends) renderTrends(trends);
}

function renderActivity(items) {
    const container = document.getElementById('activity-list');
    container.innerHTML = items.map(i => `
        <div class="py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full ${i.activity_type === 'inquiry' ? 'bg-amber-500' : 'bg-indigo-500'}"></div>
                <p class="text-sm font-bold">${i.user_name} <span class="text-slate-400 font-medium">${i.event}</span></p>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
        </div>
    `).join('') || '<p class="py-4 text-xs italic text-slate-400 text-center">No activity pulse detected.</p>';
}

// ... rest of the CMS logic remains same as v3.0, but using the api() helper ...

function showSection(id) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');
    document.getElementById('nav-btn-' + (id === 'editor' ? 'content' : id))?.classList.add('active');

    if (id === 'dashboard') loadDashboardData();
    if (id === 'content') loadCollection('posts');
    if (id === 'media') loadMedia();
    if (id === 'users') loadUsers();
}

// Start
window.onload = init;
