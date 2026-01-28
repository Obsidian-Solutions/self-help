/**
 * MindFull Control Tower v6.2
 * Zero-Save Real-time Sync Engine
 */

/* global SimpleMDE, marked */

(function () {
  const CMS_PORT = 3000;
  const HUGO_PORT = 1313;
  const isHugoHost = window.location.port == HUGO_PORT;
  const API_BASE = isHugoHost ? `http://${window.location.hostname}:${CMS_PORT}/api` : '/api';

  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('Control Tower v6.2: Zero-Save Sync Active');

  // --- 1. CORE API ---
  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
      'Content-Type': 'application/json',
      'x-xsrf-token': (parts = `; ${document.cookie}`).split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : ''
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) { return null; }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. THE SYNC ENGINE (POSTMESSAGE) ---

  function triggerRealtimeSync() {
    const iframe = document.getElementById('site-iframe');
    if (!iframe || !iframe.contentWindow || !simplemde) return;

    const raw = simplemde.value();
    
    // Parse Frontmatter for Preview UI
    const fmMatch = raw.match(/^---([\s\S]*?)---/);
    let title = 'Untitled Draft';
    let category = 'JOURNAL';
    if (fmMatch) {
      const fm = fmMatch[1];
      const tMatch = fm.match(/title:\s*['"]?(.+?)['"]?\n/);
      const cMatch = fm.match(/category:\s*['"]?(.+?)['"]?\n/);
      if (tMatch) title = tMatch[1];
      if (cMatch) category = cMatch[1];
    }

    const bodyMarkdown = raw.replace(/^---[\s\S]*?---/, '');
    const bodyHtml = marked.parse(bodyMarkdown);

    // Send to Iframe
    iframe.contentWindow.postMessage({
      type: 'CMS_SYNC',
      title: title,
      category: category,
      body: bodyHtml
    }, '*');
  }

  // --- 3. ROUTER ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) { target.classList.remove('hidden'); }

    const activeBtn = document.querySelector(`a[href="#${section}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') loadCollection(currentCollection);
  }

  window.onhashchange = router;

  // --- 4. CMS LOGIC ---

  async function loadCollection(name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 shadow-sm transition-all hover:border-indigo-600">
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

    document.getElementById('editor-filename').textContent = `${collection}/${slug}`;

    if (!simplemde) {
      simplemde = new SimpleMDE ({ 
        element: document.getElementById('editor-textarea'), 
        spellChecker: false, 
        status: false 
      });
      // Trigger sync on every keystroke
      simplemde.codemirror.on('change', triggerRealtimeSync);
    }
    simplemde.value(entry.raw || '');
    
    // Setup Iframe with Preview Flag
    const iframe = document.getElementById('site-iframe');
    const targetUrl = `http://${window.location.hostname}:${HUGO_PORT}/${collection}/${slug}/?cms_preview=true`;
    iframe.src = targetUrl;
    document.getElementById('live-url-display').textContent = targetUrl.split('?')[0];

    iframe.onload = () => {
      // Initial sync once loaded
      triggerRealtimeSync();
    };
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) notify('Changes Published to Live Site');
  }

  // --- 5. DELEGATION ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    switch (action) {
      case 'load-collection': loadCollection(btn.getAttribute('data-name')); break;
      case 'edit-entry': editEntry(btn.getAttribute('data-collection'), btn.getAttribute('data-slug')); break;
      case 'publish': saveContent(); break;
      case 'logout': logout(); break;
    }
  });

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

  async function loadDashboard() {
    const stats = await api('/admin/stats'); 
    if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join('');
  }

  init();
})();
