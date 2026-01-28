/**
 * MindFull Control Tower v5.4
 * Wagtail-Mirror Fidelity Engine & Universal Router
 */

/* global SimpleMDE, FileReader, confirm, marked */

(function () {
  const API_BASE = '/api';
  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;

  console.log('Control Tower v5.4: Fidelity Active');

  // --- 1. CORE API ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl text-white font-bold shadow-2xl animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    document.getElementById('toaster').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json', 'x-xsrf-token': (parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`)).length === 2 ? parts.pop().split(';').shift() : '' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
      if (res.status === 401) { logout(); return null; }
      return res.json();
    } catch (e) { notify('API Connection Error', 'error'); return null; }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. ROUTER & NAVIGATION ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0];
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active', 'text-white', 'bg-slate-800'));

    const target = document.getElementById(`section-${section}`);
    if (target) { target.classList.remove('hidden'); target.classList.add('animate-in'); }

    const mappedId = section.startsWith('user-') ? 'users' : (section === 'editor' ? 'content' : (section === 'quiz-editor' ? 'quizzes' : section));
    const activeBtn = document.querySelector(`a[href="#${mappedId}"]`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white', 'bg-slate-800');

    document.getElementById('breadcrumb-active').textContent = section.toUpperCase();

    // Data Loaders
    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
    if (section === 'users') loadUsers();
    if (section === 'media') loadMedia();
    if (section === 'quizzes') loadQuizzes();
  }

  window.onhashchange = router;

  // --- 3. EVENT DELEGATION ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const slug = btn.getAttribute('data-slug');
    const name = btn.getAttribute('data-name');

    switch (action) {
      case 'logout': logout(); break;
      case 'load-collection': window.loadCollection(name); break;
      case 'new-entry': openNewEntry(); break;
      case 'edit-entry': editEntry(btn.getAttribute('data-collection'), slug); break;
      case 'publish': saveContent(); break;
      case 'copy-url': navigator.clipboard.writeText(btn.getAttribute('data-url')); notify('URL Copied'); break;
      case 'delete-media': if (confirm('Purge?')) { await api(`/media/${name}`, 'DELETE'); loadMedia(); } break;
    }
  });

  // --- 4. CMS ENGINE & LIVE MIRROR ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    
    // Tab Highlighting
    document.querySelectorAll('[data-action="load-collection"]').forEach(b => {
      b.classList.remove('bg-indigo-50', 'text-indigo-600', 'border-indigo-100');
      b.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
    });
    const activeTab = document.querySelector(`[data-action="load-collection"][data-name="${name}"]`);
    if (activeTab) {
      activeTab.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
      activeTab.classList.add('bg-indigo-50', 'text-indigo-600', 'border-indigo-100');
    }

    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="admin-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all">
        <span class="text-[9px] font-black uppercase text-indigo-600 mb-2">${i.data.category || 'Draft'}</span>
        <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
        <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-indigo-700 transition-all">Configure &rarr;</button>
      </div>
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Repository empty.</p>';
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    document.getElementById('editor-title').textContent = `Fidelity Editor: ${slug}`;
    
    // Mount Editor
    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', updatePreview);
    }
    simplemde.value(entry.body || '');

    // Render Config
    renderFMFields(entry.data || {});
    
    // Live Browser Mock
    const fullUrl = `http://localhost:1313/${collection}/${slug}/`;
    document.getElementById('live-url-display').textContent = fullUrl;
    document.getElementById('live-url-display').parentNode.parentElement.querySelector('a').href = fullUrl;
    
    updatePreview();
  }

  function renderFMFields(data) {
    const fields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fields.map(f => `
      <div class="space-y-1">
        <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest">${f}</label>
        <input id="fm-${f}" value="${data[f] || ''}" class="fm-input w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10">
      </div>
    `).join('');
    document.querySelectorAll('.fm-input').forEach(i => i.addEventListener('input', updatePreview));
  }

  function updatePreview() {
    const title = document.getElementById('fm-title')?.value;
    const category = document.getElementById('fm-category')?.value;
    const illustration = document.getElementById('fm-illustration')?.value;
    const body = simplemde ? simplemde.value() : '';

    document.getElementById('preview-title').textContent = title || 'UNTITLED';
    document.getElementById('preview-category').textContent = category || 'JOURNAL';
    
    const hero = document.getElementById('preview-hero');
    if (illustration) {
      hero.innerHTML = `<img src="/illustrations/${illustration}.svg" class="max-h-64 drop-shadow-2xl mx-auto" onerror="this.src='https://images.unsplash.com/photo-1518173946687-a4c8a9833d8e?w=400&q=80'">`;
    } else {
      hero.innerHTML = '<i class="fa-solid fa-image text-indigo-100 text-6xl"></i>';
    }

    document.getElementById('live-preview').innerHTML = marked.parse(body);
  }

  async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
      data[f] = document.getElementById(`fm-${f}`).value;
    });
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body: simplemde.value() });
    if (res) notify('Site Content Published');
  }

  // Basic Loaders for others
  async function loadDashboard() { const stats = await api('/admin/stats'); if (stats) { document.getElementById('stat-users').textContent = stats.totalUsers; document.getElementById('stat-views').textContent = stats.totalViews; document.getElementById('stat-rating').textContent = stats.averageRating; document.getElementById('stat-new-leads').textContent = stats.newInquiries; } }
  async function loadUsers() { const users = await api('/admin/users'); const container = document.getElementById('users-table-body'); if (container && Array.isArray(users)) { container.innerHTML = users.map(u => `<tr class="hover:bg-slate-50"><td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${u.name}</p></td><td class="px-8 py-6 text-xs text-slate-400 font-bold">${u.role}</td><td class="px-8 py-6 text-right"><button data-action="view-profile" data-id="${u.id}" class="text-indigo-600 font-black text-[10px] uppercase">Review</button></td></tr>`).join(''); } }
  async function loadMedia() { const items = await api('/media'); const container = document.getElementById('media-grid'); if (container && Array.isArray(items)) { container.innerHTML = items.map(i => `<div class="admin-card p-2 relative group overflow-hidden"><img src="${i.url}" class="w-full aspect-square object-cover rounded-xl"><div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity"><button data-action="copy-url" data-url="${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase">Link</button></div></div>`).join(''); } }
  async function loadQuizzes() { const items = await api('/admin/quizzes'); const container = document.getElementById('quizzes-list'); if (container && Array.isArray(items)) { container.innerHTML = items.map(q => `<div class="admin-card p-6 h-full flex flex-col group"><span class="text-[9px] font-black text-indigo-600 uppercase mb-2">${q.status}</span><h4 class="font-black text-slate-900 mb-6 flex-1">${q.title}</h4><button class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Configure</button></div>`).join(''); } }

  // --- INITIALIZATION ---
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
    } else {
      document.getElementById('login-modal').classList.remove('hidden');
    }
  }

  init();
})();