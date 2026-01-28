/**
 * MindFull Control Tower v5.9
 * Bulletproof Iframe Engine & Fixed API Logic
 */

/* global SimpleMDE, FileReader, confirm */

(function () {
  const CMS_PORT = 3000;
  const isHugoHost = window.location.port == '1313';
  
  // API BASE: If we are on 1313, we must go to 3000. If we are on 3000, use relative /api
  const API_BASE = isHugoHost 
    ? `${window.location.protocol}//${window.location.hostname}:${CMS_PORT}/api`
    : '/api';

  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('Control Tower v5.9: Global Logic Active');

  // --- 1. CORE UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl text-white font-bold shadow-2xl animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    const toaster = document.getElementById('toaster');
    if (toaster) toaster.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
      'Content-Type': 'application/json',
      'x-xsrf-token': getCookie('XSRF-TOKEN')
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { 
        method, 
        headers, 
        body: body ? JSON.stringify(body) : null,
        credentials: 'include'
      });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) {
      console.error('API Error:', e);
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. ROUTER ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    console.log('Routing to segment:', section);

    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');

    const mappedId = section === 'editor' ? 'content' : section;
    const activeBtn = document.querySelector(`a[href="#${mappedId}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = section.toUpperCase();

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
    if (section === 'media') loadMedia();
  }

  window.onhashchange = router;

  // --- 3. EVENT DELEGATION ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const slug = btn.getAttribute('data-slug');
    const collection = btn.getAttribute('data-collection');

    switch (action) {
      case 'logout': logout(); break;
      case 'load-collection': window.loadCollection(btn.getAttribute('data-name')); break;
      case 'edit-entry': editEntry(collection, slug); break;
      case 'publish': saveContent(); break;
      case 'refresh-preview': syncIframe(); break;
      case 'copy-url': 
        navigator.clipboard.writeText(btn.getAttribute('data-url'));
        notify('Linked'); 
        break;
    }
  });

  // --- 4. IFRAME MIRROR ---

  function syncIframe() {
    const iframe = document.getElementById('site-iframe');
    const loader = document.getElementById('iframe-loader');
    if (!iframe || !currentSlug) return;

    if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');
    
    // Always use 1313 for preview
    const targetUrl = `http://${window.location.hostname}:1313/${currentCollection}/${currentSlug}/?cms_preview=true&t=${Date.now()}`;
    
    iframe.src = targetUrl;
    const urlDisplay = document.getElementById('live-url-display');
    if (urlDisplay) urlDisplay.textContent = targetUrl.split('?')[0];

    iframe.onload = () => {
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
    };
  }

  // --- 5. CMS ENGINE ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    console.log('Loading Collection:', name);
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="admin-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all shadow-sm">
        <span class="text-[9px] font-black uppercase text-indigo-600 mb-2">${i.data.category || 'Draft'}</span>
        <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
        <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all">Configure &rarr;</button>
      </div>
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Empty repository.</p>';
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    const titleEl = document.getElementById('editor-title');
    if (titleEl) titleEl.textContent = `Source: ${slug}`;
    
    if (!simplemde) {
      simplemde = new SimpleMDE({ 
        element: document.getElementById('editor-textarea'), 
        spellChecker: false, 
        status: false,
        autosave: { enabled: true, uniqueId: "fidelity-editor-v5", delay: 1000 }
      });
    }
    
    simplemde.value(entry.raw || '');
    syncIframe();
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) {
      notify('Staged to Production');
      setTimeout(syncIframe, 1000);
    }
  }

  // --- 6. DATA LOADERS ---
  async function loadDashboard() {
    const stats = await api('/admin/stats');
    if (stats) {
      const els = { 'stat-users': stats.totalUsers, 'stat-views': stats.totalViews, 'stat-rating': stats.averageRating, 'stat-new-leads': stats.newInquiries };
      for (const [id, val] of Object.entries(els)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      }
    }
  }

  async function loadMedia() {
    const items = await api('/media');
    const container = document.getElementById('media-grid');
    if (container && Array.isArray(items)) {
      container.innerHTML = items.map(i => `<div class="admin-card p-2 relative group overflow-hidden"><img src="http://${window.location.hostname}:${CMS_PORT}${i.url}" class="w-full aspect-square object-cover rounded-xl"><div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2"><button data-action="copy-url" data-url="http://${window.location.hostname}:${CMS_PORT}${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase">Link</button></div></div>`).join('');
    }
  }

  // --- 7. BOOT ---
  function init() {
    const token = localStorage.getItem('mindfull_admin_token');
    if (token) {
      document.getElementById('login-modal').classList.add('hidden');
      document.getElementById('admin-sidebar').classList.remove('hidden');
      document.getElementById('admin-header').classList.remove('hidden');
      document.getElementById('admin-main').classList.remove('hidden');
      const user = JSON.parse(localStorage.getItem('mindfull_admin_user') || '{}');
      const nameEl = document.getElementById('admin-display-name');
      if (nameEl) nameEl.textContent = user.name;
      router();
    } else {
      document.getElementById('login-modal').classList.remove('hidden');
    }
  }

  init();
})();
