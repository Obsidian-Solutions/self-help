/**
 * MindFull Command Center v3.7
 * Robust Navigation & Data Controller
 */

/* global SimpleMDE, FileReader, confirm */

(function () {
  const API_BASE = '/api';
  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('MindFull Admin v3.7 Booting...');

  // --- API Core ---
  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      if (res.status === 401) {
        window.logout();
        return null;
      }
      return res.json();
    } catch (e) {
      console.error(`[API ERROR] ${endpoint}:`, e);
      return null;
    }
  }

  // --- Session Management ---
  window.logout = function () {
    localStorage.removeItem('mindfull_admin_token');
    localStorage.removeItem('mindfull_admin_user');
    window.location.reload();
  };

  // --- Navigation Engine ---
  window.showSection = function (id) {
    console.log('Navigating to:', id);

    // 1. Hide All Sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));

    // 2. Clear Navigation Styles
    document.querySelectorAll('.nav-link').forEach(b => {
      b.classList.remove('active', 'text-white', 'bg-slate-800');
      b.classList.add('text-slate-400');
    });

    // 3. Show Target Section
    const target = document.getElementById(`section-${id}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('animate-in');
    } else {
      console.error(`Missing section: section-${id}`);
    }

    // 4. Update Button State
    const activeBtn = document.querySelector(`[data-section="${id === 'editor' ? 'content' : id}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'text-white', 'bg-slate-800');
      activeBtn.classList.remove('text-slate-400');
    }

    // 5. Update Breadcrumb
    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = id.replace('-', ' ').toUpperCase();

    // 6. Trigger Data Loaders
    try {
      switch (id) {
        case 'dashboard':
          loadDashboard();
          break;
        case 'content':
          window.loadCollection(currentCollection);
          break;
        case 'users':
          loadUsers();
          break;
        case 'inquiries':
          loadInquiries();
          break;
        case 'media':
          loadMedia();
          break;
      }
    } catch (err) {
      console.error('Loader failure:', err);
    }
  };

  // --- Data Loaders ---

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
      const list = document.getElementById('activity-list');
      if (list) {
        list.innerHTML = activity
          .map(
            i => `
          <div class="flex items-center justify-between py-4 group">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full ${i.activity_type === 'inquiry' ? 'bg-amber-500' : 'bg-indigo-500'}"></div>
              <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-xs text-slate-400 font-medium">${i.event}</span></p>
            </div>
            <span class="text-[10px] font-black text-slate-300 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
          </div>
        `,
          )
          .join('') || '<p class="py-10 text-center text-xs italic text-slate-400">No activity logged.</p>';
      }
    }

    if (popular) {
      const list = document.getElementById('popular-list');
      if (list) {
        list.innerHTML = popular
          .map(
            i => `
          <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2">
            <p class="text-xs font-bold text-slate-600 truncate max-w-[150px]">${i.slug}</p>
            <span class="text-[10px] font-black text-indigo-600 px-2 py-1 bg-indigo-50 rounded-lg">${i.views} VIEWS</span>
          </div>
        `,
          )
          .join('');
      }
    }
  }

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !items) return;

    container.innerHTML = items
      .map(
        i => `
      <div class="admin-card p-6 flex flex-col h-full group">
        <div class="mb-4"><span class="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">${i.data.category || 'General'}</span></div>
        <h4 class="font-black text-slate-900 mb-6 flex-1 group-hover:text-indigo-600 transition-colors">${i.data.title || i.slug}</h4>
        <div class="flex gap-2">
          <button onclick="window.editEntry('${name}', '${i.slug}')" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Edit</button>
          <button onclick="window.deleteEntry('${name}', '${i.slug}')" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `,
      )
      .join('');
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
      fmContainer.innerHTML = fields
        .map(
          f => `
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">${f}</label>
          <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold text-slate-700">
        </div>
      `,
        )
        .join('');
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
      alert('Published successfully!');
      window.showSection('content');
    }
  };

  window.deleteEntry = async function (collection, slug) {
    if (!confirm(`Permanently delete ${slug}?`)) return;
    const res = await api(`/content/${collection}/${slug}`, 'DELETE');
    if (res) window.loadCollection(collection);
  };

  async function loadUsers() {
    const users = await api('/admin/users');
    const container = document.getElementById('users-table-body');
    if (!container || !users) return;

    container.innerHTML = users
      .map(
        u => `
      <tr class="hover:bg-slate-50/50 transition-colors">
        <td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${u.name}</p><p class="text-[10px] text-slate-400 font-medium">${u.email}</p></td>
        <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">${u.plan}</span></td>
        <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">${u.role}</span></td>
        <td class="px-8 py-6 text-right"><button class="text-indigo-600 font-black text-[10px] uppercase hover:underline">Profile &rarr;</button></td>
      </tr>
    `,
      )
      .join('');
  }

  async function loadInquiries() {
    const leads = await api('/admin/inquiries');
    const container = document.getElementById('inquiries-table-body');
    if (!container || !leads) return;

    container.innerHTML = leads
      .map(
        l => `
      <tr class="${l.status === 'new' ? 'bg-indigo-50/20' : ''} hover:bg-slate-50/50">
        <td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${l.name}</p><p class="text-[10px] text-slate-400">${l.email}</p></td>
        <td class="px-8 py-6 text-xs text-slate-500 max-w-md line-clamp-2">${l.message}</td>
        <td class="px-8 py-6 text-right"><span class="px-2 py-1 rounded text-[10px] font-black uppercase ${l.status === 'new' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}">${l.status}</span></td>
      </tr>
    `,
      )
      .join('');
  }

  async function loadMedia() {
    const items = await api('/media');
    const container = document.getElementById('media-grid');
    if (!container || !items) return;

    container.innerHTML = items
      .map(
        i => `
      <div class="admin-card p-2 relative group overflow-hidden">
        <img src="${i.url}" class="w-full aspect-square object-cover rounded-xl">
        <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <button onclick="window.deleteMedia('${i.name}')" class="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `,
      )
      .join('');
  }

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

  // --- Utils ---
  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // --- Boot ---
  function init() {
    const token = localStorage.getItem('mindfull_admin_token');
    const userStr = localStorage.getItem('mindfull_admin_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('admin-sidebar').classList.remove('hidden');
        document.getElementById('admin-header').classList.remove('hidden');
        document.getElementById('admin-main').classList.remove('hidden');

        setEl('admin-display-name', user.name);
        setEl('admin-display-role', user.role);
        document.getElementById('admin-display-avatar').src = `https://i.pravatar.cc/100?u=${user.email}`;

        // Add Listeners to Sidebar Links
        document.querySelectorAll('.nav-link').forEach(link => {
          link.addEventListener('click', () => {
            const section = link.getAttribute('data-section');
            window.showSection(section);
          });
        });

        // Add Logout Listener
        const lBtn = document.getElementById('logout-btn');
        if (lBtn) lBtn.addEventListener('click', window.logout);

        window.showSection('dashboard');
      } catch (e) {
        console.error('Session corrupt');
        window.logout();
      }
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();