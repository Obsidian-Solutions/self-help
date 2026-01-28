/**
 * MindFull Control Tower v6.5
 * Handshake Sync Engine & Total Visibility
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

  console.log('Control Tower v6.5: Handshake Ready');

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
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
      if (res.status === 401) { logout(); return null; }
      return await res.json();
    } catch (e) { return null; }
  }

  function logout() { localStorage.clear(); window.location.hash = ''; window.location.reload(); }

  // --- 2. THE SYNC ENGINE (HANDSHAKE) ---

  // Listen for 'READY' signal from the Hugo Iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'IFRAME_READY') {
      console.log('Handshake: Hugo Iframe is Online.');
      isIframeReady = true;
      triggerRealtimeSync();
      const loader = document.getElementById('iframe-loader');
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
    }
  });

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
    const html = marked.parse(raw.replace(/^---[\s\S]*?---/, ''));
    
    iframe.contentWindow.postMessage({ type: 'CMS_SYNC', title, category, body: html }, '*');
  }

  // --- 3. ROUTER ---
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

  // --- 4. CMSMANAGER ---

  window.loadCollection = async function (name) {
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
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    isIframeReady = false;
    window.location.hash = '#editor';
    
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    document.getElementById('editor-filename').textContent = `${collection}/${slug}`;

    // Force re-mount of editor to ensure visibility
    const area = document.getElementById('editor-textarea');
    if (area) {
      if (simplemde) {
        simplemde.toTextArea();
        simplemde = null;
      }
      simplemde = new SimpleMDE({ element: area, spellChecker: false, status: false });
      simplemde.codemirror.on('change', triggerRealtimeSync);
      simplemde.value(entry.raw || '');
    }

    const iframe = document.getElementById('site-iframe');
    const targetUrl = `http://${window.location.hostname}:${HUGO_PORT}/${collection}/${slug}/?cms_preview=true`;
    iframe.src = targetUrl;
    document.getElementById('live-url-display').textContent = targetUrl.split('?')[0];
    
    const loader = document.getElementById('iframe-loader');
    if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');
    
    // Safety clear if handshake fails
    setTimeout(() => { if (loader) loader.classList.add('opacity-0', 'pointer-events-none'); }, 4000);
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) notify('Staged to Hugo');
  }

  // --- 5. BOOT ---
  function init() {
    const lBtn = document.getElementById('login-submit-btn');
    if (lBtn) {
      lBtn.onclick = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('mindfull_admin_token', data.token);
          localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
          location.hash = '#dashboard'; location.reload();
        }
      };
    }

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

    // Global Delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'logout') logout();
      if (action === 'load-collection') window.loadCollection(btn.getAttribute('data-name'));
      if (action === 'edit-entry') editEntry(btn.getAttribute('data-collection'), btn.getAttribute('data-slug'));
      if (action === 'publish') saveContent();
    });
  }

  async function loadDashboard() {
    const stats = await api('/admin/stats'); 
    if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join('');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();