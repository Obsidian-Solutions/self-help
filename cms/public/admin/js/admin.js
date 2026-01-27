/**
 * MindFull CMS / CRM Dashboard Logic v3.1
 * Features: Hardened Auth, Connection Testing, Wagtail Style
 */

let currentUserId = null;
let currentCollection = null;
let currentSlug = null;
let simplemde = null;
let trendsChart = null;
const API_BASE = '/api';

// --- Initialization ---
async function init() {
    console.log("Initializing Command Center...");
    
    // 1. Check if server is reachable
    try {
        const health = await fetch(`${API_BASE}/health`);
        if (!health.ok) throw new Error("Offline");
        console.log("CMS Server: Online");
    } catch (e) {
        console.error("CMS Server: Offline. Make sure to run 'npm start' in the cms folder.");
        document.body.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-slate-900 text-white p-10">
                <div class="text-center max-w-md">
                    <div class="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
                        <i class="fa-solid fa-server text-3xl"></i>
                    </div>
                    <h1 class="text-3xl font-black mb-4">CMS Offline</h1>
                    <p class="text-slate-400 font-medium leading-relaxed mb-8">The backend server is not responding. Please ensure you have started the CMS by running <code class="bg-slate-800 px-2 py-1 rounded text-pink-400">npm start</code> in your terminal.</p>
                    <button onclick="location.reload()" class="bg-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Retry Connection</button>
                </div>
            </div>
        `;
        document.body.classList.remove('opacity-0');
        return;
    }

    const token = localStorage.getItem('mindfull_admin_token');
    if (token) {
        const userStr = localStorage.getItem('mindfull_admin_user');
        if (!userStr) { logout(); return; }
        
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'therapist') {
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('admin-name').textContent = user.name;
            document.body.classList.remove('opacity-0');
            showSection('dashboard');
        } else { logout(); }
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
        document.body.classList.remove('opacity-0');
    }

    if (document.getElementById("editor-textarea")) {
        simplemde = new SimpleMDE({ 
            element: document.getElementById("editor-textarea"),
            spellChecker: false,
            autosave: { enabled: true, uniqueId: "mindfull-editor-v3", delay: 1000 }
        });
    }
}

// --- API ---
async function fetchCMS(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        'x-xsrf-token': getCookie('XSRF-TOKEN')
    };

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
        console.error('Fetch error:', e);
        return null;
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('auth-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('mindfull_admin_token', data.token);
            localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
            location.reload();
        } else {
            alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
    } catch (err) {
        alert('Authentication error. Is the CMS server running?');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function logout() { localStorage.clear(); location.reload(); }

// --- Dashboard & Analytics ---
async function loadDashboardData() {
    try {
        const [stats, popular, comments, activity, trends] = await Promise.all([
            fetchCMS('/admin/stats'), fetchCMS('/admin/popular'), 
            fetchCMS('/admin/comments'), fetchCMS('/admin/activity'),
            fetchCMS('/admin/analytics/trends')
        ]);
        
        if (stats) {
            document.getElementById('stat-users').textContent = stats.totalUsers;
            document.getElementById('stat-views').textContent = stats.totalViews;
            document.getElementById('stat-rating').textContent = stats.averageRating;
            document.getElementById('stat-new-leads').textContent = stats.newInquiries;
        }
        
        renderActivity(activity || []);
        renderPopular(popular || []);
        renderComments(comments || []);
        initTrendsChart(trends || []);
    } catch (e) {
        console.warn("Dashboard data load failed");
    }
}

function initTrendsChart(data) {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (trendsChart) trendsChart.destroy();
    
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Members',
                data: data.map(d => d.count),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
        }
    });
}

// --- Content ---
async function loadCollection(name) {
    currentCollection = name;
    const items = await fetchCMS(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !items) return;

    container.innerHTML = items.map(item => `
        <div class="glass-card p-6 flex flex-col h-full group">
            <h4 class="font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">${item.data.title || item.slug}</h4>
            <p class="text-xs text-slate-500 line-clamp-2 mb-6">${item.body ? item.body.substring(0, 100) : ''}...</p>
            <div class="mt-auto flex gap-2">
                <button onclick="editContent('${name}', '${item.slug}')" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Edit</button>
                <button onclick="deleteContent('${name}', '${item.slug}')" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `).join('');
}

async function editContent(collection, slug) {
    currentCollection = collection;
    currentSlug = slug;
    showSection('editor');
    const entry = await fetchCMS(`/content/${collection}/${slug}`);
    if (entry) {
        simplemde.value(entry.body);
        const fmFields = ['title', 'description', 'category', 'illustration'];
        document.getElementById('frontmatter-fields').innerHTML = fmFields.map(f => `
            <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">${f}</label>
                <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold">
            </div>
        `).join('');
    }
}

async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
        data[f] = document.getElementById('fm-' + f).value;
    });
    const body = simplemde.value();
    await fetchCMS(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body });
    alert('Saved!');
    showSection('content');
}

// --- Media ---
async function loadMedia() {
    const items = await fetchCMS('/media');
    const container = document.getElementById('media-grid');
    if (!container || !items) return;

    container.innerHTML = items.map(item => `
        <div class="glass-card p-2 relative group">
            <img src="${item.url}" class="w-full aspect-square object-cover rounded-xl">
            <button onclick="deleteMedia('${item.name}')" class="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-trash"></i></button>
            <p class="text-[8px] font-bold text-slate-400 mt-2 truncate px-1">${item.name}</p>
        </div>
    `).join('');
}

function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        await fetchCMS('/media/upload', 'POST', { name: file.name, data: reader.result });
        loadMedia();
    };
    reader.readAsDataURL(file);
}

// --- Users ---
async function loadUsers() {
    const plan = document.getElementById('filter-plan').value;
    const users = await fetchCMS(`/admin/users?plan=${plan}`);
    const container = document.getElementById('users-table-body');
    if (!container || !users) return;

    container.innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50">
            <td class="px-8 py-6 font-bold text-sm text-slate-900">${u.name}<br><span class="text-[10px] text-slate-400">${u.email}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">${u.plan}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase">${u.role}</span></td>
            <td class="px-8 py-6 text-right"><button onclick="promoteUser(${u.id})" class="text-indigo-600 font-black text-[10px] uppercase">Promote</button></td>
        </tr>
    `).join('');
}

// --- Section Control ---
function showSection(id) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');
    document.getElementById('nav-btn-' + (id === 'editor' ? 'content' : id))?.classList.add('active');

    // Breadcrumbs
    document.getElementById('breadcrumb-active').textContent = id.charAt(0).toUpperCase() + id.slice(1);

    if (id === 'dashboard') loadDashboardData();
    if (id === 'content') loadCollection('posts');
    if (id === 'media') loadMedia();
    if (id === 'users') loadUsers();
    if (id === 'inquiries') loadInquiries();
}

function renderActivity(items) {
    const el = document.getElementById('activity-list');
    if (!el) return;
    el.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-4 hover:bg-slate-50 transition-all">
            <div class="flex items-center gap-4">
                <span class="pulse-dot ${item.activity_type === 'inquiry' ? 'pulse-inquiry' : 'pulse-interaction'}"></span>
                <p class="text-sm font-bold text-slate-900">${item.user_name} <span class="text-slate-400 font-medium text-xs ml-1">${item.event}</span></p>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(item.created_at).toLocaleTimeString()}</span>
        </div>
    `).join('') || '<p class="p-4 text-slate-400 text-xs italic">No activity.</p>';
}

function renderPopular(items) {
    const el = document.getElementById('popular-list');
    if (!el) return;
    el.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <p class="text-xs font-bold text-slate-700 truncate">${item.slug}</p>
            <span class="text-[10px] font-black text-emerald-600">${item.views}</span>
        </div>
    `).join('');
}

function renderComments(items) {
    const el = document.getElementById('comments-list');
    if (!el) return;
    el.innerHTML = items.map(item => `
        <div class="border-l-4 border-indigo-100 pl-4 py-1">
            <p class="text-[10px] font-black text-indigo-600 mb-1">${item.user_name}</p>
            <p class="text-xs font-medium text-slate-600 line-clamp-2">${item.content}</p>
        </div>
    `).join('');
}

async function loadInquiries() {
    const leads = await fetchCMS('/admin/inquiries');
    const el = document.getElementById('inquiries-table-body');
    if (!el || !leads) return;
    el.innerHTML = leads.map(l => `
        <tr>
            <td class="px-8 py-6 font-bold text-sm text-slate-900">${l.name}<br><span class="text-[10px] font-medium text-slate-400">${l.email}</span></td>
            <td class="px-8 py-6 text-sm font-medium text-slate-600">${l.subject}</td>
            <td class="px-8 py-6 text-right">
                <span class="px-2 py-1 rounded text-[10px] font-black uppercase ${l.status === 'new' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}">${l.status}</span>
            </td>
        </tr>
    `).join('');
}

window.onload = init;