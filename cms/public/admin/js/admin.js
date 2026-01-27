/**
 * MindFull Command Center v3.5
 * Dynamic UI Controller
 */

let simplemde = null;
let currentCollection = 'posts';
let currentSlug = null;

// --- API Helper ---
async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (res.status === 401) { logout(); return null; }
    return res.json();
}

// --- Initialization ---
function init() {
    console.log("Dashboard Controller Init");
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
        
        showSection('dashboard');
    }
}

// --- UI Navigation ---
window.showSection = function(id) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('text-white', 'bg-slate-800'));
    
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');
    
    const btn = document.getElementById('nav-btn-' + (id === 'editor' ? 'content' : id));
    if (btn) {
        btn.classList.add('text-white', 'bg-slate-800');
    }

    if (id === 'dashboard') loadDashboard();
    if (id === 'content') loadCollection(currentCollection);
    if (id === 'users') loadUsers();
    if (id === 'inquiries') loadInquiries();
}

async function loadDashboard() {
    const stats = await api('/admin/stats');
    if (stats) {
        document.getElementById('stat-users').textContent = stats.totalUsers;
        document.getElementById('stat-views').textContent = stats.totalViews;
        document.getElementById('stat-rating').textContent = stats.averageRating;
        document.getElementById('stat-new-leads').textContent = stats.newInquiries;
    }
    const [activity, popular] = await Promise.all([api('/admin/activity'), api('/admin/popular')]);
    if (activity) {
        document.getElementById('activity-list').innerHTML = activity.map(i => `
            <div class="flex items-center justify-between py-3">
                <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-xs text-slate-400 font-medium">${i.event}</span></p>
                <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }
}

async function loadCollection(name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    document.getElementById('collection-view').innerHTML = items.map(item => `
        <div class="glass-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all">
            <h4 class="font-black text-slate-900 mb-2">${item.data.title || item.slug}</h4>
            <div class="mt-auto pt-4 flex gap-2">
                <button onclick="editEntry('${name}', '${item.slug}')" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Edit</button>
            </div>
        </div>
    `).join('');
}

window.editEntry = async function(collection, slug) {
    currentSlug = slug;
    showSection('editor');
    const entry = await api(`/content/${collection}/${slug}`);
    if (!simplemde) simplemde = new SimpleMDE({ element: document.getElementById("editor-textarea") });
    simplemde.value(entry.body);
    
    const fmFields = ['title', 'description', 'category'];
    document.getElementById('frontmatter-fields').innerHTML = fmFields.map(f => `
        <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">${f}</label>
            <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold text-slate-700">
        </div>
    `).join('');
}

window.logout = function() {
    localStorage.clear();
    location.reload();
}

window.onload = init;