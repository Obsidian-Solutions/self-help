/**
 * MindFull Control Tower v7.4
 * Industrial-Strength Sync-Scroll Engine
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
  let isIframeReady = false;
  let scrollLock = false;

  console.log('Control Tower v7.4: Sync-Scroll Link Active');

  // --- 1. CORE API ---
  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json', 'x-xsrf-token': (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : '' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) { return null; }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. SYNC ENGINE (BIDIRECTIONAL) ---

  function syncToIframe() {
    const iframe = document.getElementById('site-iframe');
    if (!iframe || !iframe.contentWindow || !simplemde || !isIframeReady) return;

    const raw = simplemde.value();
    const fmMatch = raw.match(/^---([\s\S]*?)---/);
    let title = 'Draft';
    if (fmMatch) {
      const fm = fmMatch[1];
      const t = fm.match(/title:\s*['"]?(.+?)['"]?\n/);
      if (t) title = t[1];
    }
    const html = marked.parse(raw.replace(/^---[\s\S]*?---/, ''));
    iframe.contentWindow.postMessage({ type: 'CMS_SYNC', title, body: html }, '*');
  }

  function handleScroll(source) {
    if (scrollLock || !simplemde || !isIframeReady) return;
    scrollLock = true;

    const iframe = document.getElementById('site-iframe');
    if (source === 'editor') {
      const info = simplemde.codemirror.getScrollInfo();
      const percentage = info.top / (info.height - info.clientHeight);
      iframe.contentWindow.postMessage({ type: 'CMS_SCROLL', percentage }, '*');
    }

    setTimeout(() => { scrollLock = false; }, 50);
  }

  window.addEventListener('message', (event) => {
    if (event.data.type === 'IFRAME_READY') {
      isIframeReady = true;
      event.source.postMessage({ type: 'IFRAME_READY_ACK' }, '*');
      document.getElementById('iframe-loader')?.classList.add('opacity-0', 'pointer-events-none');
      syncToIframe();
    }
    
    if (event.data.type === 'IFRAME_SCROLL' && !scrollLock && simplemde) {
      scrollLock = true;
      const info = simplemde.codemirror.getScrollInfo();
      simplemde.codemirror.scrollTo(null, event.data.percentage * (info.height - info.clientHeight));
      setTimeout(() => { scrollLock = false; }, 50);
    }
  });

  // --- 3. ROUTER ---
  function router() {
    const section = (window.location.hash || '#dashboard').substring(1).split('?')[0];
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');
    const activeBtn = document.querySelector(`a[href="#${section === 'editor' ? 'content' : section}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');
    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
  }
  window.onhashchange = router;

  // --- 4. CMS ENGINE ---
  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (container && Array.isArray(items)) {
      container.innerHTML = items.map(i => `
        <div class="admin-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all shadow-sm">
          <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
          <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
        </div>
      `).join('');
    }
  };

  async function editEntry(collection, slug) {
    currentSlug = slug; isIframeReady = false;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', syncToIframe);
      simplemde.codemirror.on('scroll', () => handleScroll('editor'));
    }
    simplemde.value(entry.raw || '');
    
    const iframe = document.getElementById('site-iframe');
    iframe.src = `/${collection}/${slug}/?cms_preview=true`;
    document.getElementById('live-url-display').textContent = window.location.origin + `/${collection}/${slug}/`;
    document.getElementById('iframe-loader')?.classList.remove('opacity-0', 'pointer-events-none');
  }

  // --- 5. INTERACTION & RESIZER ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'logout') logout();
    if (action === 'load-collection') window.loadCollection(btn.getAttribute('data-name'));
    if (action === 'edit-entry') editEntry(btn.getAttribute('data-collection'), btn.getAttribute('data-slug'));
    if (action === 'publish') saveContent();
  });

  const resizer = document.getElementById('drag-handle');
  const leftSide = document.getElementById('editor-side');
  let isResizing = false;
  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', () => { isResizing = true; resizer.classList.add('resizing'); document.getElementById('site-iframe').style.pointerEvents = 'none'; });
    document.addEventListener('mousemove', (e) => { if (isResizing) { const x = e.clientX - 256; if (x > 300 && x < window.innerWidth - 400) leftSide.style.flexBasis = `${x}px`; } });
    document.addEventListener('mouseup', () => { isResizing = false; resizer.classList.remove('resizing'); document.getElementById('site-iframe').style.pointerEvents = 'auto'; });
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) notify('Changes Staged');
  }

  function notify(msg) {
    const toast = document.createElement('div');
    toast.className = 'bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl';
    toast.textContent = msg;
    document.getElementById('toaster').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  async function loadDashboard() {
    const stats = await api('/admin/stats'); 
    if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join('');
  }

  // Boot
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
})();
