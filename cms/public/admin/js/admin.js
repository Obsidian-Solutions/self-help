/**
 * MindFull Control Tower v6.4
 * Connectivity Diagnostic & Hardened Gateway
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

  console.log('Control Tower v6.4: Diagnostic Gateway Active');

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
    } catch (e) { return null; }
  }

  function logout() { localStorage.clear(); window.location.hash = ''; window.location.reload(); }

  // --- 2. THE ROUTER ---
  function router() {
    const token = localStorage.getItem('mindfull_admin_token');
    if (!token) return;

    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) { target.classList.remove('hidden'); }

    const activeBtn = document.querySelector(`a[href="#${section === 'editor' ? 'content' : section}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = section.toUpperCase();

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
  }

  window.onhashchange = router;

  // --- 3. DIAGNOSTIC BOOT ---
  async function runDiagnostics() {
    const statusEl = document.getElementById('login-status');
    if (!statusEl) return;

    try {
      const res = await fetch(`${API_BASE}/health`, { credentials: 'include' });
      if (res.ok) {
        statusEl.innerHTML = '<span class="text-emerald-500">API: ONLINE</span>';
      } else {
        statusEl.innerHTML = '<span class="text-amber-500">API: UNAUTHORIZED</span>';
      }
    } catch (e) {
      statusEl.innerHTML = '<span class="text-red-500">API: UNREACHABLE</span>';
    }
  }

  // --- 4. CMS SYNC ---
  function triggerRealtimeSync() {
    const iframe = document.getElementById('site-iframe');
    if (!iframe || !iframe.contentWindow || !simplemde) return;
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

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;
    container.innerHTML = items.map(i => `<div class="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 shadow-sm transition-all hover:border-indigo-600"><h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4><button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button></div>`).join('');
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;
    document.getElementById('editor-filename').textContent = `${collection}/${slug}`;
    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', triggerRealtimeSync);
    }
    simplemde.value(entry.raw || '');
    const iframe = document.getElementById('site-iframe');
    const targetUrl = `http://${window.location.hostname}:${HUGO_PORT}/${collection}/${slug}/?cms_preview=true`;
    iframe.src = targetUrl;
    document.getElementById('live-url-display').textContent = targetUrl.split('?')[0];
    
    const loader = document.getElementById('iframe-loader');
    if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');
    
    iframe.onload = () => {
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
      triggerRealtimeSync();
    };
    
    setTimeout(() => { if (loader) loader.classList.add('opacity-0', 'pointer-events-none'); }, 3000);
  }

  async function saveContent() {
    const raw = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', { raw });
    if (res) notify('Changes Saved');
  }

  // --- 5. INITIALIZATION ---
  function init() {
    console.log('DOM Initialized. Wiring listeners.');
    
    const loginBtn = document.getElementById('login-submit-btn');
    if (loginBtn) {
      loginBtn.onclick = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const statusEl = document.getElementById('login-status');
        
        if (!email || !password) return;
        loginBtn.disabled = true;
        if (statusEl) statusEl.textContent = "Negotiating Port Bridge...";

        try {
          const res = await fetch(`${API_BASE}/auth/login`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // MANDATORY for cross-port sessions
          });
          const data = await res.json();

          if (res.ok && data.token) {
            localStorage.setItem('mindfull_admin_token', data.token);
            localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
            if (statusEl) statusEl.textContent = "Authorized! Booting Engine...";
            setTimeout(() => { window.location.hash = '#dashboard'; window.location.reload(); }, 500);
          } else {
            if (statusEl) statusEl.textContent = data.message || "Identity Reject";
            loginBtn.disabled = false;
          }
        } catch (err) {
          if (statusEl) statusEl.textContent = "Bridge Offline (3000)";
          loginBtn.disabled = false;
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
      const nameEl = document.getElementById('admin-display-name');
      if (nameEl) nameEl.textContent = user.name;
      router();
    } else {
      document.getElementById('login-modal').classList.remove('hidden');
      runDiagnostics();
    }

    // Delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'logout') logout();
      if (action === 'load-collection') window.loadCollection(btn.getAttribute('data-name'));
      if (action === 'edit-entry') editEntry(btn.getAttribute('data-collection'), btn.getAttribute('data-slug'));
      if (action === 'publish') saveContent();
      if (action === 'refresh-preview') { if (currentSlug) editEntry(currentCollection, currentSlug); }
    });
  }

  async function loadDashboard() {
    const stats = await api('/admin/stats'); 
    if (stats) document.getElementById('dashboard-stats').innerHTML = Object.entries(stats).map(([k,v]) => `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-slate-900">${v}</h3></div>`).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
