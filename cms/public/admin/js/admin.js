/**
 * MindFull Control Tower v5.5
 * Definitive Robust Architecture & Error Boundary
 */

(function () {
  console.log('Control Tower v5.5: Pre-flight check started.');

  // --- 1. ERROR BOUNDARY ---
  window.onerror = function(msg, url, line) {
    const err = `CRITICAL FAILURE: ${msg} at line ${line}`;
    console.error(err);
    document.body.innerHTML = `
      <div style="background:#1a1c23;color:white;padding:40px;height:100vh;font-family:sans-serif;">
        <h1 style="color:#ef4444">Dashboard Link Broken</h1>
        <p style="color:#94a3b8">The Control Tower script crashed during initialization.</p>
        <pre style="background:#000;padding:20px;border-radius:10px;color:#00ff00;overflow:auto;">${err}</pre>
        <button onclick="location.reload()" style="background:#4f46e5;color:white;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;cursor:pointer;">Retry Link</button>
      </div>
    `;
  };

  const API_BASE = '/api';
  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  // --- 2. CORE UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl text-white font-bold shadow-2xl animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    const container = document.getElementById('toaster');
    if (container) container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 
      'Content-Type': 'application/json',
      'x-xsrf-token': (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : ''
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
    } catch (e) {
      console.error('API Error:', e);
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 3. THE ROUTER ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    console.log('Mounting Segment:', section);

    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(s => s.classList.add('hidden'));

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) {
      target.classList.remove('hidden');
    } else {
      console.warn(`Section not found: ${section}, falling back to dashboard`);
      window.location.hash = '#dashboard';
      return;
    }

    const mappedId = section.startsWith('user-') ? 'users' : (section === 'editor' ? 'content' : (section === 'quiz-editor' ? 'quizzes' : section));
    const activeBtn = document.querySelector(`a[href="#${mappedId}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = section.toUpperCase();

    // Data Loaders
    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
    if (section === 'users') loadUsers();
    if (section === 'media') loadMedia();
    if (section === 'quizzes') loadQuizzes();
    if (section === 'inquiries') loadInquiries();
  }

  window.onhashchange = router;

  // --- 4. CMS MANAGER ---

  window.loadCollection = async function (name) {
    console.log('Fetching Collection:', name);
    currentCollection = name;
    
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container) return;

    if (!Array.isArray(items)) {
      container.innerHTML = '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Handshake failed. Refreshing connection...</p>';
      return;
    }

    container.innerHTML = items.map(i => `
      <div class="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 hover:border-indigo-600 transition-all shadow-sm">
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

    const editorTitle = document.getElementById('editor-title');
    if (editorTitle) editorTitle.textContent = `Editing: ${slug}`;
    
    // Mount Editor with Safety
    if (typeof SimpleMDE !== 'undefined') {
      if (!simplemde) {
        simplemde = new SimpleMDE({ 
          element: document.getElementById('editor-textarea'), 
          spellChecker: false, 
          status: false 
        });
        simplemde.codemirror.on('change', updatePreview);
      }
      simplemde.value(entry.body || '');
    }

    renderFMFields(entry.data || {});
    
    const urlDisplay = document.getElementById('live-url-display');
    if (urlDisplay) {
      const fullUrl = `http://localhost:1313/${collection}/${slug}/`;
      urlDisplay.textContent = fullUrl;
      urlDisplay.closest('a').href = fullUrl;
    }
    
    updatePreview();
  }

  function renderFMFields(data) {
    const fields = ['title', 'description', 'category', 'illustration'];
    const container = document.getElementById('frontmatter-fields');
    if (!container) return;

    container.innerHTML = fields.map(f => `
      <div class="space-y-1">
        <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest">${f}</label>
        <input id="fm-${f}" value="${data[f] || ''}" class="fm-input w-full p-2.5 bg-slate-50 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-indigo-500/10">
      </div>
    `).join('');
    
    document.querySelectorAll('.fm-input').forEach(i => i.addEventListener('input', updatePreview));
  }

  function updatePreview() {
    const title = document.getElementById('fm-title')?.value;
    const category = document.getElementById('fm-category')?.value;
    const illustration = document.getElementById('fm-illustration')?.value;
    const body = simplemde ? simplemde.value() : '';

    const pTitle = document.getElementById('preview-title');
    if (pTitle) pTitle.textContent = title || 'UNTITLED';
    
    const pCat = document.getElementById('preview-category');
    if (pCat) pCat.textContent = category || 'JOURNAL';
    
    const pHero = document.getElementById('preview-hero');
    if (pHero) {
      if (illustration) {
        pHero.innerHTML = `<img src="/illustrations/${illustration}.svg" class="max-h-64 mx-auto" onerror="this.style.display='none'">`;
      } else {
        pHero.innerHTML = '<i class="fa-solid fa-image text-indigo-100 text-6xl"></i>';
      }
    }

    const pLive = document.getElementById('live-preview');
    if (pLive && typeof marked !== 'undefined') {
      pLive.innerHTML = marked.parse(body);
    }
  }

  async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
      const el = document.getElementById(`fm-${f}`);
      if (el) data[f] = el.value;
    });
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body: simplemde.value() });
    if (res) notify('Published to Hugo');
  }

  // --- 5. EVENT DELEGATION ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const slug = btn.getAttribute('data-slug');
    const collection = btn.getAttribute('data-collection');

    if (action === 'edit-entry') editEntry(collection, slug);
    if (action === 'publish') saveContent();
    if (action === 'logout') logout();
    if (action === 'load-collection') window.loadCollection(btn.getAttribute('data-name'));
  });

  // --- 6. DASHBOARD & BOOT ---
  async function loadDashboard() {
    const stats = await api('/admin/stats');
    if (stats) {
      document.getElementById('stat-users').textContent = stats.totalUsers;
      document.getElementById('stat-views').textContent = stats.totalViews;
      document.getElementById('stat-rating').textContent = stats.averageRating;
      document.getElementById('stat-new-leads').textContent = stats.newInquiries;
    }
  }

  // Generic Empty Loaders
  async function loadUsers() { console.log('Users logic standby'); }
  async function loadMedia() { console.log('Media logic standby'); }
  async function loadQuizzes() { console.log('Quizzes logic standby'); }
  async function loadInquiries() { console.log('Inquiries logic standby'); }

  function init() {
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
    }
  }

  init();
})();
