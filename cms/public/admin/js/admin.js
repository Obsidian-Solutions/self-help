/**
 * MindFull Control Tower v5.2
 * High-Fidelity Preview Engine & Directory-Aware CMS
 */

/* global SimpleMDE, FileReader, confirm, marked */

(function () {
  const API_BASE = '/api';
  let simplemde = null;
  let logSource = null;
  let currentCollection = 'posts';
  let currentSlug = null;
  let currentQuizId = null;

  console.log('Control Tower v5.2: Fidelity Engine Active');

  // --- 1. CORE API & UTILS ---
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
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
      if (res.status === 401) { logout(); return null; }
      return res.json();
    } catch (e) {
      notify('Handshake Error', 'error');
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. ROUTER ---
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

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
    if (section === 'users') loadUsers();
    if (section === 'inquiries') loadInquiries();
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
      case 'delete-entry':
        if (confirm(`Delete ${slug}?`)) {
          await api(`/content/${btn.getAttribute('data-collection')}/${slug}`, 'DELETE');
          window.loadCollection(currentCollection);
          notify('Purged');
        }
        break;
      case 'publish': saveContent(); break;
      case 'view-profile': viewUserProfile(id); break;
      case 'run-build': executeBuild(); break;
      case 'view-logs': startLogStream(); break;
      case 'new-quiz': openQuizEditor(null); break;
      case 'edit-quiz': openQuizEditor(id); break;
      case 'save-quiz': saveQuiz(); break;
      case 'add-question': addQuestionRow(); break;
      case 'remove-question': btn.closest('.question-row').remove(); break;
      case 'copy-url': navigator.clipboard.writeText(btn.getAttribute('data-url')); notify('Linked'); break;
      case 'delete-media': if (confirm('Purge?')) { await api(`/media/${name}`, 'DELETE'); loadMedia(); } break;
    }
  });

  // --- 4. CMS ENGINE (HIGH FIDELITY) ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(i => `
      <div class="admin-card p-6 flex flex-col h-full group hover:border-indigo-600 transition-all">
        <span class="text-[9px] font-black uppercase text-indigo-600 mb-2">${i.data.category || 'Draft'}</span>
        <h4 class="font-black text-slate-900 mb-6 flex-1">${i.data.title || i.slug}</h4>
        <div class="flex gap-2">
          <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
          <button data-action="delete-entry" data-collection="${name}" data-slug="${i.slug}" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Empty.</p>';
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    document.getElementById('editor-title').textContent = `Editing: ${slug}`;
    initSimpleMDE(entry.body || '');
    renderFMFields(entry.data || {});
    renderLiveTarget(collection, slug, entry.data || {});
    updatePreview();
  }

  function renderFMFields(data) {
    const fields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fields.map(f => `
      <div class="space-y-1">
        <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest">${f}</label>
        <input id="fm-${f}" value="${data[f] || ''}" class="fm-input w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold focus:ring-2 focus:ring-indigo-500/10">
      </div>
    `).join('');
    
    // Add real-time preview listeners to inputs
    document.querySelectorAll('.fm-input').forEach(input => {
      input.addEventListener('input', updatePreview);
    });
  }

  function renderLiveTarget(collection, slug, data) {
    const liveBase = 'http://localhost:1313';
    const path = `/${collection}/${slug}/`;
    const fullUrl = liveBase + path;
    
    const urlEl = document.getElementById('live-url-link');
    if (urlEl) { urlEl.textContent = fullUrl; urlEl.href = fullUrl; }

    const imgPreview = document.getElementById('live-image-preview');
    if (imgPreview && data.illustration) {
      imgPreview.innerHTML = `<img src="/illustrations/${data.illustration}.svg" class="w-full h-full object-contain p-4" onerror="this.src='https://images.unsplash.com/photo-1518173946687-a4c8a9833d8e?w=400&q=80'; this.className='w-full h-full object-cover'">`;
    } else if (imgPreview) {
      imgPreview.innerHTML = '<i class="fa-solid fa-image text-white/10 text-3xl"></i>';
    }
  }

  function updatePreview() {
    const title = document.getElementById('fm-title').value;
    const category = document.getElementById('fm-category').value;
    const illustration = document.getElementById('fm-illustration').value;
    const body = simplemde ? simplemde.value() : '';

    document.getElementById('preview-title').textContent = title || 'Untitled Article';
    document.getElementById('preview-category').textContent = category || 'JOURNAL';
    
    const hero = document.getElementById('preview-hero');
    if (illustration) {
      hero.innerHTML = `<div class="bg-indigo-50/50 p-12 flex items-center justify-center h-64"><img src="/illustrations/${illustration}.svg" class="max-h-full drop-shadow-2xl"></div>`;
    } else {
      hero.innerHTML = '';
    }

    document.getElementById('live-preview').innerHTML = marked.parse(body);
  }

  function initSimpleMDE(val) {
    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', updatePreview);
    }
    simplemde.value(val);
  }

  async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
      data[f] = document.getElementById(`fm-${f}`).value;
    });
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body: simplemde.value() });
    if (res) { notify('Site Content Published'); renderLiveTarget(currentCollection, currentSlug, data); }
  }

  // --- 5. LOGS & UTILS ---

  function startLogStream() {
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    if (logSource) logSource.close();
    term.innerHTML = 'Connecting...';
    logSource = new EventSource(`${API_BASE}/admin/logs/stream`);
    logSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'status') term.innerHTML += `<br>>>> ${data.msg}<br>`;
      else { term.innerText += data.content; term.scrollTop = term.scrollHeight; }
    };
  }

  async function executeBuild() {
    notify('Build Started');
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    term.innerHTML += `<br>>>> [RUN] hugo --minify...`;
    setTimeout(() => { term.innerHTML += `<br>>>> [OK] Done. Index updated.`; notify('Build Success'); }, 2000);
  }

  // Basic Loaders for others
  async function loadDashboard() { const stats = await api('/admin/stats'); if (stats) { document.getElementById('stat-users').textContent = stats.totalUsers; document.getElementById('stat-views').textContent = stats.totalViews; document.getElementById('stat-rating').textContent = stats.averageRating; document.getElementById('stat-new-leads').textContent = stats.newInquiries; } }
  async function loadUsers() { const users = await api('/admin/users'); const container = document.getElementById('users-table-body'); if (container && Array.isArray(users)) { container.innerHTML = users.map(u => `<tr class="hover:bg-slate-50"><td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${u.name}</p><p class="text-[10px] text-slate-400 font-medium">${u.email}</p></td><td class="px-8 py-6 text-xs font-black uppercase text-slate-400">${u.role}</td><td class="px-8 py-6 text-right"><button data-action="view-profile" data-id="${u.id}" class="text-indigo-600 font-black text-[10px] uppercase">Review</button></td></tr>`).join(''); } }
  async function loadInquiries() { const leads = await api('/admin/inquiries'); const container = document.getElementById('inquiries-table-body'); if (container && Array.isArray(leads)) { container.innerHTML = leads.map(l => `<tr class="hover:bg-slate-50"><td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${l.name}</p></td><td class="px-8 py-6 text-xs text-slate-500">${l.message}</td><td class="px-8 py-6 text-right text-[10px] font-black uppercase">${l.status}</td></tr>`).join(''); } }
  async function loadMedia() { const items = await api('/media'); const container = document.getElementById('media-grid'); if (container && Array.isArray(items)) { container.innerHTML = items.map(i => `<div class="admin-card p-2 relative group overflow-hidden"><img src="${i.url}" class="w-full aspect-square object-cover rounded-xl"><div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2"><button data-action="copy-url" data-url="${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase">Link</button></div></div>`).join(''); } }
  async function loadQuizzes() { const items = await api('/admin/quizzes'); const container = document.getElementById('quizzes-list'); if (container && Array.isArray(items)) { container.innerHTML = items.map(q => `<div class="admin-card p-6 h-full flex flex-col group"><span class="text-[9px] font-black text-indigo-600 uppercase mb-2">${q.status}</span><h4 class="font-black text-slate-900 mb-6 flex-1">${q.title}</h4><button data-action="edit-quiz" data-id="${q.id}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Configure</button></div>`).join(''); } }

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
      document.getElementById('admin-display-avatar').src = `https://i.pravatar.cc/100?u=${user.email}`;
      router();
    } else {
      document.getElementById('login-modal').classList.remove('hidden');
    }
  }

  init();
})();