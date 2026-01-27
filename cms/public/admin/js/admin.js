/**
 * MindFull Command Center v3.4
 * Extreme Debug & Robust Auth Logic
 */

console.log("Admin script loaded successfully.");

const API_BASE = window.location.origin + '/api';
let simplemde = null;
let trendsChart = null;
let currentCollection = 'posts';
let currentSlug = null;

// --- Globalize Functions ---
window.handleLogin = async function() {
    console.log("handleLogin called");
    
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const btn = document.getElementById('auth-btn');
    
    if (!emailEl || !passwordEl) {
        console.error("Critical: Form inputs not found in DOM");
        return;
    }

    if (!emailEl.value || !passwordEl.value) {
        alert("Please enter both email and password.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Verifying...';

    try {
        console.log("Fetching from:", `${API_BASE}/auth/login`);
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailEl.value, password: passwordEl.value })
        });
        
        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Response data received");
        
        if (res.ok && data.token) {
            console.log("Auth success. Storing tokens...");
            localStorage.setItem('mindfull_admin_token', data.token);
            localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
            window.location.href = window.location.pathname;
        } else {
            console.warn("Auth failure:", data.message);
            alert("Authentication Failed: " + (data.message || "Check your credentials."));
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (err) {
        console.error("Detailed Fetch Error:", err);
        alert("Connection Error: " + err.message + "\n\nPlease ensure the CMS server is running at " + API_BASE);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

window.logout = function() {
    console.log("Logging out...");
    localStorage.clear();
    window.location.reload();
};

window.showSection = function(id) {
    console.log("Showing section:", id);
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');
    document.getElementById('nav-btn-' + (id === 'editor' ? 'content' : id))?.classList.add('active');

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = id.charAt(0).toUpperCase() + id.slice(1);

    if (id === 'dashboard') loadDashboardData();
    if (id === 'content') loadCollection(currentCollection);
    if (id === 'media') loadMedia();
    if (id === 'users') loadUsers();
    if (id === 'inquiries') loadInquiries();
};

// --- Init & State ---
async function init() {
    console.log("MindFull CMS Initializing...");
    
    // 1. Health Check
    try {
        console.log("Checking health at:", `${API_BASE}/health`);
        const health = await fetch(`${API_BASE}/health`);
        if (!health.ok) throw new Error("Status: " + health.status);
        console.log("Health check passed.");
    } catch (e) {
        console.error("Health check failed:", e);
        document.body.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-slate-900 text-white p-10">
                <div class="text-center max-w-md">
                    <div class="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                        <i class="fa-solid fa-server text-3xl"></i>
                    </div>
                    <h1 class="text-3xl font-black mb-4">CMS Backend Offline</h1>
                    <p class="text-slate-400 font-medium leading-relaxed mb-8">The Command Center API is not responding. Please run <code class="bg-slate-800 px-2 py-1 rounded text-pink-400">npm start</code> in your terminal.</p>
                    <button onclick="location.reload()" class="bg-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Retry Connection</button>
                </div>
            </div>
        `;
        document.body.classList.remove('opacity-0');
        return;
    }

    // 2. Auth Check
    const token = localStorage.getItem('mindfull_admin_token');
    const userStr = localStorage.getItem('mindfull_admin_user');

    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            console.log("Active session found for:", user.email);
            setupDashboard(user);
        } catch (e) {
            console.error("Session corruption:", e);
            logout();
        }
    } else {
        console.log("No active session. Showing login.");
        document.getElementById('login-modal')?.classList.remove('hidden');
        document.body.classList.remove('opacity-0');
    }
}

function setupDashboard(user) {
    document.getElementById('login-modal')?.classList.add('hidden');
    const nameEl = document.getElementById('admin-name');
    const roleEl = document.getElementById('admin-role');
    const avatarEl = document.getElementById('admin-avatar');
    
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
    if (avatarEl) avatarEl.src = `https://i.pravatar.cc/100?u=${user.email}`;
    
    document.body.classList.remove('opacity-0');
    window.showSection('dashboard');
}

// --- Dashboard Sub-functions (with safety) ---
async function loadDashboardData() {
    console.log("Loading dashboard data...");
    const stats = await api('/admin/stats');
    if (stats) {
        setVal('stat-users', stats.totalUsers);
        setVal('stat-views', stats.totalViews);
        setVal('stat-rating', stats.averageRating);
        setVal('stat-new-leads', stats.newInquiries);
    }
    const [popular, comments, activity, trends] = await Promise.all([
        api('/admin/popular'), api('/admin/comments'), api('/admin/activity'), api('/admin/analytics/trends')
    ]);
    if (activity) renderActivity(activity);
    if (popular) renderPopular(popular);
    if (comments) renderComments(comments);
    if (trends) renderTrends(trends);
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const csrf = getCookie('XSRF-TOKEN');
    if (csrf) headers['x-xsrf-token'] = csrf;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
        if (res.status === 401 || res.status === 403) {
            const data = await res.json();
            if (data.message !== 'CSRF token mismatch') { logout(); return null; }
        }
        return res.json();
    } catch (e) { console.error(`API Error ${endpoint}:`, e); return null; }
}

// ... Additional render functions (Activity, Popular, etc.) remain as in v3.3 ...
// Included basic ones to ensure the page doesn't crash on load
function renderActivity(items) {
    const el = document.getElementById('activity-list');
    if (!el) return;
    el.innerHTML = items.map(i => `
        <div class="py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full ${i.activity_type === 'inquiry' ? 'bg-amber-500' : 'bg-indigo-500'}"></div>
                <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-slate-400 font-medium text-xs ml-1">${i.event}</span></p>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
        </div>
    `).join('') || '<p class="py-4 text-xs italic text-slate-400">No pulse detected.</p>';
}

function renderPopular(items) {
    const el = document.getElementById('popular-list');
    if (el) el.innerHTML = items.map(i => `<div class="p-3 bg-slate-50 rounded-lg text-xs font-bold">${i.slug}</div>`).join('');
}

function renderComments(items) {
    const el = document.getElementById('comments-list');
    if (el) el.innerHTML = items.map(i => `<div class="text-xs text-slate-500">${i.content}</div>`).join('');
}

function renderTrends(data) {
    console.log("Trends chart rendering not fully implemented in debug script");
}

async function loadMedia() { console.log("Media load called"); }
async function loadUsers() { console.log("Users load called"); }
async function loadInquiries() { console.log("Inquiries load called"); }
async function loadCollection(n) { console.log("Collection load called:", n); }

// Boot
window.onload = init;
