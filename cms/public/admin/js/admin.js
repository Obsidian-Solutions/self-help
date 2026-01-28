/**
 * MindFull Control Tower v6.0
 * The Definitive Engine: Resizable, Stateful, and High-Fidelity
 */

/* global SimpleMDE */

(function () {
  const CMS_PORT = 3000;
  const HUGO_PORT = 1313;
  const isHugoHost = window.location.port == HUGO_PORT;
  const API_BASE = isHugoHost ? `http://${window.location.hostname}:${CMS_PORT}/api` : '/api';

  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('Control Tower v6.0: All Systems Active');

  // --- 1. CORE API ---
  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
      'Content-Type': 'application/json',
      'x-xsrf-token': (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : ''
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) { return null; }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. ROUTER ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) { target.classList.remove('hidden'); }

    const activeBtn = document.querySelector(`a[href="#${section === 'editor' ? 'content' : section}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') loadCollection(currentCollection);
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
      case 'load-collection': loadCollection(btn.getAttribute('data-name')); break;
      case 'edit-entry': editEntry(collection, slug); break;
      case 'publish': saveContent(); break;
      case 'logout': logout(); break;
    }
  });

  // --- 4. RESIZER ENGINE ---
  const resizer = document.getElementById('drag-handle');
  const leftSide = document.getElementById('editor-side');
  let isResizing = false;

  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', () => { 
      isResizing = true; 
      resizer.classList.add('resizing');
      document.getElementById('site-iframe').style.pointerEvents = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const x = e.clientX - 256; // Sidebar width
      if (x > 350 && x < window.innerWidth * 0.8) {
        leftSide.style.flexBasis = `${x}px`;
      }
    });
    document.addEventListener('mouseup', () => { 
      isResizing = false; 
      resizer.classList.remove('resizing');
      document.getElementById('site-iframe').style.pointerEvents = 'auto';
    });
  }

  // --- 5. CMS ENGINE ---

  async function loadCollection(name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 hover:border-indigo-600 shadow-sm transition-all">
        <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
        <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
      </div>
    `).join('');
  }

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
    }
    simplemde.value(entry.raw || '');
    syncIframe();
  }

  function syncIframe() {
    const iframe = document.getElementById('site-iframe');
    const loader = document.getElementById('iframe-loader');
    if (!iframe || !currentSlug) return;

    loader.classList.remove('opacity-0', 'pointer-events-none');
    const targetUrl = `http://${window.location.hostname}:${HUGO_PORT}/${currentCollection}/${currentSlug}/?cms_preview=true&t=${Date.now()}`;
    iframe.src = targetUrl;
    document.getElementById('live-url-display').textContent = targetUrl.split('?')[0];

    iframe.onload = () => loader.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => loader.classList.add('opacity-0', 'pointer-events-none'), 3000);
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) notify('Staged to Hugo');
  }

  function notify(msg) {
    const toast = document.createElement('div');
    toast.className = 'bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl';
    toast.textContent = msg;
    document.getElementById('toaster').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // --- 6. INITIALIZATION ---
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
    }
  }

  // Generic Loaders (Minimal)
  async function loadDashboard() { 
    const stats = await api('/admin/stats'); 
    if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join('');
  }

  // Login sequence
  const lBtn = document.getElementById('login-submit-btn');
  if (lBtn) {
    lBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('mindfull_admin_token', data.token);
        localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
        location.reload();
      }
    });
  }

  init();
})();
