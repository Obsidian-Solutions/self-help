/**
 * MindFull Control Tower v7.1
 * Sync-Scroll Engine & High-Fidelity Snippet Controller
 */

/* global SimpleMDE, marked */

(function () {
  const CMS_PORT = 3000;
  const API_BASE = `http://${window.location.hostname}:${CMS_PORT}/api`;

  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;
  let isIframeReady = false;
  let isSyncingScroll = false;

  console.log('Control Tower v7.1 Booting: Sync-Scroll Active');

  // --- 1. CORE UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl text-white font-bold shadow-2xl animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    document.getElementById('toaster').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json', 'x-xsrf-token': getCookie('XSRF-TOKEN') };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) {
      notify('Link Interrupted', 'error');
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. THE SYNC ENGINE ---

  function triggerRealtimeSync() {
    const iframe = document.getElementById('site-iframe');
    if (!iframe || !iframe.contentWindow || !simplemde || !isIframeReady) return;

    const raw = simplemde.value();
    
    // Extract metadata from raw text for the snippet header
    const fmMatch = raw.match(/^---([\s\S]*?)---/);
    let title = 'Draft', category = 'GENERAL';
    if (fmMatch) {
      const fm = fmMatch[1];
      const t = fm.match(/title:\s*['"]?(.+?)['"]?\n/);
      const c = fm.match(/category:\s*['"]?(.+?)['"]?\n/);
      if (t) title = t[1]; if (c) category = c[1];
    }

    const bodyMarkdown = raw.replace(/^---[\s\S]*?---/, '');
    const bodyHtml = marked.parse(bodyMarkdown);

    iframe.contentWindow.postMessage({
      type: 'CMS_SYNC',
      title,
      category,
      body: bodyHtml
    }, '*');
  }

  // Sync-Scroll Logic
  function handleEditorScroll() {
    if (isSyncingScroll || !simplemde || !isIframeReady) return;
    const info = simplemde.codemirror.getScrollInfo();
    const percentage = info.top / (info.height - info.clientHeight);
    
    const iframe = document.getElementById('site-iframe');
    if (iframe && iframe.contentWindow) {
      isSyncingScroll = true;
      iframe.contentWindow.postMessage({ type: 'CMS_SCROLL', percentage }, '*');
      setTimeout(() => { isSyncingScroll = false; }, 50);
    }
  }

  // --- 3. THE ROUTER ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) { target.classList.remove('hidden'); target.classList.add('animate-in'); }

    const mappedId = section === 'editor' ? 'content' : section;
    const activeBtn = document.querySelector(`a[href="#${mappedId}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
  }

  window.onhashchange = router;

  // --- 4. INTERACTION HUB ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const slug = btn.getAttribute('data-slug');
    const name = btn.getAttribute('data-name');

    switch (action) {
      case 'logout': logout(); break;
      case 'load-collection': window.loadCollection(name); break;
      case 'edit-entry': editEntry(btn.getAttribute('data-collection'), slug); break;
      case 'publish': saveContent(); break;
    }
  });

  // Resizer
  const resizer = document.getElementById('drag-handle');
  const leftSide = document.getElementById('editor-side');
  let isResizing = false;

  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', () => { 
      isResizing = true; resizer.classList.add('resizing');
      document.getElementById('site-iframe').style.pointerEvents = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const x = e.clientX - 256;
      if (x > 350 && x < window.innerWidth - 400) leftSide.style.flexBasis = `${x}px`;
    });
    document.addEventListener('mouseup', () => { 
      isResizing = false; resizer.classList.remove('resizing');
      document.getElementById('site-iframe').style.pointerEvents = 'auto';
    });
  }

  // Iframe Messages
  window.addEventListener('message', (event) => {
    if (event.data.type === 'IFRAME_READY') {
      isIframeReady = true;
      const loader = document.getElementById('iframe-loader');
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
      triggerRealtimeSync();
    }
    if (event.data.type === 'IFRAME_SCROLL' && !isSyncingScroll) {
      isSyncingScroll = true;
      const info = simplemde.codemirror.getScrollInfo();
      simplemde.codemirror.scrollTo(null, event.data.percentage * (info.height - info.clientHeight));
      setTimeout(() => { isSyncingScroll = false; }, 50);
    }
  });

  // --- 5. CMS ENGINE ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="admin-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all">
        <span class="text-[9px] font-black uppercase text-indigo-600 mb-2">${i.data.category || 'Draft'}</span>
        <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
        <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure &rarr;</button>
      </div>
    `).join('');
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    isIframeReady = false;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ 
        element: document.getElementById('editor-textarea'), 
        spellChecker: false, 
        status: false 
      });
      simplemde.codemirror.on('change', triggerRealtimeSync);
      simplemde.codemirror.on('scroll', handleEditorScroll);
    }
    simplemde.value(entry.raw || '');

    // Render Fields
    const fields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fields.map(f => `
      <div><label class="text-[9px] font-black uppercase text-slate-400 block mb-1">${f}</label><input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-2 bg-slate-50 rounded-lg border-none text-xs font-bold"></div>
    `).join('');

    const iframe = document.getElementById('site-iframe');
    iframe.src = `/${collection}/${slug}/?cms_preview=true`;
    document.getElementById('live-url-display').textContent = window.location.origin + `/${collection}/${slug}/`;
    
    const loader = document.getElementById('iframe-loader');
    if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) notify('Changes Published');
  }

  // --- 6. BOOT ---
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

  const lBtn = document.getElementById('login-submit-btn');
  if (lBtn) {
    lBtn.onclick = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('mindfull_admin_token', data.token); localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user)); location.reload(); }
    };
  }

  async function loadDashboard() {
    const stats = await api('/admin/stats'); 
    if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join('');
  }

  init();
})();
