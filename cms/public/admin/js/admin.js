/**
 * MindFull CMS / CRM Dashboard Logic v3.0
 * Features: Analytics, Media, User Management, Content Editor
 */

let currentUserId = null;
let currentCollection = null;
let currentSlug = null;
let simplemde = null;
let trendsChart = null;
const API_BASE = '/api';

// --- Initialization ---
async function init() {
    const token = localStorage.getItem('mindfull_admin_token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('mindfull_admin_user') || '{}');
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

    simplemde = new SimpleMDE({ 
        element: document.getElementById("editor-textarea"),
        spellChecker: false,
        autosave: { enabled: true, uniqueId: "mindfull-editor-v3", delay: 1000 }
    });
}

// --- API ---
async function fetchCMS(endpoint, method = 'GET', body = null) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('mindfull_admin_token')}`, 
            'Content-Type': 'application/json',
            'x-xsrf-token': getCookie('XSRF-TOKEN')
        },
        body: body ? JSON.stringify(body) : null
    });
    if (res.status === 401 || res.status === 403) {
        const data = await res.json();
        if (data.message !== 'CSRF token mismatch') logout();
    }
    return res.json();
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('mindfull_admin_token', data.token);
        localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
        location.reload();
    } else { alert('Invalid credentials'); }
}

function logout() { localStorage.clear(); location.reload(); }

// --- Dashboard & Analytics ---
async function loadDashboardData() {
    const [stats, popular, comments, activity, trends] = await Promise.all([
        fetchCMS('/admin/stats'), fetchCMS('/admin/popular'), 
        fetchCMS('/admin/comments'), fetchCMS('/admin/activity'),
        fetchCMS('/admin/analytics/trends')
    ]);
    
    document.getElementById('stat-users').textContent = stats.totalUsers;
    document.getElementById('stat-views').textContent = stats.totalViews;
    document.getElementById('stat-rating').textContent = stats.averageRating;
    document.getElementById('stat-new-leads').textContent = stats.newInquiries;
    
    renderActivity(activity || []);
    renderPopular(popular || []);
    renderComments(comments || []);
    initTrendsChart(trends || []);
}

function initTrendsChart(data) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    if (trendsChart) trendsChart.destroy();
    
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'New Registrations',
                data: data.map(d => d.count),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
        }
    });
}

// --- Content ---
async function loadCollection(name) {
    currentCollection = name;
    const items = await fetchCMS(`/content/${name}`);
    document.getElementById('collection-view').innerHTML = items.map(item => `
        <div class="admin-card p-6 flex flex-col h-full group">
            <h4 class="font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">${item.data.title || item.slug}</h4>
            <p class="text-xs text-slate-500 line-clamp-2 mb-6">${item.body.substring(0, 100)}...</p>
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
    simplemde.value(entry.body);
    
    const fmFields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fmFields.map(f => `
        <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">${f}</label>
            <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold">
        </div>
    `).join('');
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
    document.getElementById('media-grid').innerHTML = items.map(item => `
        <div class="admin-card p-2 relative group">
            <img src="${item.url}" class="w-full aspect-square object-cover rounded-xl">
            <button onclick="deleteMedia('${item.name}')" class="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-trash"></i></button>
            <p class="text-[8px] font-bold text-slate-400 mt-2 truncate px-1">${item.name}</p>
        </div>
    `).join('');
}

function handleMediaUpload(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
        await fetchCMS('/media/upload', 'POST', { name: file.name, data: reader.result });
        loadMedia();
    };
    reader.readAsDataURL(file);
}

async function deleteMedia(name) {
    if (confirm('Delete image?')) {
        await fetchCMS(`/media/${name}`, 'DELETE');
        loadMedia();
    }
}

// --- Users ---
async function loadUsers() {
    const plan = document.getElementById('filter-plan').value;
    const role = document.getElementById('filter-role').value;
    const users = await fetchCMS(`/admin/users?plan=${plan}&role=${role}`);
    document.getElementById('users-table-body').innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50">
            <td class="px-8 py-6 font-bold text-sm text-slate-900">${u.name}<br><span class="text-[10px] text-slate-400">${u.email}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">${u.plan}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase">${u.role}</span></td>
            <td class="px-8 py-6 text-right"><button onclick="promoteUser(${u.id})" class="text-indigo-600 font-black text-[10px] uppercase">Promote</button></td>
        </tr>
    `).join('');
}

async function promoteUser(id) {
    const role = prompt('Enter new role (user, therapist, admin):');
    if (role) {
        await fetchCMS(`/admin/users/${id}`, 'PATCH', { role });
        loadUsers();
    }
}

// --- Section Control ---
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

function renderActivity(items) {
    document.getElementById('activity-list').innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
            <div class="flex items-center gap-4">
                <span class="pulse-dot ${item.activity_type === 'inquiry' ? 'pulse-inquiry' : 'pulse-interaction'}"></span>
                <p class="text-sm font-bold text-slate-900">${item.user_name} <span class="text-slate-400 font-medium text-xs ml-1">${item.event}</span></p>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `).join('') || '<p class="text-slate-400 text-sm italic p-4">No recent activity.</p>';
}

function renderPopular(items) {
    document.getElementById('popular-list').innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all border border-slate-50">
            <p class="text-xs font-bold text-slate-700 truncate">${item.slug}</p>
            <span class="text-[10px] font-black text-emerald-600">${item.views} views</span>
        </div>
    `).join('');
}

function renderComments(items) {
    document.getElementById('comments-list').innerHTML = items.map(item => `
        <div class="border-l-4 border-indigo-100 pl-4 py-1">
            <p class="text-[10px] font-black text-indigo-600 uppercase mb-1">${item.user_name}</p>
            <p class="text-xs font-medium text-slate-600 line-clamp-2">${item.content}</p>
        </div>
    `).join('') || '<p class="text-slate-400 text-xs italic">No comments yet.</p>';
}

window.onload = init;
