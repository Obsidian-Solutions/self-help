/**
 * MindFull Control Tower v5.8
 * Live-Sync Iframe Engine & Raw Markdown Controller
 */

/* global SimpleMDE, FileReader, confirm */

(function () {
  const CMS_PORT = 3000;
  const isHugoHost = window.location.port == '1313';
  const API_BASE = isHugoHost 
    ? `${window.location.protocol}//${window.location.hostname}:${CMS_PORT}/api`
    : `${window.location.origin}/api`;

  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('Control Tower v5.8: Iframe Sync Active');

  // --- 1. CORE API & UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl text-white font-bold shadow-2xl animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    document.getElementById('toaster').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
      'Content-Type': 'application/json',
      'x-xsrf-token': (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : ''
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
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');

    const mappedId = section === 'editor' ? 'content' : section;
    const activeBtn = document.querySelector(`a[href="#${mappedId}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    document.getElementById('breadcrumb-active').textContent = section.toUpperCase();

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
      case 'copy-url': navigator.clipboard.writeText(btn.getAttribute('data-url')); notify('Linked'); break;
    }
  });

  // --- 4. THE IFRAME SYNC ENGINE ---

  function syncIframe() {
    const iframe = document.getElementById('site-iframe');
    const loader = document.getElementById('iframe-loader');
    if (!iframe) return;

    // Show loading overlay while Hugo rebuilds
    if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');
    
    const targetUrl = `http://localhost:1313/${currentCollection}/${currentSlug}/?cms_preview=true&t=${Date.now()}`;
    
    iframe.src = targetUrl;
    document.getElementById('live-url-display').textContent = targetUrl.split('?')[0];

    iframe.onload = () => {
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
    };
  }

  // --- 5. CMS ENGINE ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="admin-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all shadow-sm">
        <span class="text-[9px] font-black uppercase text-indigo-600 mb-2">${i.data.category || 'Draft'}</span>
        <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
        <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all">Configure &rarr;</button>
      </div>
    `).join('');
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    document.getElementById('editor-title').textContent = `Full Source: ${slug}`;
    
    if (!simplemde) {
      simplemde = new SimpleMDE({ 
        element: document.getElementById('editor-textarea'), 
        spellChecker: false, 
        status: false,
        autosave: { enabled: true, uniqueId: "fidelity-editor-v5", delay: 1000 }
      });
    }
    
    simplemde.value(entry.raw || '');
    
    // Initial sync
    syncIframe();
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) {
      notify('Staged to Hugo');
      // Wait 500ms for Hugo's live-reload to trigger then force sync
      setTimeout(syncIframe, 500);
    }
  }

  // --- 6. RESIZER ---
  const resizer = document.getElementById('drag-handle');
  const leftSide = document.getElementById('editor-side');
  let isResizing = false;

  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', () => { isResizing = true; resizer.classList.add('resizing'); document.body.style.cursor = 'col-resize'; });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const offsetLeft = e.clientX;
      if (offsetLeft > 350 && offsetLeft < window.innerWidth * 0.8) {
        leftSide.style.flexBasis = `${offsetLeft}px`;
      }
    });
    document.addEventListener('mouseup', () => { isResizing = false; resizer.classList.remove('resizing'); document.body.style.cursor = 'default'; });
  }

  // Generic Loaders
  async function loadDashboard() { const stats = await api('/admin/stats'); if (stats) { document.getElementById('stat-users').textContent = stats.totalUsers; document.getElementById('stat-views').textContent = stats.totalViews; document.getElementById('stat-rating').textContent = stats.averageRating; document.getElementById('stat-new-leads').textContent = stats.newInquiries; } }
  async function loadMedia() { const items = await api('/media'); const container = document.getElementById('media-grid'); if (container && Array.isArray(items)) { container.innerHTML = items.map(i => `<div class="admin-card p-2 relative group overflow-hidden"><img src="http://localhost:${CMS_PORT}${i.url}" class="w-full aspect-square object-cover rounded-xl"><div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity"><button data-action="copy-url" data-url="http://localhost:${CMS_PORT}${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase">Link</button></div></div>`).join(''); } }

  // Boot
  function init() {
    const token = localStorage.getItem('mindfull_admin_token');
    if (token) {
      document.getElementById('login-modal').classList.add('hidden');
      document.getElementById('admin-sidebar').classList.remove('hidden');
      document.getElementById('admin-header').classList.remove('hidden');
      document.getElementById('admin-main').classList.remove('hidden');
      const user = JSON.parse(localStorage.getItem('mindfull_admin_user') || '{}');
      document.getElementById('admin-display-name').textContent = user.name;
      router();
    } else { document.getElementById('login-modal').classList.remove('hidden'); }
  }

  init();
})();