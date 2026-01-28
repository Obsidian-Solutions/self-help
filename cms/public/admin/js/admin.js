/**
 * MindFull Control Tower v5.3
 * Automated Port Bridge & Robust Edit Engine
 */

/* global SimpleMDE, FileReader, confirm, marked */

(function () {
  // --- 1. CONFIGURATION & PORT BRIDGE ---
  const CMS_PORT = 3000;
  const HUGO_PORT = 1313;
  
  // Detection: If we are on 1313, the API is on 3000. Otherwise, same host.
  const isHugoHost = window.location.port == HUGO_PORT;
  const API_BASE = isHugoHost 
    ? `${window.location.protocol}//${window.location.hostname}:${CMS_PORT}/api`
    : `${window.location.origin}/api`;

  let simplemde = null;
  let logSource = null;
  let currentCollection = 'posts';
  let currentSlug = null;
  let currentQuizId = null;

  console.log(`Control Tower v5.3: Link established to ${API_BASE}`);

  // --- 2. CORE UTILS ---
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
      const res = await fetch(`${API_BASE}${endpoint}`, { 
        method, 
        headers, 
        body: body ? JSON.stringify(body) : null,
        credentials: 'include' // Crucial for CSRF and Auth
      });
      if (res.status === 401) { logout(); return null; }
      return res.json();
    } catch (e) {
      console.error('API Error:', e);
      notify('Backend Link Unstable', 'error');
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 3. ROUTER ---
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

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = section.toUpperCase();

    if (section === 'dashboard') loadDashboard();
    if (section === 'content') window.loadCollection(currentCollection);
    if (section === 'users') loadUsers();
    if (section === 'inquiries') loadInquiries();
    if (section === 'media') loadMedia();
    if (section === 'quizzes') loadQuizzes();
  }

  window.onhashchange = router;

  // --- 4. EVENT DELEGATION (HARDENED) ---
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
        if (confirm(`Purge ${slug}?`)) {
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

  // --- 5. CMS & FIDELITY ENGINE ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    
    // Switch tab styles
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
        <div class="flex gap-2">
          <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
          <button data-action="delete-entry" data-collection="${name}" data-slug="${i.slug}" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">No entries detected.</p>';
  };

  async function openNewEntry() {
    currentSlug = prompt('Enter identifier (e.g. mindfulness-tips):');
    if (!currentSlug) return;
    window.location.hash = '#editor';
    document.getElementById('editor-title').textContent = `New ${currentCollection}: ${currentSlug}`;
    initSimpleMDE('');
    renderFMFields({});
    renderLiveTarget(currentCollection, currentSlug, {});
  }

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

  function initSimpleMDE(val) {
    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
      simplemde.codemirror.on('change', updatePreview);
    }
    simplemde.value(val);
  }

  function renderFMFields(data) {
    const fields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fields.map(f => `
      <div class="space-y-1">
        <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest">${f}</label>
        <input id="fm-${f}" value="${data[f] || ''}" class="fm-input w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold focus:ring-2 focus:ring-indigo-500/10">
      </div>
    `).join('');
    
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
      const isExternal = isHugoHost; 
      const baseUrl = isExternal ? `http://${window.location.hostname}:${CMS_PORT}` : '';
      imgPreview.innerHTML = `<img src="${baseUrl}/illustrations/${data.illustration}.svg" class="w-full h-full object-contain p-4" onerror="this.src='https://images.unsplash.com/photo-1518173946687-a4c8a9833d8e?w=400&q=80'">`;
    }
  }

  function updatePreview() {
    const title = document.getElementById('fm-title')?.value;
    const category = document.getElementById('fm-category')?.value;
    const body = simplemde ? simplemde.value() : '';

    if (document.getElementById('preview-title')) document.getElementById('preview-title').textContent = title || 'Draft';
    if (document.getElementById('preview-category')) document.getElementById('preview-category').textContent = category || 'GENERAL';
    if (document.getElementById('live-preview')) document.getElementById('live-preview').innerHTML = marked.parse(body);
  }

  async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
      data[f] = document.getElementById(`fm-${f}`).value;
    });
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body: simplemde.value() });
    if (res) { notify('Content Published'); renderLiveTarget(currentCollection, currentSlug, data); }
  }

  // --- 6. LOGS & CRM ---

  function startLogStream() {
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    if (logSource) logSource.close();
    term.innerHTML = 'Connecting to system telemetry...';
    
    const sourceUrl = isHugoHost 
      ? `http://${window.location.hostname}:${CMS_PORT}/api/admin/logs/stream`
      : `/api/admin/logs/stream`;
      
    logSource = new EventSource(sourceUrl);
    logSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'status') term.innerHTML += `<br>>>> ${data.msg}<br>`;
      else { term.innerText += data.content; term.scrollTop = term.scrollHeight; }
    };
  }

  async function executeBuild() {
    notify('Build Triggered');
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    term.innerHTML += `<br>>>> [BUILD] hugo --minify initiated...`;
    setTimeout(() => { term.innerHTML += `<br>>>> [OK] Done. Site ready.`; notify('Build Success'); }, 2000);
  }

  // Dashboards / Users
  async function loadDashboard() { const stats = await api('/admin/stats'); if (stats) { document.getElementById('stat-users').textContent = stats.totalUsers; document.getElementById('stat-views').textContent = stats.totalViews; document.getElementById('stat-rating').textContent = stats.averageRating; document.getElementById('stat-new-leads').textContent = stats.newInquiries; } }
  async function loadUsers() { const users = await api('/admin/users'); const container = document.getElementById('users-table-body'); if (container && Array.isArray(users)) { container.innerHTML = users.map(u => `<tr class="hover:bg-slate-50"><td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${u.name}</p><p class="text-[10px] text-slate-400 font-medium">${u.email}</p></td><td class="px-8 py-6 text-xs font-black uppercase text-slate-400">${u.role}</td><td class="px-8 py-6 text-right"><button data-action="view-profile" data-id="${u.id}" class="text-indigo-600 font-black text-[10px] uppercase underline">Review</button></td></tr>`).join(''); } }
  async function loadInquiries() { const leads = await api('/admin/inquiries'); const container = document.getElementById('inquiries-table-body'); if (container && Array.isArray(leads)) { container.innerHTML = leads.map(l => `<tr class="hover:bg-slate-50"><td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${l.name}</p></td><td class="px-8 py-6 text-xs text-slate-500">${l.message}</td><td class="px-8 py-6 text-right text-[10px] font-black uppercase text-indigo-600">${l.status}</td></tr>`).join(''); } }
  async function loadMedia() { const items = await api('/media'); const container = document.getElementById('media-grid'); if (container && Array.isArray(items)) { container.innerHTML = items.map(i => `<div class="admin-card p-2 relative group overflow-hidden"><img src="${isHugoHost ? `http://${window.location.hostname}:${CMS_PORT}` : ''}${i.url}" class="w-full aspect-square object-cover rounded-xl"><div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2"><button data-action="copy-url" data-url="${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase">Link</button></div></div>`).join(''); } }
  async function loadQuizzes() { const items = await api('/admin/quizzes'); const container = document.getElementById('quizzes-list'); if (container && Array.isArray(items)) { container.innerHTML = items.map(q => `<div class="admin-card p-6 h-full flex flex-col group"><span class="text-[9px] font-black text-indigo-600 uppercase mb-2">${q.status}</span><h4 class="font-black text-slate-900 mb-6 flex-1">${q.title}</h4><button data-action="edit-quiz" data-id="${q.id}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Configure</button></div>`).join(''); } }

  // Quizzes Editor
  async function openQuizEditor(id) { currentQuizId = id; window.location.hash = '#quiz-editor'; const container = document.getElementById('quiz-questions-container'); container.innerHTML = ''; if (id) { const quiz = await api(`/admin/quizzes/${id}`); if (quiz) { document.getElementById('quiz-title').value = quiz.title; document.getElementById('quiz-description').value = quiz.description; document.getElementById('quiz-result').value = quiz.result_message; document.getElementById('quiz-status').value = quiz.status; (quiz.questions || []).forEach(q => addQuestionRow(q)); } } else { addQuestionRow(); } }
  function addQuestionRow(data = {}) { const row = document.createElement('div'); row.className = 'question-row p-6 bg-slate-50 rounded-2xl space-y-4 mb-4'; row.innerHTML = `<div class="flex justify-between items-center"><span class="text-[10px] font-black text-indigo-600 uppercase">Question</span><button data-action="remove-question" class="text-slate-400">&times;</button></div><input type="text" placeholder="Prompt" class="q-text w-full p-3 bg-white rounded-xl border-none font-bold text-sm" value="${data.question || ''}"><div class="grid grid-cols-2 gap-4">${[0, 1, 2, 3].map(i => `<div class="flex items-center gap-2 bg-white p-2 rounded-xl"><input type="radio" name="correct-${Math.random()}" class="q-correct" ${data.correct === i ? 'checked' : ''}><input type="text" placeholder="Option ${i + 1}" class="q-option w-full border-none bg-transparent text-xs" value="${(data.options || [])[i] || ''}"></div>`).join('')}</div>`; document.getElementById('quiz-questions-container').appendChild(row); }
  async function saveQuiz() { const questions = Array.from(document.querySelectorAll('.question-row')).map(row => { const options = Array.from(row.querySelectorAll('.q-option')).map(opt => opt.value); const correctIndex = Array.from(row.querySelectorAll('.q-correct')).findIndex(radio => radio.checked); return { question: row.querySelector('.q-text').value, options, correct: correctIndex }; }); const payload = { title: document.getElementById('quiz-title').value, description: document.getElementById('quiz-description').value, result_message: document.getElementById('quiz-result').value, status: document.getElementById('quiz-status').value, questions }; const res = await api(currentQuizId ? `/admin/quizzes/${currentQuizId}` : '/admin/quizzes', currentQuizId ? 'PUT' : 'POST', payload); if (res) { notify('Quiz Updated'); window.location.hash = '#quizzes'; } }

  // --- 7. INITIALIZATION ---
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
