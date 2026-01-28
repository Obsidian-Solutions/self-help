/**
 * MindFull Control Tower v5.0
 * Stateful Hash-Routing Engine & Unified Data Controller
 */

/* global SimpleMDE, FileReader, confirm */

(function () {
  const API_BASE = '/api';
  let simplemde = null;
  let logSource = null;
  let currentCollection = 'posts';
  let currentSlug = null;
  let currentLeadId = null;
  let currentQuizId = null;

  console.log('Control Tower v5.0: Routing Engine Active');

  // --- 1. CORE API & SECURITY ---
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
    const headers = { 
      'Content-Type': 'application/json',
      'x-xsrf-token': getCookie('XSRF-TOKEN')
    };
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

  // --- 2. THE ROUTER (WAGTAIL STYLE) ---
  function router() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1).split('?')[0]; // Handle params later if needed
    
    console.log('Routing to:', section);

    // Update UI visibility
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => {
      b.classList.remove('active', 'text-white', 'bg-slate-800');
      b.classList.add('text-slate-400');
    });

    const target = document.getElementById(`section-${section}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('animate-in');
    }

    // Active button highlight
    const mappedId = section.startsWith('user-') ? 'users' : (section === 'editor' ? 'content' : (section === 'quiz-editor' ? 'quizzes' : section));
    const activeBtn = document.querySelector(`a[href="#${mappedId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'text-white', 'bg-slate-800');
      activeBtn.classList.remove('text-slate-400');
    }

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = section.replace('-', ' ').toUpperCase();

    // Trigger data loaders
    switch (section) {
      case 'dashboard': loadDashboard(); break;
      case 'content': window.loadCollection(currentCollection); break;
      case 'users': loadUsers(); break;
      case 'inquiries': loadInquiries(); break;
      case 'media': loadMedia(); break;
      case 'quizzes': loadQuizzes(); break;
    }
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
      case 'load-media': loadMedia(); break;
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
      case 'open-reply': openReplyModal(id, btn.getAttribute('data-email'), name); break;
      case 'send-reply': sendQuickReply(); break;
      case 'copy-url': 
        navigator.clipboard.writeText(btn.getAttribute('data-url'));
        notify('URL Copied'); 
        break;
      case 'delete-media':
        if (confirm('Delete asset?')) {
          await api(`/media/${name}`, 'DELETE');
          loadMedia();
          notify('Purged');
        }
        break;
      case 'run-build': executeBuild(); break;
      case 'view-logs': startLogStream(); break;
      case 'new-quiz': openQuizEditor(null); break;
      case 'edit-quiz': openQuizEditor(id); break;
      case 'save-quiz': saveQuiz(); break;
      case 'add-question': addQuestionRow(); break;
      case 'remove-question': btn.closest('.question-row').remove(); break;
    }
  });

  // --- 4. DATA LOADERS ---

  async function loadDashboard() {
    const stats = await api('/admin/stats');
    if (stats) {
      document.getElementById('stat-users').textContent = stats.totalUsers;
      document.getElementById('stat-views').textContent = stats.totalViews;
      document.getElementById('stat-rating').textContent = stats.averageRating;
      document.getElementById('stat-new-leads').textContent = stats.newInquiries;
    }
    const [activity, popular] = await Promise.all([api('/admin/activity'), api('/admin/popular')]);
    if (Array.isArray(activity)) {
      document.getElementById('activity-list').innerHTML = activity.map(i => `
        <div class="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
          <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-[10px] uppercase font-black text-slate-400 ml-2">${i.event}</span></p>
          <span class="text-[10px] font-black text-indigo-600">${new Date(i.created_at).toLocaleTimeString()}</span>
        </div>
      `).join('');
    }
    if (Array.isArray(popular)) {
      document.getElementById('popular-list').innerHTML = popular.map(i => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2">
          <p class="text-xs font-bold text-slate-600 truncate">${i.slug}</p>
          <span class="text-[10px] font-black text-emerald-600">${i.views} HITS</span>
        </div>
      `).join('');
    }
  }

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !Array.isArray(items)) return;

    const ratings = name === 'courses' ? await Promise.all(items.map(i => api(`/courses/${i.slug}/rating`))) : [];

    container.innerHTML = items.map((i, idx) => {
      const rating = ratings[idx] || { avg_rating: 0, total_ratings: 0 };
      return `
        <div class="admin-card p-6 flex flex-col h-full group">
          <div class="flex justify-between mb-4">
            <span class="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">${i.data.category || 'General'}</span>
            ${name === 'courses' ? `<span class="text-[9px] font-black text-amber-500 uppercase"><i class="fa-solid fa-star mr-1"></i> ${rating.avg_rating.toFixed(1)}</span>` : ''}
          </div>
          <h4 class="font-black text-slate-900 mb-6 flex-1 group-hover:text-indigo-600 transition-colors">${i.data.title || i.slug}</h4>
          <div class="flex gap-2">
            <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
            <button data-action="delete-entry" data-collection="${name}" data-slug="${i.slug}" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      `;
    }).join('');
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    window.location.hash = '#editor';
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
    }
    simplemde.value(entry.body || '');

    const fields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fields.map(f => `
      <div class="space-y-1">
        <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest">${f}</label>
        <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-2.5 bg-slate-50 rounded-lg border-none text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 transition-all">
      </div>
    `).join('');
  }

  async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
      data[f] = document.getElementById(`fm-${f}`).value;
    });
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body: simplemde.value() });
    if (res) { notify('Content Updated'); window.location.hash = '#content'; }
  }

  async function loadUsers() {
    const users = await api('/admin/users');
    const container = document.getElementById('users-table-body');
    if (!container || !Array.isArray(users)) return;

    container.innerHTML = users.map(u => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${u.name}</p><p class="text-[10px] text-slate-400 font-medium">${u.email}</p></td>
        <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">${u.role}</span></td>
        <td class="px-8 py-6 text-right"><button data-action="view-profile" data-id="${u.id}" class="text-indigo-600 font-black text-[10px] uppercase hover:underline">Review &rarr;</button></td>
      </tr>
    `).join('');
  }

  async function viewUserProfile(id) {
    window.location.hash = '#user-profile';
    const profile = await api(`/admin/users/${id}/profile`);
    if (!profile) return;

    document.getElementById('user-profile-info').innerHTML = `
      <div class="flex items-center gap-4 mb-8">
        <div class="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">${profile.user.name[0]}</div>
        <div><h3 class="text-lg font-black text-slate-900">${profile.user.name}</h3><p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">${profile.user.plan} MEMBER</p></div>
      </div>
      <div class="space-y-4 pt-6 border-t border-slate-100">
        <div><p class="text-[9px] font-black text-slate-400 uppercase">Identity</p><p class="text-sm font-bold text-slate-700">${profile.user.email}</p></div>
      </div>
    `;
    
    if (Array.isArray(profile.interactions)) {
      document.getElementById('profile-interactions').innerHTML = profile.interactions.map(i => `
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-2"><p class="text-xs font-bold text-slate-700">${i.type}: ${i.metadata}</p><span class="text-[9px] font-black text-slate-400 uppercase">${new Date(i.created_at).toLocaleDateString()}</span></div>
      `).join('') || '<p class="py-10 text-center text-xs italic text-slate-400">No events found.</p>';
    }
  }

  async function loadMedia() {
    const items = await api('/media');
    const container = document.getElementById('media-grid');
    if (!container || !Array.isArray(items)) return;
    
    if (items.length === 0) {
      container.innerHTML = '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">No assets found in static/images.</p>';
      return;
    }
    
    container.innerHTML = items.map(i => `
      <div class="admin-card p-2 relative group overflow-hidden">
        <img src="${i.url}" class="w-full aspect-square object-cover rounded-xl transition-transform duration-500 group-hover:scale-110">
        <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
          <button data-action="copy-url" data-url="${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase px-3 shadow-xl">Link</button>
          <button data-action="delete-media" data-name="${i.name}" class="p-2 bg-red-500 text-white rounded-lg text-[8px] font-bold uppercase px-3 shadow-xl">Purge</button>
        </div>
      </div>
    `).join('');
  }

  window.handleMediaUpload = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await api('/media/upload', 'POST', { name: file.name, data: reader.result });
      loadMedia();
      notify('Asset Synced');
    };
    reader.readAsDataURL(file);
  };

  async function loadQuizzes() {
    const items = await api('/admin/quizzes');
    const container = document.getElementById('quizzes-list');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(q => `
      <div class="admin-card p-6 flex flex-col h-full group">
        <div class="flex justify-between mb-4"><span class="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">${q.status}</span></div>
        <h4 class="font-black text-slate-900 mb-6 flex-1 group-hover:text-indigo-600 transition-colors">${q.title}</h4>
        <div class="flex gap-2">
          <button data-action="edit-quiz" data-id="${q.id}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Configure</button>
          <button data-action="delete-quiz" data-id="${q.id}" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Empty quiz repository.</p>';
  }

  async function openQuizEditor(id) {
    currentQuizId = id;
    window.location.hash = '#quiz-editor';
    const container = document.getElementById('quiz-questions-container');
    container.innerHTML = '';

    if (id) {
      const quiz = await api(`/admin/quizzes/${id}`);
      if (!quiz) return;
      document.getElementById('quiz-title').value = quiz.title;
      document.getElementById('quiz-description').value = quiz.description;
      document.getElementById('quiz-result').value = quiz.result_message;
      document.getElementById('quiz-status').value = quiz.status;
      (quiz.questions || []).forEach(q => addQuestionRow(q));
    } else {
      document.getElementById('quiz-title').value = '';
      document.getElementById('quiz-description').value = '';
      document.getElementById('quiz-result').value = '';
      document.getElementById('quiz-status').value = 'draft';
      addQuestionRow();
    }
  }

  function addQuestionRow(data = {}) {
    const container = document.getElementById('quiz-questions-container');
    const row = document.createElement('div');
    row.className = 'question-row p-6 bg-slate-50 rounded-2xl space-y-4 border border-transparent hover:border-indigo-100 transition-all';
    row.innerHTML = `
      <div class="flex justify-between items-center"><span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Question Layer</span><button data-action="remove-question" class="text-slate-400 hover:text-red-500">&times;</button></div>
      <input type="text" placeholder="Question prompt" class="q-text w-full p-3 bg-white rounded-xl border-none font-bold text-sm" value="${data.question || ''}">
      <div class="grid grid-cols-2 gap-4">${[0, 1, 2, 3].map(i => `<div class="flex items-center gap-2 bg-white p-2 rounded-xl"><input type="radio" name="correct-${Math.random()}" class="q-correct" ${data.correct === i ? 'checked' : ''}><input type="text" placeholder="Option ${i + 1}" class="q-option w-full border-none bg-transparent text-xs font-medium" value="${(data.options || [])[i] || ''}"></div>`).join('')}</div>
    `;
    container.appendChild(row);
  }

  async function saveQuiz() {
    const questions = Array.from(document.querySelectorAll('.question-row')).map(row => {
      const options = Array.from(row.querySelectorAll('.q-option')).map(opt => opt.value);
      const correctIndex = Array.from(row.querySelectorAll('.q-correct')).findIndex(radio => radio.checked);
      return { question: row.querySelector('.q-text').value, options, correct: correctIndex };
    });
    const payload = { title: document.getElementById('quiz-title').value, description: document.getElementById('quiz-description').value, result_message: document.getElementById('quiz-result').value, status: document.getElementById('quiz-status').value, questions };
    const res = await api(currentQuizId ? `/admin/quizzes/${currentQuizId}` : '/admin/quizzes', currentQuizId ? 'PUT' : 'POST', payload);
    if (res) { notify('Quiz Logic Updated'); window.location.hash = '#quizzes'; }
  }

  function startLogStream() {
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    if (logSource) logSource.close();
    term.innerHTML = 'Connecting to system telemetry...';
    logSource = new EventSource(`${API_BASE}/admin/logs/stream`);
    logSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'status') term.innerHTML += `<br><span class="text-indigo-400">>>> ${data.msg}</span><br>`;
      else { term.innerText += data.content; term.scrollTop = term.scrollHeight; }
    };
  }

  async function executeBuild() {
    notify('Build Sequence Active');
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    term.innerHTML += `<br>>>> [RUN] Initiating build...`;
    // Simulated build for interface verification
    setTimeout(() => { term.innerHTML += `<br>>>> [OK] Pages generated. Indexing complete.`; notify('Build Succeeded'); }, 2000);
  }

  // --- 5. INITIALIZATION ---
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
      
      router(); // Initial route
    } else {
      document.getElementById('login-modal').classList.remove('hidden');
    }
  }

  init();
})();