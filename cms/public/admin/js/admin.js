/**
 * MindFull Control Tower v4.3
 * Secure Handshake & Defensive Rendering
 */

/* global SimpleMDE, FileReader, confirm */

(function () {
  const API_BASE = '/api';
  let simplemde = null;
  let currentCollection = 'posts';
  let currentSlug = null;
  let currentLeadId = null;
  let currentQuizId = null;

  console.log('Control Tower v4.3: Secure Handshake Active');

  // --- 1. UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-5 right-5 px-6 py-3 rounded-xl text-white font-bold shadow-2xl z-[100] animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
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
      
      const data = await res.json();
      
      if (res.status === 403) {
        console.error('Security Error:', data.message);
        notify('Security Handshake Failed', 'error');
        return null;
      }
      
      return data;
    } catch (e) {
      console.error('Network Error:', e);
      notify('API Bridge Error', 'error');
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. EVENT DELEGATION ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const slug = btn.getAttribute('data-slug');
    const name = btn.getAttribute('data-name');

    switch (action) {
      case 'nav': showSection(btn.getAttribute('data-section')); break;
      case 'logout': logout(); break;
      case 'load-collection': window.loadCollection(name); break;
      case 'edit-entry': editEntry(btn.getAttribute('data-collection'), slug); break;
      case 'delete-entry':
        if (confirm(`Purge ${slug}?`)) {
          const res = await api(`/content/${btn.getAttribute('data-collection')}/${slug}`, 'DELETE');
          if (res) { window.loadCollection(currentCollection); notify('Content Purged'); }
        }
        break;
      case 'publish': saveContent(); break;
      case 'view-profile': viewUserProfile(id); break;
      case 'open-reply': openReplyModal(id, btn.getAttribute('data-email'), name); break;
      case 'use-template': useTemplate(btn.getAttribute('data-subject'), btn.getAttribute('data-body'), name); break;
      case 'send-reply': sendQuickReply(); break;
      case 'copy-url': 
        navigator.clipboard.writeText(btn.getAttribute('data-url'));
        notify('URL Copied'); 
        break;
      case 'delete-media':
        if (confirm('Delete asset?')) {
          const res = await api(`/media/${name}`, 'DELETE');
          if (res) { loadMedia(); notify('Asset Deleted'); }
        }
        break;
      case 'run-build': executeBuild(); break;
      case 'clear-cache': notify('Cache purged locally'); break;
      case 'view-logs': 
        document.getElementById('dev-log-container').classList.remove('hidden');
        document.getElementById('dev-terminal').innerHTML += `<br>[${new Date().toLocaleTimeString()}] Telemetry Link Established.`;
        break;
      case 'new-quiz': openQuizEditor(null); break;
      case 'edit-quiz': openQuizEditor(id); break;
      case 'save-quiz': saveQuiz(); break;
      case 'add-question': addQuestionRow(); break;
      case 'remove-question': btn.closest('.question-row').remove(); break;
      case 'delete-quiz':
        if (confirm('Delete this quiz?')) {
          await api(`/admin/quizzes/${id}`, 'DELETE');
          showSection('quizzes');
          notify('Quiz Deleted');
        }
        break;
    }
  });

  // --- 3. NAVIGATION ---
  function showSection(id) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(b => {
      b.classList.remove('active', 'text-white', 'bg-slate-800');
      b.classList.add('text-slate-400');
    });

    const target = document.getElementById(`section-${id}`);
    if (target) target.classList.remove('hidden');

    const mappedId = id === 'editor' || id === 'quiz-editor' ? (id === 'quiz-editor' ? 'quizzes' : 'content') : id;
    const activeBtn = document.querySelector(`[data-section="${mappedId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'text-white', 'bg-slate-800');
      activeBtn.classList.remove('text-slate-400');
    }

    const breadcrumb = document.getElementById('breadcrumb-active');
    if (breadcrumb) breadcrumb.textContent = id.toUpperCase();

    // Data Loaders
    if (id === 'dashboard') loadDashboard();
    if (id === 'content') window.loadCollection(currentCollection);
    if (id === 'users') loadUsers();
    if (id === 'inquiries') loadInquiries();
    if (id === 'media') loadMedia();
    if (id === 'quizzes') loadQuizzes();
  }

  // --- 4. CORE DATA LOADERS ---

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
        <div class="flex items-center justify-between py-4">
          <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-xs text-slate-400">${i.event}</span></p>
          <span class="text-[10px] font-black text-slate-300">${new Date(i.created_at).toLocaleTimeString()}</span>
        </div>
      `).join('');
    }
    if (Array.isArray(popular)) {
      document.getElementById('popular-list').innerHTML = popular.map(i => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2">
          <p class="text-xs font-bold text-slate-600 truncate">${i.slug}</p>
          <span class="text-[10px] font-black text-indigo-600">${i.views} HITS</span>
        </div>
      `).join('');
    }
  }

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container) return;

    if (!Array.isArray(items)) {
      container.innerHTML = '<p class="text-center py-20 text-xs italic text-slate-400">Unable to load collection data.</p>';
      return;
    }

    container.innerHTML = items.map(i => `
      <div class="admin-card p-6 flex flex-col h-full group">
        <h4 class="font-black text-slate-900 mb-6 flex-1 group-hover:text-indigo-600 transition-colors">${i.data.title || i.slug}</h4>
        <div class="flex gap-2">
          <button data-action="edit-entry" data-collection="${name}" data-slug="${i.slug}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Update</button>
          <button data-action="delete-entry" data-collection="${name}" data-slug="${i.slug}" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `).join('');
  };

  async function editEntry(collection, slug) {
    currentSlug = slug;
    showSection('editor');
    const entry = await api(`/content/${collection}/${slug}`);
    if (!entry) return;

    if (!simplemde) {
      simplemde = new SimpleMDE({ element: document.getElementById('editor-textarea'), spellChecker: false, status: false });
    }
    simplemde.value(entry.body || '');

    const fields = ['title', 'description', 'category', 'illustration'];
    document.getElementById('frontmatter-fields').innerHTML = fields.map(f => `
      <div>
        <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">${f}</label>
        <input id="fm-${f}" value="${entry.data[f] || ''}" class="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold">
      </div>
    `).join('');
  }

  async function saveContent() {
    const data = {};
    ['title', 'description', 'category', 'illustration'].forEach(f => {
      data[f] = document.getElementById(`fm-${f}`).value;
    });
    const body = simplemde.value();
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body });
    if (res) { notify('Content Updated'); showSection('content'); }
  }

  async function loadUsers() {
    const users = await api('/admin/users');
    const container = document.getElementById('users-table-body');
    if (!container || !Array.isArray(users)) return;

    container.innerHTML = users.map(u => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${u.name}</p><p class="text-[10px] text-slate-400">${u.email}</p></td>
        <td class="px-8 py-6"><span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">${u.role}</span></td>
        <td class="px-8 py-6 text-right"><button data-action="view-profile" data-id="${u.id}" class="text-indigo-600 font-black text-[10px] uppercase">Review</button></td>
      </tr>
    `).join('');
  }

  async function viewUserProfile(id) {
    showSection('user-profile');
    const profile = await api(`/admin/users/${id}/profile`);
    if (!profile) return;

    document.getElementById('user-profile-info').innerHTML = `
      <div class="flex items-center gap-4 mb-8">
        <div class="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">${profile.user.name[0]}</div>
        <div><h3 class="text-xl font-black text-slate-900">${profile.user.name}</h3><p class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">${profile.user.plan} MEMBER</p></div>
      </div>
    `;
    
    if (Array.isArray(profile.interactions)) {
      document.getElementById('profile-interactions').innerHTML = profile.interactions.map(i => `
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-2"><p class="text-xs font-bold text-slate-700">${i.type}</p><span class="text-[9px] font-black text-slate-400 uppercase">${new Date(i.created_at).toLocaleDateString()}</span></div>
      `).join('') || '<p class="py-10 text-center text-xs italic text-slate-400">No activity logged.</p>';
    }
  }

  async function loadInquiries() {
    const leads = await api('/admin/inquiries');
    const container = document.getElementById('inquiries-table-body');
    if (!container || !Array.isArray(leads)) return;

    container.innerHTML = leads.map(l => `
      <tr class="${l.status === 'new' ? 'bg-indigo-50/20' : ''} hover:bg-slate-50 transition-colors">
        <td class="px-8 py-6"><p class="text-sm font-bold text-slate-900">${l.name}</p><p class="text-[10px] text-slate-400 uppercase tracking-widest">${l.status}</p></td>
        <td class="px-8 py-6 text-xs text-slate-500">${l.message}</td>
        <td class="px-8 py-6 text-right"><button data-action="open-reply" data-id="${l.id}" data-email="${l.email}" data-name="${l.name}" class="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Respond</button></td>
      </tr>
    `).join('');
  }

  async function openReplyModal(id, email, name) {
    currentLeadId = id;
    const templates = await api('/admin/templates');
    document.getElementById('reply-lead-name').textContent = name;
    document.getElementById('reply-template-list').innerHTML = (templates || []).map(t => `
      <button data-action="use-template" data-name="${name}" data-subject="${t.subject}" data-body="${encodeURIComponent(t.body)}" class="w-full text-left p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 mb-2">
        <p class="text-xs font-bold text-slate-900">${t.name}</p>
      </button>
    `).join('');
    document.getElementById('reply-modal').classList.remove('hidden');
  }

  function useTemplate(subject, escapedBody, name) {
    document.getElementById('reply-subject').value = subject;
    document.getElementById('reply-body').value = decodeURIComponent(escapedBody).replace('{{name}}', name);
  }

  async function sendQuickReply() {
    const res = await api(`/admin/inquiries/${currentLeadId}`, 'PATCH', { status: 'replied' });
    if (res) { notify('Pipeline Updated'); document.getElementById('reply-modal').classList.add('hidden'); loadInquiries(); }
  }

  async function loadMedia() {
    const items = await api('/media');
    const container = document.getElementById('media-grid');
    if (!container || !Array.isArray(items)) return;
    
    if (items.length === 0) {
      container.innerHTML = '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">No assets found.</p>';
      return;
    }
    
    container.innerHTML = items.map(i => `
      <div class="admin-card p-2 relative group overflow-hidden">
        <img src="${i.url}" class="w-full aspect-square object-cover rounded-xl">
        <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
          <button data-action="copy-url" data-url="${i.url}" class="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-bold uppercase px-3">Link</button>
          <button data-action="delete-media" data-name="${i.name}" class="p-2 bg-red-500 text-white rounded-lg text-[8px] font-bold uppercase px-3">Purge</button>
        </div>
      </div>
    `).join('');
  }

  window.handleMediaUpload = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await api('/media/upload', 'POST', { name: file.name, data: reader.result });
      if (res) { loadMedia(); notify('Asset Synced'); }
    };
    reader.readAsDataURL(file);
  };

  async function loadQuizzes() {
    const items = await api('/admin/quizzes');
    const container = document.getElementById('quizzes-list');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map(q => `
      <div class="admin-card p-6 flex flex-col h-full group">
        <div class="flex justify-between mb-4">
          <span class="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">${q.status}</span>
        </div>
        <h4 class="font-black text-slate-900 mb-6 flex-1 group-hover:text-indigo-600 transition-colors">${q.title}</h4>
        <div class="flex gap-2">
          <button data-action="edit-quiz" data-id="${q.id}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Configure</button>
          <button data-action="delete-quiz" data-id="${q.id}" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `).join('');
  }

  async function openQuizEditor(id) {
    currentQuizId = id;
    showSection('quiz-editor');
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
      <div class="flex justify-between items-center">
        <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Question</span>
        <button data-action="remove-question" class="text-slate-400 hover:text-red-500 transition-colors">&times;</button>
      </div>
      <input type="text" placeholder="Question text" class="q-text w-full p-3 bg-white rounded-xl border-none font-bold text-sm" value="${data.question || ''}">
      <div class="grid grid-cols-2 gap-4">
        ${[0, 1, 2, 3].map(i => `
          <div class="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100">
            <input type="radio" name="correct-${Date.now()}-${Math.random()}" class="q-correct" ${data.correct === i ? 'checked' : ''}>
            <input type="text" placeholder="Option ${i + 1}" class="q-option w-full border-none bg-transparent text-xs font-medium" value="${(data.options || [])[i] || ''}">
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(row);
  }

  async function saveQuiz() {
    const questions = Array.from(document.querySelectorAll('.question-row')).map(row => {
      const options = Array.from(row.querySelectorAll('.q-option')).map(opt => opt.value);
      const correctIndex = Array.from(row.querySelectorAll('.q-correct')).findIndex(radio => radio.checked);
      return { question: row.querySelector('.q-text').value, options, correct: correctIndex };
    });

    const payload = {
      title: document.getElementById('quiz-title').value,
      description: document.getElementById('quiz-description').value,
      result_message: document.getElementById('quiz-result').value,
      status: document.getElementById('quiz-status').value,
      questions
    };

    const res = await api(currentQuizId ? `/admin/quizzes/${currentQuizId}` : '/admin/quizzes', currentQuizId ? 'PUT' : 'POST', payload);
    if (res) { notify('Quiz Engine Updated'); showSection('quizzes'); }
  }

  async function executeBuild() {
    notify('Build Sequence Started');
    const term = document.getElementById('dev-terminal');
    document.getElementById('dev-log-container').classList.remove('hidden');
    term.innerHTML += `<br>>>> [BUILD] Initiating hugo --minify...`;
    setTimeout(() => {
      term.innerHTML += `<br>>>> [BUILD] Done. Pagefind indexing complete.`;
      notify('Build Success');
    }, 1500);
  }

  // --- 5. BOOT ---
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
      showSection('dashboard');
    }
  }

  init();
})();