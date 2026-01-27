/**
 * MindFull CMS / CRM Dashboard Logic
 * Version: 2.0 (Hardened & Modular)
 */

let currentUserId = null;
const API_BASE = '/api';

// --- Initialization ---
async function init() {
    const token = localStorage.getItem('mindfull_admin_token');
    if (token) {
        const userStr = localStorage.getItem('mindfull_admin_user');
        if (!userStr) { logout(); return; }
        
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'therapist') {
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('admin-name').textContent = user.name;
            document.getElementById('admin-role').textContent = user.role === 'admin' ? 'System Administrator' : 'Platform Therapist';
            document.getElementById('admin-avatar').src = `https://i.pravatar.cc/150?u=${user.email}`;
            
            document.body.classList.remove('opacity-0');
            loadDashboardData();
            
            // Auto-refresh every 60s
            setInterval(loadDashboardData, 60000);
        } else {
            logout();
        }
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
        document.body.classList.remove('opacity-0');
    }
}

// --- Auth ---
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('auth-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Authenticating...';

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: document.getElementById('email').value, 
                password: document.getElementById('password').value 
            })
        });
        
        const data = await res.json();
        if (res.ok && (data.user.role === 'admin' || data.user.role === 'therapist')) {
            localStorage.setItem('mindfull_admin_token', data.token);
            localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
            location.reload();
        } else {
            alert(data.message || 'Access denied.');
        }
    } catch (err) {
        alert('Connection failed. Is the CMS server running?');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function logout() {
    localStorage.removeItem('mindfull_admin_token');
    localStorage.removeItem('mindfull_admin_user');
    location.reload();
}

// --- API Wrapper ---
async function fetchAdmin(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        'x-xsrf-token': getCookie('XSRF-TOKEN')
    };

    try {
        const res = await fetch(`${API_BASE}/admin${endpoint}`, {
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

// --- Dashboard Loading ---
async function loadDashboardData() {
    const [stats, popular, comments, activity] = await Promise.all([
        fetchAdmin('/stats'), 
        fetchAdmin('/popular'), 
        fetchAdmin('/comments'),
        fetchAdmin('/activity')
    ]);
    
    if (!stats) return;

    updateStat('stat-users', stats.totalUsers);
    updateStat('stat-views', stats.totalViews);
    updateStat('stat-rating', stats.averageRating);
    updateStat('stat-new-leads', stats.newInquiries);
    
    // Notification Badge
    const badge = document.getElementById('notif-badge');
    if (stats.newInquiries > 0) {
        badge.textContent = stats.newInquiries;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    renderPopular(popular || []);
    renderComments(comments || []);
    renderActivity(activity || []);
}

function updateStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// --- Renderers ---

function renderActivity(items) {
    const container = document.getElementById('activity-list');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="p-10 text-center text-slate-400 font-bold italic">No recent activity</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
            <div class="flex items-center gap-4">
                <span class="pulse-dot ${item.activity_type === 'inquiry' ? 'pulse-inquiry' : 'pulse-interaction'}"></span>
                <div>
                    <p class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        ${item.user_name} 
                        <span class="text-slate-400 font-medium text-[10px] uppercase tracking-widest ml-2">${item.event}</span>
                    </p>
                    <p class="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">${item.metadata || ''}</p>
                </div>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase shrink-0">${formatTime(item.created_at)}</span>
        </div>
    `).join('');
}

function renderPopular(items) {
    const container = document.getElementById('popular-list');
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-4 bg-slate-50/30 rounded-xl border border-slate-100 hover:shadow-sm transition-all">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center text-[8px] font-black border border-slate-100">${item.slug.substring(0,2).toUpperCase()}</div>
                <p class="text-xs font-bold text-slate-700 truncate max-w-[80px]">${item.slug}</p>
            </div>
            <span class="text-[10px] font-black text-emerald-600">${item.views} <i class="fa-solid fa-eye ml-1"></i></span>
        </div>
    `).join('');
}

function renderComments(items) {
    const container = document.getElementById('comments-list');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs italic text-center py-10">No discussion yet.</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="border-l-4 border-indigo-100 pl-4 py-1 hover:border-indigo-500 transition-colors">
            <p class="text-[10px] font-black text-indigo-600 uppercase mb-1">${item.user_name}</p>
            <p class="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">${item.content}</p>
        </div>
    `).join('');
}

async function loadInquiries() {
    const leads = await fetchAdmin('/inquiries');
    const container = document.getElementById('inquiries-table-body');
    if (!container) return;

    container.innerHTML = leads.map(l => `
        <tr class="${l.status === 'new' ? 'bg-indigo-50/20' : ''} hover:bg-slate-50 transition-colors">
            <td class="px-8 py-6">
                <p class="text-sm font-bold text-slate-900">${l.name}</p>
                <p class="text-xs text-slate-500">${l.email}</p>
            </td>
            <td class="px-8 py-6 text-sm font-medium text-slate-600">${l.subject}</td>
            <td class="px-8 py-6 text-xs text-slate-400 max-w-xs leading-relaxed">${l.message}</td>
            <td class="px-8 py-6 text-right">
                <select onchange="updateInquiryStatus(${l.id}, this.value)" class="text-[10px] font-black uppercase bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-indigo-600">
                    <option value="new" ${l.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="replied" ${l.status === 'replied' ? 'selected' : ''}>Replied</option>
                    <option value="closed" ${l.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
            </td>
        </tr>
    `).join('');
}

async function loadUsers() {
    const plan = document.getElementById('filter-plan').value;
    const role = document.getElementById('filter-role').value;
    let endpoint = '/users?';
    if (plan) endpoint += `plan=${plan}&`;
    if (role) endpoint += `role=${role}`;

    const users = await fetchAdmin(endpoint);
    const container = document.getElementById('users-table-body');
    if (!container) return;

    container.innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-8 py-6 font-bold text-sm text-slate-900">
                ${u.name}
                <br><span class="text-[10px] font-medium text-slate-400">${u.email}</span>
            </td>
            <td class="px-8 py-6">
                <span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">${u.plan || 'Free'}</span>
            </td>
            <td class="px-8 py-6">
                <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">${u.role}</span>
            </td>
            <td class="px-8 py-6 text-right">
                <button onclick="showUserProfile(${u.id})" class="bg-white border border-slate-200 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">View Profile</button>
            </td>
        </tr>
    `).join('');
}

async function showUserProfile(id) {
    currentUserId = id;
    showSection('user-profile');
    const profile = await fetchAdmin(`/users/${id}/profile`);
    if (!profile) return;
    
    document.getElementById('user-info-card').innerHTML = `
        <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100">${profile.user.name[0]}</div>
            <div>
                <p class="font-black text-slate-900 text-lg leading-tight">${profile.user.name}</p>
                <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">${profile.user.role}</p>
            </div>
        </div>
        <div class="space-y-4 pt-6 border-t border-slate-100">
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Contact</p>
                <p class="text-sm font-bold text-slate-700">${profile.user.email}</p>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subscription</p>
                <p class="text-sm font-bold text-indigo-600">${profile.user.plan || 'Free Plan'}</p>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                <p class="text-sm font-bold text-slate-700">${new Date(profile.user.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `;

    document.getElementById('user-interactions').innerHTML = profile.interactions.map(i => `
        <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p class="text-sm font-bold text-slate-700"><span class="text-indigo-600 uppercase text-[10px] font-black mr-2">${i.type}</span> ${i.metadata || ''}</p>
            <span class="text-[10px] font-bold text-slate-400 uppercase">${formatTime(i.created_at)}</span>
        </div>
    `).join('') || '<div class="p-10 text-center text-slate-400 text-sm italic">No interaction logs found.</div>';

    document.getElementById('user-notes').innerHTML = profile.notes.map(n => `
        <div class="p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm">
            <div class="flex justify-between items-center mb-3">
                <span class="px-2 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded">Dr. ${n.therapist_name}</span>
                <span class="text-[10px] font-bold text-slate-400">${new Date(n.created_at).toLocaleDateString()}</span>
            </div>
            <p class="text-sm font-medium text-slate-700 leading-relaxed">${n.content}</p>
        </div>
    `).join('') || '<div class="p-10 text-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-2xl">No clinical notes recorded.</div>';
}

// --- Utilities ---

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showSection(id) {
    // Nav highlight
    document.querySelectorAll('.sidebar-link').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('nav-btn-' + id);
    if (activeBtn) activeBtn.classList.add('active');

    // Section visibility
    document.querySelectorAll('.admin-section').forEach(div => div.classList.add('hidden'));
    const target = document.getElementById('section-' + id);
    if (target) target.classList.remove('hidden');

    // Title update
    const titles = {
        dashboard: { title: 'Overview', sub: 'Engagement at a glance.' },
        inquiries: { title: 'CRM Leads', sub: 'Manage contact form submissions.' },
        users: { title: 'User Base', sub: 'Detailed member directory.' },
        'user-profile': { title: 'Member Deep-dive', sub: 'Interaction history and clinical notes.' },
        content: { title: 'Content Editor', sub: 'Manage platform lessons.' },
        community: { title: 'Moderation', sub: 'Latest community discussion.' }
    };
    
    if (titles[id]) {
        document.getElementById('section-title').textContent = titles[id].title;
        document.getElementById('section-subtitle').textContent = titles[id].sub;
    }

    // Loaders
    if (id === 'inquiries') loadInquiries();
    if (id === 'users') loadUsers();
    if (id === 'dashboard') loadDashboardData();
}

// Start
window.onload = init;
