/**
 * MindFull Control Tower v7.5
 * Deterministic Sync-Scroll Engine
 */

/* global SimpleMDE, marked */

(function () {
  const CMS_PORT = 3000;
  const API_BASE = `http://${window.location.hostname}:${CMS_PORT}/api`;

  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;
  let isIframeReady = false;
  
  // Deterministic Scroll State
  let isRemoteScrolling = false;
  let scrollThrottleTimer = null;

  console.log('Control Tower v7.5: Precision Sync Active');

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

  // --- 2. SYNC ENGINE ---

  function syncToIframe() {
    const iframe = document.getElementById('site-iframe');
    if (!iframe || !iframe.contentWindow || !simplemde || !isIframeReady) return;

    const raw = simplemde.value();
    const fmMatch = raw.match(/^---([\s\S]*?)---/);
    let title = 'Draft';
    if (fmMatch) {
      const t = fmMatch[1].match(/title:\s*['"]?(.+?)['"]?\n/);
      if (t) title = t[1];
    }
    const html = marked.parse(raw.replace(/^---[\s\S]*?---/, ''));
    iframe.contentWindow.postMessage({ type: 'CMS_SYNC', title, body: html }, '*');
  }

  function broadcastScroll() {
    if (isRemoteScrolling || !simplemde || !isIframeReady) return;
    
    const info = simplemde.codemirror.getScrollInfo();
    const max = info.height - info.clientHeight;
    if (max <= 0) return;
    const percentage = info.top / max;

    const iframe = document.getElementById('site-iframe');
    iframe.contentWindow.postMessage({ type: 'CMS_SCROLL', percentage }, '*');
  }

  window.addEventListener('message', (event) => {
    if (event.data.type === 'IFRAME_READY') {
      isIframeReady = true;
      event.source.postMessage({ type: 'IFRAME_READY_ACK' }, '*');
      document.getElementById('iframe-loader')?.classList.add('opacity-0', 'pointer-events-none');
      syncToIframe();
    }
    
    if (event.data.type === 'IFRAME_SCROLL' && !isRemoteScrolling && simplemde) {
      isRemoteScrolling = true;
      const info = simplemde.codemirror.getScrollInfo();
      const target = event.data.percentage * (info.height - info.clientHeight);
      
      simplemde.codemirror.scrollTo(null, target);
      
      clearTimeout(scrollThrottleTimer);
      scrollThrottleTimer = setTimeout(() => { isRemoteScrolling = false; }, 100);
    }
  });

  // --- 3. CMS LOGIC ---

  async function editEntry(collection, slug) {
    currentSlug = slug; isIframeReady = false;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', () => { syncToIframe(); });
      simplemde.codemirror.on('scroll', broadcastScroll);
    }
    simplemde.value(entry.raw || '');
    
    const iframe = document.getElementById('site-iframe');
    iframe.src = `/${collection}/${slug}/?cms_preview=true`;
    document.getElementById('iframe-loader')?.classList.remove('opacity-0', 'pointer-events-none');
  }

  // --- 4. NAVIGATION & BOOT ---
  function router() {
    const section = (window.location.hash || '#dashboard').substring(1).split('?')[0];
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');
    const activeBtn = document.querySelector(`a[href="#${section === 'editor' ? 'content' : section}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');
    if (section === 'dashboard') loadDashboard();
    if (section === 'content') loadCollection(currentCollection);
  }
  window.onhashchange = router;

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (container && Array.isArray(items)) {
      container.innerHTML = items.map(i => `
        <div class="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 shadow-sm transition-all hover:border-indigo-600">
          <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
          <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
        </div>
      `).join('');
    }
  };

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
  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', () => { 
      document.body.classList.add('resizing');
      document.getElementById('site-iframe').style.pointerEvents = 'none';
      const move = (e) => { const x = e.clientX - 256; if (x > 350 && x < window.innerWidth - 400) leftSide.style.flexBasis = `${x}px`; };
      const up = () => { document.body.classList.remove('resizing'); document.getElementById('site-iframe').style.pointerEvents = 'auto'; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    });
  }

  async function saveContent() { const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw: simplemde.value() }); if (res) notify('Site Updated'); }
  function notify(msg) { const toast = document.createElement('div'); toast.className = 'bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl'; toast.textContent = msg; document.getElementById('toaster').appendChild(toast); setTimeout(() => toast.toast.remove(), 3000); }
  async function loadDashboard() { const stats = await api('/admin/stats'); if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join(''); }

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