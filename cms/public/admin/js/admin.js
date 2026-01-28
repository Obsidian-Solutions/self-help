/**
 * MindFull Control Tower v6.0
 * The Definitive Engine: Resizable, Stateful, and High-Fidelity
 */

/* global SimpleMDE, FileReader, confirm, marked */

(function () {
  const CMS_PORT = 3000;
  const HUGO_PORT = 1313;
  const isHugoHost = window.location.port == HUGO_PORT;
  
  const API_BASE = isHugoHost 
    ? `${window.location.protocol}//${window.location.hostname}:${CMS_PORT}/api`
    : '/api';
  const CMS_ORIGIN = isHugoHost ? `${window.location.protocol}//${window.location.hostname}:${CMS_PORT}` : window.location.origin;

  let simplemde = null;
  let logSource = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('Control Tower v6.0: All Systems Active');

  // --- 1. CORE UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl text-white font-bold shadow-2xl animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    const toaster = document.getElementById('toaster');
    if (toaster) toaster.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json', 'x-xsrf-token': (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : '' };
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

  // --- 2. ROUTER & NAVIGATION ---
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

  // --- 4. RESIZER ENGINE ---
  const resizer = document.getElementById('drag-handle');
  const leftSide = document.getElementById('editor-side');
  let isResizing = false;

  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizer.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      // Disable pointer events on iframe during resize to prevent losing focus
      document.getElementById('site-iframe').style.pointerEvents = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const offsetLeft = e.clientX;
      if (offsetLeft > 350 && offsetLeft < window.innerWidth * 0.8) {
        leftSide.style.flexBasis = `${offsetLeft}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      resizer.classList.remove('resizing');
      document.body.style.cursor = 'default';
      document.getElementById('site-iframe').style.pointerEvents = 'auto';
    });
  }

  // --- 5. THE IFRAME MIRROR ---

  function syncIframe() {
    const iframe = document.getElementById('site-iframe');
    const loader = document.getElementById('iframe-loader');
    if (!iframe || !currentSlug) return;

    if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');
    
    const targetUrl = `http://${window.location.hostname}:${HUGO_PORT}/${currentCollection}/${currentSlug}/?cms_preview=true&t=${Date.now()}`;
    
    iframe.src = targetUrl;
    const urlDisplay = document.getElementById('live-url-display');
    if (urlDisplay) urlDisplay.textContent = targetUrl.split('?')[0];

    // Safety Timeout: If Hugo takes too long or 404s, hide the loader anyway
    setTimeout(() => {
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
    }, 2000);

    iframe.onload = () => {
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
    };
  }

  // --- 6. CMS ENGINE ---

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
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Empty.</p>';
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    document.getElementById('editor-title').textContent = `Fidelity Editor: ${slug}`;
    
    if (!simplemde) {
      simplemde = new SimpleMDE({ 
        element: document.getElementById('editor-textarea'), 
        spellChecker: false, 
        status: false,
        autosave: { enabled: true, uniqueId: "fidelity-editor-v6", delay: 1000 }
      });
    }
    
    simplemde.value(entry.raw || '');
    
    // Parse metadata for the config sidebar
    renderFMFields(entry.data || {});
    
    // Set Live Destination Image
    const imgPreview = document.getElementById('live-image-preview');
    if (imgPreview && entry.data.illustration) {
      imgPreview.innerHTML = `<img src="${CMS_ORIGIN}/illustrations/${entry.data.illustration}.svg" class="w-full h-full object-contain p-4">`;
    }

    syncIframe();
  }

  function renderFMFields(data) {
    const fields = ['title', 'description', 'category', 'illustration'];
    const container = document.getElementById('frontmatter-fields');
    if (!container) return;

    container.innerHTML = fields.map(f => `
      <div class="space-y-1">
        <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest">${f}</label>
        <input id="fm-${f}" value="${data[f] || ''}" class="w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold focus:ring-2 focus:ring-indigo-500/10">
      </div>
    `).join('');
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) {
      notify('Staged to Production');
      setTimeout(syncIframe, 1000);
    }
  }

  // Generic Loaders
  async function loadDashboard() { const stats = await api('/admin/stats'); if (stats) { document.getElementById('stat-users').textContent = stats.totalUsers; document.getElementById('stat-views').textContent = stats.totalViews; document.getElementById('stat-rating').textContent = stats.averageRating; document.getElementById('stat-new-leads').textContent = stats.newInquiries; } }
  async function loadMedia() { const items = await api('/media'); const container = document.getElementById('media-grid'); if (container && Array.isArray(items)) { container.innerHTML = items.map(i => `<div class="admin-card p-2 relative group overflow-hidden"><img src="${CMS_ORIGIN}${i.url}" class="w-full aspect-square object-cover rounded-xl"><div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2"><button data-action="copy-url" data-url="${CMS_ORIGIN}${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase">Link</button></div></div>`).join(''); } }

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