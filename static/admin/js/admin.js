/**
 * MindFull Control Tower v7.3
 * High-Precision Sync-Scroll & Stateful Router
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
  
  // High-precision scroll state
  let scrollLock = false;
  let scrollTimeout = null;

  console.log('Control Tower v7.3 Booting: High-Precision Sync Active');

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
    const headers = { 'Content-Type': 'application/json', 'x-xsrf-token': getCookie('XSRF-TOKEN') };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) { return null; }
  }

  function logout() { localStorage.clear(); window.location.hash = ''; window.location.reload(); }

  // --- 2. SYNC ENGINE (CONTENT & SCROLL) ---

  function triggerRealtimeSync() {
    const iframe = document.getElementById('site-iframe');
    if (!iframe || !iframe.contentWindow || !simplemde || !isIframeReady) return;

    const raw = simplemde.value();
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

    iframe.contentWindow.postMessage({ type: 'CMS_SYNC', title, category, body: bodyHtml }, '*');
  }

  // --- SCROLL SYNC LOGIC ---
  function handleEditorScroll() {
    if (scrollLock || !simplemde || !isIframeReady) return;
    
    const info = simplemde.codemirror.getScrollInfo();
    const percentage = info.top / (info.height - info.clientHeight);
    
    const iframe = document.getElementById('site-iframe');
    if (iframe && iframe.contentWindow) {
      scrollLock = true;
      iframe.contentWindow.postMessage({ type: 'CMS_SCROLL', percentage }, '*');
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { scrollLock = false; }, 50);
    }
  }

  // Receive message from Iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'IFRAME_READY') {
      isIframeReady = true;
      const loader = document.getElementById('iframe-loader');
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
      triggerRealtimeSync();
    }
    
    if (event.data.type === 'IFRAME_SCROLL' && !scrollLock && simplemde) {
      scrollLock = true;
      const info = simplemde.codemirror.getScrollInfo();
      const targetTop = event.data.percentage * (info.height - info.clientHeight);
      
      simplemde.codemirror.scrollTo(null, targetTop);
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { scrollLock = false; }, 50);
    }
  });

  // --- 3. ROUTER & NAVIGATION ---
  function router() {
    const token = localStorage.getItem('mindfull_admin_token');
    if (!token) return;

    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
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

  // --- 4. INTERACTION HUB ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'logout') logout();
    if (action === 'load-collection') window.loadCollection(btn.getAttribute('data-name'));
    if (action === 'edit-entry') editEntry(btn.getAttribute('data-collection'), btn.getAttribute('data-slug'));
    if (action === 'publish') saveContent();
  });

  // Resizer
  const resizer = document.getElementById('drag-handle');
  const leftSide = document.getElementById('editor-side');
  let isResizing = false;

  if (resizer && leftSide) {
    resizer.addEventListener('mousedown', () => { 
      isResizing = true; 
      resizer.classList.add('resizing');
      const iframe = document.getElementById('site-iframe');
      if (iframe) iframe.style.pointerEvents = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const x = e.clientX - 256;
      if (x > 350 && x < window.innerWidth - 400) leftSide.style.flexBasis = `${x}px`;
    });
    document.addEventListener('mouseup', () => { 
      isResizing = false; 
      resizer.classList.remove('resizing');
      const iframe = document.getElementById('site-iframe');
      if (iframe) iframe.style.pointerEvents = 'auto';
    });
  }

  // --- 5. CMS ENGINE ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;
    container.innerHTML = items.map(i => `<div class="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 shadow-sm transition-all hover:border-indigo-600"><h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4><button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button></div>`).join('');
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    isIframeReady = false;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', triggerRealtimeSync);
      simplemde.codemirror.on('scroll', handleEditorScroll);
    }
    simplemde.value(entry.raw || '');

    // Render Metadata Fields
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