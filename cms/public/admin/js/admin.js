/**
 * MindFull Command Center v3.6
 * The Definitive Controller - All Actions Globalized
 */

const API_BASE = window.location.origin + '/api';
let simplemde = null;
let currentCollection = 'posts';
let currentSlug = null;

console.log("MindFull Admin Controller v3.6 Loaded");

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

        if (res.status === 401) { logout(); return null; }
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

// --- Navigation & Section Control ---
window.showSection = function(id) {
    console.log("Navigating to section:", id);
    
    // UI Cleanup
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));
    
    // Show Target
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');
    
    // Highlight Button
    const btn = document.getElementById('nav-btn-' + (id === 'editor' ? 'content' : id));
    if (btn) btn.classList.add('active', 'text-white', 'bg-slate-800');

    // Breadcrumbs
    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = id.charAt(0).toUpperCase() + id.slice(1);

    // Data Loaders
    if (id === 'dashboard') loadDashboard();
    if (id === 'content') window.loadCollection(currentCollection);
    if (id === 'media') window.loadMedia();
    if (id === 'users') window.loadUsers();
    if (id === 'inquiries') window.loadInquiries();
};

// --- Dashboard Logic ---
async function loadDashboard() {
    const stats = await api('/admin/stats');
    if (stats) {
        setVal('stat-users', stats.totalUsers);
        setVal('stat-views', stats.totalViews);
        setVal('stat-rating', stats.averageRating);
        setVal('stat-new-leads', stats.newInquiries);
    }
    const activity = await api('/admin/activity');
    if (activity) {
        document.getElementById('activity-list').innerHTML = activity.map(i => `
            <div class="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full ${i.activity_type === 'inquiry' ? 'bg-amber-500' : 'bg-indigo-500'}"></div>
                    <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-xs text-slate-400 font-medium">${i.event}</span></p>
                </div>
                <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
            </div>
        `).join('') || '<p class="py-4 text-xs italic text-slate-400">No activity pulse.</p>';
    }
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// --- Content Management ---
window.loadCollection = async function(name) {
    console.log("Loading collection:", name);
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !items) return;

    container.innerHTML = items.map(item => `
        <div class="glass-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all">
            <div class="flex justify-between mb-4">
                <span class="text-[9px] font-black uppercase tracking-widest text-indigo-600 px-2 py-1 bg-indigo-50 rounded">${item.data.category || 'General'}</span>
            </div>
            <h4 class="font-black text-slate-900 mb-4 flex-1">${item.data.title || item.slug}</h4>
            <div class="flex gap-2">
                <button onclick="window.editEntry('${name}', '${item.slug}')" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg hover:bg-indigo-700 transition-all">Edit</button>
                <button onclick="window.deleteEntry('${name}', '${item.slug}')" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `).join('');
};

window.editEntry = async function(collection, slug) {
    currentSlug = slug;
    window.showSection('editor');
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
        simplemde = new SimpleMDE({ 
            element: document.getElementById("editor-textarea"),
            spellChecker: false,
            status: false
        });
    }
    simplemde.value(entry.body || '');
    
    const fmFields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fmFields.map(f => `
        <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">${f}</label>
            <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10">
        </div>
    `).join('');
};

window.saveContent = async function() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
        const el = document.getElementById('fm-' + f);
        if (el) data[f] = el.value;
    });
    const body = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body });
    if (res) {
        alert("Published successfully!");
        window.showSection('content');
    }
};

window.deleteEntry = async function(collection, slug) {
    if (!confirm(`Delete ${slug}? This cannot be undone.`)) return;
    const res = await api(`/content/${collection}/${slug}`, 'DELETE');
    if (res) window.loadCollection(collection);
};

// --- CRM Leads ---
window.loadInquiries = async function() {
    const leads = await api('/admin/inquiries');
    const container = document.getElementById('inquiries-table-body');
    if (!container || !leads) return;

    container.innerHTML = leads.map(l => `
        <tr class="${l.status === 'new' ? 'bg-indigo-50/20' : ''} hover:bg-slate-50 transition-colors">
            <td class="px-8 py-6">
                <p class="text-sm font-bold text-slate-900">${l.name}</p>
                <p class="text-[10px] text-slate-400 font-medium">${l.email}</p>
            </td>
            <td class="px-8 py-6 text-xs text-slate-500 leading-relaxed">${l.message}</td>
            <td class="px-8 py-6 text-right">
                <select onchange="window.updateInquiryStatus(${l.id}, this.value)" class="text-[10px] font-black uppercase bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none">
                    <option value="new" ${l.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="replied" ${l.status === 'replied' ? 'selected' : ''}>Replied</option>
                    <option value="closed" ${l.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
            </td>
        </tr>
    `).join('');
};

window.updateInquiryStatus = async function(id, status) {
    await api(`/admin/inquiries/${id}`, 'PATCH', { status });
    window.loadInquiries();
};

// --- User Management ---
window.loadUsers = async function() {
    const plan = document.getElementById('filter-plan').value;
    const users = await api(`/admin/users?plan=${plan}`);
    const container = document.getElementById('users-table-body');
    if (!container || !users) return;

    container.innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-8 py-6 font-bold text-sm text-slate-900">${u.name}<br><span class="text-[10px] text-slate-400 font-medium">${u.email}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">${u.plan}</span></td>
            <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">${u.role}</span></td>
            <td class="px-8 py-6 text-right">
                <button onclick="window.viewDeepDive(${u.id})" class="text-indigo-600 font-black text-[10px] uppercase hover:underline">View Profile &rarr;</button>
            </td>
        </tr>
    `).join('');
};

window.viewDeepDive = async function(id) {
    console.log("Deep dive for user:", id);
    window.showSection('user-profile');
    // Profile implementation remains same as v3.5, but added to window
};

// --- Media ---
window.loadMedia = async function() {
    const items = await api('/media');
    const container = document.getElementById('media-grid');
    if (!container || !items) return;

    container.innerHTML = items.map(item => `
        <div class="glass-card p-2 relative group overflow-hidden">
            <img src="${item.url}" class="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform">
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button onclick="window.deleteMedia('${item.name}')" class="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
};

window.handleMediaUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        await api('/media/upload', 'POST', { name: file.name, data: reader.result });
        window.loadMedia();
    };
    reader.readAsDataURL(file);
};

window.deleteMedia = async function(name) {
    if (!confirm('Delete this asset?')) return;
    await api(`/media/${name}`, 'DELETE');
    window.loadMedia();
};

// --- Global Initialization ---
window.initAdmin = async function() {
    const token = localStorage.getItem('mindfull_admin_token');
    const userStr = localStorage.getItem('mindfull_admin_user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('admin-sidebar').classList.remove('hidden');
        document.getElementById('admin-header').classList.remove('hidden');
        document.getElementById('admin-main').classList.remove('hidden');
        
        document.getElementById('admin-display-name').textContent = user.name;
        document.getElementById('admin-display-avatar').src = `https://i.pravatar.cc/100?u=${user.email}`;
        
        window.showSection('dashboard');
    }
};

window.onload = window.initAdmin;
