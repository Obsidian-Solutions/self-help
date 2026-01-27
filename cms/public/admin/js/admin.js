/**
 * MindFull Command Center v3.3
 * Bulletproof Auth & CMS Logic
 */

const API_BASE = window.location.origin + '/api';
let simplemde = null;
let trendsChart = null;
let currentCollection = 'posts';
let currentSlug = null;

// --- Core Helper: API Fetcher ---
async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
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

// --- Bulletproof Login ---
async function handleLogin() {
    console.log("Login sequence initiated...");
    
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const btn = document.getElementById('auth-btn');
    
    if (!emailEl.value || !passwordEl.value) {
        alert("Please enter both email and password.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Authenticating...';

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailEl.value, password: passwordEl.value })
        });
        
        const data = await res.json();
        
        if (res.ok && data.token) {
            console.log("Auth success. Storing tokens...");
            localStorage.setItem('mindfull_admin_token', data.token);
            localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
            // Force a clean reload to dashboard state
            window.location.href = window.location.pathname;
        } else {
            alert("Auth Failed: " + (data.message || "Check credentials"));
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (err) {
        console.error("Critical Connection Error:", err);
        alert("CMS Server Unreachable. Please ensure 'npm start' is running in the /cms folder.");
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function logout() {
    localStorage.clear();
    window.location.reload();
}

// --- Init & State ---
async function init() {
    console.log("MindFull CMS Initializing...");
    
    try {
        const health = await fetch(`${API_BASE}/health`);
        if (!health.ok) throw new Error();
    } catch (e) {
        document.body.innerHTML = `<div class="flex items-center justify-center min-h-screen bg-slate-900 text-white"><div class="text-center"><h1 class="text-2xl font-bold mb-4">CMS Backend Offline</h1><button onclick="location.reload()" class="bg-indigo-600 px-6 py-2 rounded-lg">Retry Connection</button></div></div>`;
        document.body.classList.remove('opacity-0');
        return;
    }

    const token = localStorage.getItem('mindfull_admin_token');
    const userStr = localStorage.getItem('mindfull_admin_user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        setupDashboard(user);
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
}

// --- Sections ---
function showSection(id) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');
    document.getElementById('nav-btn-' + (id === 'editor' ? 'content' : id))?.classList.add('active');

    document.getElementById('breadcrumb-active').textContent = id.charAt(0).toUpperCase() + id.slice(1);

    if (id === 'dashboard') loadDashboardData();
    if (id === 'content') loadCollection(currentCollection);
    if (id === 'media') loadMedia();
    if (id === 'users') loadUsers();
    if (id === 'inquiries') loadInquiries();
}

async function loadDashboardData() {
    const stats = await api('/admin/stats');
    if (stats) {
        document.getElementById('stat-users').textContent = stats.totalUsers;
        document.getElementById('stat-views').textContent = stats.totalViews;
        document.getElementById('stat-rating').textContent = stats.averageRating;
        document.getElementById('stat-new-leads').textContent = stats.newInquiries;
    }
    const [popular, comments, activity, trends] = await Promise.all([
        api('/admin/popular'), api('/admin/comments'), api('/admin/activity'), api('/admin/analytics/trends')
    ]);
    if (activity) renderActivity(activity);
    if (popular) renderPopular(popular);
    if (comments) renderComments(comments);
    if (trends) renderTrends(trends);
}

function renderActivity(items) {
    document.getElementById('activity-list').innerHTML = items.map(i => `
        <div class="py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full ${i.activity_type === 'inquiry' ? 'bg-amber-500' : 'bg-indigo-500'}"></div>
                <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-slate-400 font-medium text-xs ml-1">${i.event}</span></p>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
        </div>
    `).join('') || '<p class="py-4 text-xs italic text-slate-400">No pulse detected.</p>';
}

async function loadCollection(name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    container.innerHTML = items.map(item => `
        <div class="glass-card p-6 flex flex-col group h-full hover:border-indigo-200 transition-all">
            <h4 class="font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">${item.data.title || item.slug}</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">${item.data.category || 'General'}</p>
            <div class="mt-auto flex gap-2">
                <button onclick="editEntry('${name}', '${item.slug}')" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Edit</button>
            </div>
        </div>
    `).join('');
}

async function editEntry(collection, slug) {
    currentSlug = slug;
    showSection('editor');
    const entry = await api(`/content/${collection}/${slug}`);
    if (!simplemde) simplemde = new SimpleMDE({ element: document.getElementById("editor-textarea") });
    simplemde.value(entry.body);
    
    const fmFields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fmFields.map(f => `
        <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">${f}</label>
            <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10">
        </div>
    `).join('');
}

async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
        data[f] = document.getElementById('fm-' + f).value;
    });
    const body = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body });
    if (res) {
        alert("Published successfully!");
        showSection('content');
    }
}

async function loadMedia() {
    const items = await api('/media');
    document.getElementById('media-grid').innerHTML = items.map(item => `
        <div class="glass-card p-2 relative group overflow-hidden">
            <img src="${item.url}" class="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform">
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button onclick="deleteMedia('${item.name}')" class="p-2 bg-red-500 text-white rounded-lg"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function loadUsers() {
    const plan = document.getElementById('filter-plan').value;
    const users = await api(`/admin/users?plan=${plan}`);
    document.getElementById('users-table-body').innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-8 py-6 font-bold text-sm text-slate-900">${u.name}<br><span class="text-[10px] text-slate-400 font-medium">${u.email}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">${u.plan}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">${u.role}</span></td>
            <td class="px-8 py-6 text-right"><button onclick="viewDeepDive(${u.id})" class="text-indigo-600 font-black text-[10px] uppercase">Profile &rarr;</button></td>
        </tr>
    `).join('');
}

async function loadInquiries() {
    const leads = await api('/admin/inquiries');
    document.getElementById('inquiries-table-body').innerHTML = leads.map(l => `
        <tr class="${l.status === 'new' ? 'bg-indigo-50/20' : ''}">
            <td class="px-8 py-6 font-bold text-sm text-slate-900">${l.name}<br><span class="text-[10px] text-slate-400">${l.email}</span></td>
            <td class="px-8 py-6 text-sm font-medium text-slate-600">${l.subject}</td>
            <td class="px-8 py-6 text-right">
                <span class="px-2 py-1 rounded text-[10px] font-black uppercase ${l.status === 'new' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}">${l.status}</span>
            </td>
        </tr>
    `).join('');
}

function renderTrends(data) {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (trendsChart) trendsChart.destroy();
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                data: data.map(d => d.count),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } }
        }
    });
}

window.onload = init;