/**
 * MindFull Control Tower v15.0
 * The Proper CMS Overhaul: Industrial Bridge Sync
 */

/* global SimpleMDE, marked */

// --- 1. THE GLOBAL BRIDGE ---
window.CMS_BRIDGE = {
  isSyncing: false,
  iframeWin: null,
  simplemde: null,

  registerIframe: function (win) {
    console.log('BRIDGE: Connected.');
    this.iframeWin = win;
    document.getElementById('iframe-loader')?.classList.add('opacity-0', 'pointer-events-none');

    // Theme Mirror
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme-preference') === 'dark';
    if (isDark) win.document.documentElement.classList.add('dark');

    this.syncContent();
  },

  reportIframeScroll: function (perc) {
    if (this.isSyncing || !this.simplemde) return;
    this.isSyncing = true;
    const smde = this.simplemde;
    const info = smde.codemirror.getScrollInfo();
    smde.codemirror.scrollTo(null, perc * (info.height - info.clientHeight));
    setTimeout(() => {
      this.isSyncing = false;
    }, 100);
  },

  syncContent: function () {
    if (!this.iframeWin || !this.simplemde) return;
    const raw = this.simplemde.value();

    // Frontmatter Extraction
    const fmMatch = raw.match(/^---([\s\S]+?)---\s*/);
    let title = 'Draft',
      category = 'GENERAL';
    if (fmMatch) {
      const t = fmMatch[1].match(/title:\s*['"]?(.+?)['"]?\n/);
      const c = fmMatch[1].match(/category:\s*['"]?(.+?)['"]?\n/);
      if (t) title = t[1];
      if (c) category = c[1];
    }

    const bodyHtml = marked.parse(raw.replace(/^---[\s\S]+?---\s*/, ''));

    const doc = this.iframeWin.document;
    const root = doc.querySelector('.fidelity-content') || doc.querySelector('.prose');
    const titleEl = doc.querySelector('.fidelity-title') || doc.querySelector('h1');
    const catEl = doc.querySelector('.fidelity-category');

    if (root) root.innerHTML = bodyHtml;
    if (titleEl) titleEl.textContent = title;
    if (catEl) catEl.textContent = category;
  },
};

(function () {
  const CMS_PORT = 3000;
  const API_BASE = `http://${window.location.hostname}:${CMS_PORT}/api`;
  let currentCollection = 'posts';
  let currentSlug = null;

  marked.setOptions({ gfm: true, breaks: true });

  function handleEditorScroll() {
    const bridge = window.CMS_BRIDGE;
    if (bridge.isSyncing || !bridge.iframeWin || !bridge.simplemde) return;
    bridge.isSyncing = true;

    const info = bridge.simplemde.codemirror.getScrollInfo();
    const max = info.height - info.clientHeight;
    if (max > 0) {
      const perc = info.top / max;
      const win = bridge.iframeWin;
      const s = win.document.scrollingElement || win.document.documentElement;
      const iframeMax = s.scrollHeight - win.innerHeight;
      win.scrollTo(0, perc * iframeMax);
    }
    setTimeout(() => {
      bridge.isSyncing = false;
    }, 100);
  }

  // --- 2. CORE API ---
  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      'x-xsrf-token':
        (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2
          ? parts.pop().split(';').shift()
          : '',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        credentials: 'include',
      });
      if (res.status === 401) {
        logout();
        return null;
      }
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function logout() {
    localStorage.clear();
    window.location.reload();
  }

  // --- 3. CMS LOGIC ---
  async function editEntry(collection, slug) {
    currentCollection = collection;
    currentSlug = slug;
    window.location.hash = `#editor/${collection}/${slug}`;
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!window.CMS_BRIDGE.simplemde) {
      window.CMS_BRIDGE.simplemde = new SimpleMDE({
        element: document.getElementById('editor-textarea'),
        spellChecker: false,
        status: false,
      });
      window.CMS_BRIDGE.simplemde.codemirror.on('change', () => window.CMS_BRIDGE.syncContent());
      window.CMS_BRIDGE.simplemde.codemirror.on('scroll', handleEditorScroll);
    }
    window.CMS_BRIDGE.simplemde.value(entry.raw || '');

    const iframe = document.getElementById('site-iframe');
    iframe.src = `/${collection}/${slug}/index.snippet`;
    document.getElementById('iframe-loader')?.classList.remove('opacity-0', 'pointer-events-none');
  }

  // --- 4. NAVIGATION ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const parts = hash.substring(1).split('/');
    const section = parts[0];
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');
    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection('posts');
    if (section === 'editor' && parts[1] && parts[2]) {
      if (currentSlug !== parts[2]) editEntry(parts[1], parts[2]);
    }
  }
  window.onhashchange = router;

  window.loadCollection = async function (name) {
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (container && Array.isArray(items)) {
      container.innerHTML = items
        .map(
          i => `
        <div class="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm transition-all hover:border-indigo-600">
          <h4 class="font-black text-gray-900 dark:text-white mb-6 flex-1">${i.data.title || i.slug}</h4>
          <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2.5 bg-gray-900 dark:bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Configure</button>
        </div>
      `,
        )
        .join('');
    }
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'logout') logout();
    if (action === 'load-collection') window.loadCollection(btn.getAttribute('data-name'));
    if (action === 'edit-entry')
      editEntry(btn.getAttribute('data-collection'), btn.getAttribute('data-slug'));
    if (action === 'publish')
      api(`/content/${currentCollection}/${currentSlug}/raw`, 'POST', {
        raw: window.CMS_BRIDGE.simplemde.value(),
      }).then(r => r && notify('Published to Hugo Site!'));
  });

  const resizer = document.getElementById('drag-handle');
  const editorSide = document.getElementById('editor-side');
  if (resizer && editorSide) {
    resizer.addEventListener('mousedown', () => {
      document.getElementById('site-iframe').style.pointerEvents = 'none';
      const move = e => {
        const x = window.innerWidth - e.clientX;
        if (x > 400 && x < window.innerWidth - 400) editorSide.style.flexBasis = `${x}px`;
      };
      const up = () => {
        document.getElementById('site-iframe').style.pointerEvents = 'auto';
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
  }

  async function loadDashboard() {
    const stats = await api('/admin/stats');
    if (stats)
      document.getElementById('dashboard-stats').innerHTML = Object.entries(stats)
        .map(
          ([k, v]) =>
            `<div class="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">${k}</p><h3 class="text-2xl font-black text-gray-900 dark:text-white">${v}</h3></div>`,
        )
        .join('');
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
  }

  const lBtn = document.getElementById('login-submit-btn');
  if (lBtn) {
    lBtn.onclick = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('mindfull_admin_token', data.token);
        localStorage.setItem('mindfull_admin_user', JSON.stringify(data.user));
        location.reload();
      }
    };
  }
})();
