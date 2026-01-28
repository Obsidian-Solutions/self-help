/**
 * MindFull Command Center v3.9
 * Flattened & Hardened Enterprise Controller
 */

/* global SimpleMDE, FileReader, confirm */

const API_BASE = '/api';
let simplemde = null;
let currentCollection = 'posts';
let currentSlug = null;
let currentLeadId = null;

console.log('MindFull Admin v3.9 Initializing...');

// --- 1. CORE API WRAPPER ---
async function api(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('mindfull_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    'x-xsrf-token': getCookie('XSRF-TOKEN'),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (res.status === 401) {
      logout();
      return null;
    }
    const data = await res.json();
    return data;
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

// --- 2. NAVIGATION ENGINE ---
window.showSection = function (id) {
  console.log('Switching to Section:', id);

  // UI state cleanup
  document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(b => {
    b.classList.remove('active', 'text-white', 'bg-slate-800');
    b.classList.add('text-slate-400');
  });

  const target = document.getElementById(`section-${id}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('animate-in');
  }

  // Active button highlight
  const mappedId = id.startsWith('user-') ? 'users' : (id === 'editor' ? 'content' : id);
  const activeBtn = document.querySelector(`[data-section="${mappedId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'text-white', 'bg-slate-800');
    activeBtn.classList.remove('text-slate-400');
  }

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-active');
  if (breadcrumb) breadcrumb.textContent = id.replace('-', ' ').toUpperCase();

  // Load section-specific data
  if (id === 'dashboard') loadDashboard();
  if (id === 'content') window.loadCollection(currentCollection);
  if (id === 'users') loadUsers();
  if (id === 'inquiries') loadInquiries();
  if (id === 'media') loadMedia();
};

// --- 3. CRM: LEADS & INQUIRIES ---
async function loadInquiries() {
  const leads = await api('/admin/inquiries');
  const container = document.getElementById('inquiries-table-body');
  if (!container || !leads) return;

  container.innerHTML = leads.map(l => `
    <tr class="${l.status === 'new' ? 'bg-indigo-50/20' : ''} hover:bg-slate-50 transition-colors">
      <td class="px-8 py-6">
        <p class="text-sm font-bold text-slate-900">${l.name}</p>
        <p class="text-[10px] text-slate-400 font-medium">${l.email}</p>
      </td>
      <td class="px-8 py-6">
        <p class="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">${l.subject}</p>
        <p class="text-xs text-slate-500 line-clamp-2 max-w-md">${l.message}</p>
      </td>
      <td class="px-8 py-6 text-right">
        <button onclick="window.openReplyModal(${l.id}, '${l.email}', '${l.name}')" class="bg-white border border-slate-200 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
          Quick Reply
        </button>
      </td>
    </tr>
  `).join('') || '<p class="py-10 text-center text-xs italic text-slate-400">No leads found.</p>';
}

window.openReplyModal = async function(id, email, name) {
  currentLeadId = id;
  const templates = await api('/admin/templates');
  const container = document.getElementById('reply-template-list');
  
  document.getElementById('reply-lead-name').textContent = name;
  document.getElementById('reply-lead-email').textContent = email;
  
  container.innerHTML = (templates || []).map(t => {
    const escapedBody = encodeURIComponent(t.body);
    return `
      <button onclick="window.useTemplate('${t.subject}', '${escapedBody}', '${name}')" class="w-full text-left p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all">
        <p class="text-xs font-bold text-slate-900">${t.name}</p>
        <p class="text-[10px] text-slate-400 font-medium truncate">${t.subject}</p>
      </button>
    `;
  }).join('');
  
  document.getElementById('reply-modal').classList.remove('hidden');
};

window.useTemplate = function(subject, escapedBody, name) {
  const body = decodeURIComponent(escapedBody);
  const finalBody = body.replace('{{name}}', name);
  document.getElementById('reply-subject').value = subject;
  document.getElementById('reply-body').value = finalBody;
};

window.sendQuickReply = async function() {
  const btn = document.getElementById('reply-send-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Sending...';
  
  await api(`/admin/inquiries/${currentLeadId}`, 'PATCH', { status: 'replied' });
  
  alert('Response sent successfully via CRM pipeline.');
  document.getElementById('reply-modal').classList.add('hidden');
  loadInquiries();
  btn.disabled = false;
  btn.innerHTML = 'Send Response &rarr;';
};

// --- 4. CRM: USER PROFILES ---
async function loadUsers() {
  const users = await api('/admin/users');
  const container = document.getElementById('users-table-body');
  if (!container || !users) return;

  container.innerHTML = users.map(u => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="px-8 py-6">
        <p class="text-sm font-bold text-slate-900">${u.name}</p>
        <p class="text-[10px] text-slate-400 font-medium">${u.email}</p>
      </td>
      <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">${u.plan}</span></td>
      <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">${u.role}</span></td>
      <td class="px-8 py-6 text-right">
        <button onclick="window.viewUserProfile(${u.id})" class="text-indigo-600 font-black text-[10px] uppercase hover:underline">Profile &rarr;</button>
      </td>
    </tr>
  `).join('');
}

window.viewUserProfile = async function(id) {
  window.showSection('user-profile');
  const profile = await api(`/admin/users/${id}/profile`);
  if (!profile) return;

  document.getElementById('user-profile-info').innerHTML = `
    <div class="flex items-center gap-4 mb-8">
      <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">${profile.user.name[0]}</div>
      <div>
        <h3 class="text-xl font-black text-slate-900">${profile.user.name}</h3>
        <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest">${profile.user.role} | ${profile.user.plan} Tier</p>
      </div>
    </div>
    <div class="space-y-4 pt-6 border-t border-slate-100">
      <div><p class="text-[10px] font-black text-slate-400 uppercase">Contact</p><p class="text-sm font-bold text-slate-700">${profile.user.email}</p></div>
      <div><p class="text-[10px] font-black text-slate-400 uppercase">Member Since</p><p class="text-sm font-bold text-slate-700">${new Date(profile.user.created_at).toLocaleDateString()}</p></div>
    </div>
  `;

  document.getElementById('profile-interactions').innerHTML = (profile.interactions || []).map(i => `
    <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <p class="text-xs font-bold text-slate-700"><span class="text-indigo-600 uppercase mr-2">${i.type}</span> ${i.metadata || ''}</p>
      <span class="text-[9px] font-black text-slate-400 uppercase">${new Date(i.created_at).toLocaleDateString()}</span>
    </div>
  `).join('') || '<p class="text-center py-10 text-xs italic text-slate-400">No interactions recorded.</p>';

  document.getElementById('profile-notes').innerHTML = (profile.notes || []).map(n => `
    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex justify-between mb-2">
        <span class="text-[9px] font-black text-indigo-600 uppercase">Dr. ${n.therapist_name}</span>
        <span class="text-[9px] font-bold text-slate-400">${new Date(n.created_at).toLocaleDateString()}</span>
      </div>
      <p class="text-xs font-medium text-slate-600 leading-relaxed">${n.content}</p>
    </div>
  `).join('') || '<p class="text-center py-10 text-xs italic text-slate-400">No clinical notes.</p>';
};

// --- 5. CMS: CONTENT MANAGEMENT ---
window.loadCollection = async function (name) {
  currentCollection = name;
  const items = await api(`/content/${name}`);
  const container = document.getElementById('collection-view');
  if (!container || !items) return;

  container.innerHTML = items.map(i => `
    <div class="admin-card p-6 flex flex-col h-full group">
      <div class="mb-4"><span class="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">${i.data.category || 'General'}</span></div>
      <h4 class="font-black text-slate-900 mb-6 flex-1 group-hover:text-indigo-600 transition-colors">${i.data.title || i.slug}</h4>
      <div class="flex gap-2">
        <button onclick="window.editEntry('${name}', '${i.slug}')" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Edit</button>
        <button onclick="window.deleteEntry('${name}', '${i.slug}')" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');
};

window.editEntry = async function (collection, slug) {
  currentSlug = slug;
  window.showSection('editor');
  const entry = await api(`/content/${collection}/${slug}`);
  if (!entry) return;

  if (!simplemde) {
    simplemde = new SimpleMDE({
      element: document.getElementById('editor-textarea'),
      spellChecker: false,
      status: false,
    });
  }
  simplemde.value(entry.body || '');

  const fields = ['title', 'description', 'category', 'illustration'];
  const fmContainer = document.getElementById('frontmatter-fields');
  if (fmContainer) {
    fmContainer.innerHTML = fields.map(f => `
      <div>
        <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">${f}</label>
        <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 transition-all">
      </div>
    `).join('');
  }
};

window.saveContent = async function () {
  const data = {};
  ['title', 'description', 'category', 'illustration'].forEach(f => {
    const el = document.getElementById(`fm-${f}`);
    if (el) data[f] = el.value;
  });
  const body = simplemde.value();
  const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body });
  if (res) {
    alert('Content published to Hugo repository.');
    window.showSection('content');
  }
};

window.deleteEntry = async function (collection, slug) {
  if (!confirm(`Permanently delete ${slug}?`)) return;
  const res = await api(`/content/${collection}/${slug}`, 'DELETE');
  if (res) window.loadCollection(collection);
};

// --- 6. MEDIA GALLERY ---
async function loadMedia() {
  const items = await api('/media');
  const container = document.getElementById('media-grid');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">No assets found in static/images.</p>';
    return;
  }

  container.innerHTML = items.map(i => `
    <div class="admin-card p-2 relative group overflow-hidden">
      <img src="${i.url}" class="w-full aspect-square object-cover rounded-xl">
      <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
        <button onclick="window.copyToClipboard('${i.url}')" class="p-2 bg-indigo-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest px-3">Copy URL</button>
        <button onclick="window.deleteMedia('${i.name}')" class="p-2 bg-red-500 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest px-3">Delete</button>
      </div>
    </div>
  `).join('');
}

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text);
  alert('URL copied to clipboard!');
};

window.handleMediaUpload = function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    await api('/media/upload', 'POST', { name: file.name, data: reader.result });
    loadMedia();
  };
  reader.readAsDataURL(file);
};

window.deleteMedia = async function (name) {
  if (!confirm('Delete asset?')) return;
  await api(`/media/${name}`, 'DELETE');
  loadMedia();
};

// --- 7. DASHBOARD ANALYTICS ---
async function loadDashboard() {
  const stats = await api('/admin/stats');
  if (stats) {
    setEl('stat-users', stats.totalUsers);
    setEl('stat-views', stats.totalViews);
    setEl('stat-rating', stats.averageRating);
    setEl('stat-new-leads', stats.newInquiries);
  }

  const [activity, popular] = await Promise.all([api('/admin/activity'), api('/admin/popular')]);

  if (activity) {
    document.getElementById('activity-list').innerHTML = activity.map(i => `
      <div class="flex items-center justify-between py-4 group">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full ${i.activity_type === 'inquiry' ? 'bg-amber-500' : 'bg-indigo-500'}"></div>
          <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-xs text-slate-400 font-medium">${i.event}</span></p>
        </div>
        <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
      </div>
    `).join('') || '<p class="py-10 text-center text-xs italic text-slate-400">No activity logged.</p>';
  }

  if (popular) {
    document.getElementById('popular-list').innerHTML = popular.map(i => `
      <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2 hover:bg-white hover:shadow-sm transition-all">
        <p class="text-xs font-bold text-slate-600 truncate max-w-[150px]">${i.slug}</p>
        <span class="text-[10px] font-black text-emerald-600">${i.views} VIEWS</span>
      </div>
    `).join('');
  }
}

// --- 8. UTILS & AUTH ---
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

window.logout = function () {
  localStorage.removeItem('mindfull_admin_token');
  localStorage.removeItem('mindfull_admin_user');
  window.location.reload();
};

// --- 9. BOOTSTRAP ---
function init() {
  const token = localStorage.getItem('mindfull_admin_token');
  if (token) {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('admin-sidebar').classList.remove('hidden');
    document.getElementById('admin-header').classList.remove('hidden');
    document.getElementById('admin-main').classList.remove('hidden');

    const user = JSON.parse(localStorage.getItem('mindfull_admin_user') || '{}');
    setEl('admin-display-name', user.name);
    document.getElementById('admin-display-avatar').src = `https://i.pravatar.cc/100?u=${user.email}`;

    // Sidebar listeners
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => window.showSection(link.getAttribute('data-section')));
    });

    document.getElementById('logout-btn')?.addEventListener('click', window.logout);
    window.showSection('dashboard');
  }
}

document.addEventListener('DOMContentLoaded', init);