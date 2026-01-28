/**
 * MindFull Control Tower v4.4
 * Real-time Telemetry & Corrected Data Mapping
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

  console.log('Control Tower v4.4 Initializing...');

  // --- 1. UTILS ---
  function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-5 right-5 px-6 py-3 rounded-xl text-white font-bold shadow-2xl z-[100] animate-in ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('mindfull_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
      if (res.status === 401) { logout(); return null; }
      return res.json();
    } catch (e) {
      notify('Connection Failure', 'error');
      return null;
    }
  }

  function logout() { localStorage.clear(); window.location.reload(); }

  // --- 2. THE MASTER DELEGATOR ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const section = btn.getAttribute('data-section');
    const id = btn.getAttribute('data-id');
    const slug = btn.getAttribute('data-slug');
    const name = btn.getAttribute('data-name');

    switch (action) {
      case 'nav': showSection(section); break;
      case 'logout': logout(); break;
      case 'load-collection': window.loadCollection(name); break;
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
      case 'open-reply': openReplyModal(id, btn.getAttribute('data-email'), name); break;
      case 'use-template': useTemplate(btn.getAttribute('data-subject'), btn.getAttribute('data-body'), name); break;
      case 'send-reply': sendQuickReply(); break;
      case 'copy-url': 
        navigator.clipboard.writeText(btn.getAttribute('data-url'));
        notify('Linked'); 
        break;
      case 'delete-media':
        if (confirm('Delete asset?')) {
          await api(`/media/${name}`, 'DELETE');
          loadMedia();
          notify('Deleted');
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

  // --- 3. CORE LOGIC ---

  function showSection(id) {
    console.log('Mounting Section:', id);
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

    document.getElementById('breadcrumb-active').textContent = id.toUpperCase();

    if (id === 'dashboard') loadDashboard();
    if (id === 'content') window.loadCollection(currentCollection);
    if (id === 'users') loadUsers();
    if (id === 'inquiries') loadInquiries();
    if (id === 'media') loadMedia();
    if (id === 'quizzes') loadQuizzes();
  }

  // --- 4. TELEMETRY (LIVE LOGS) ---

  function startLogStream() {
    const term = document.getElementById('dev-terminal');
    const container = document.getElementById('dev-log-container');
    container.classList.remove('hidden');
    
    if (logSource) logSource.close();
    
    term.innerHTML = 'Establishing telemetry link...';
    
    logSource = new EventSource(`${API_BASE}/admin/logs/stream`);
    
    logSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'status') {
        term.innerHTML += `<br><span class="text-indigo-400">>>> ${data.msg}</span>`;
      } else if (data.type === 'log') {
        term.innerText += data.content;
        term.scrollTop = term.scrollHeight;
      }
    };

    logSource.onerror = () => {
      term.innerHTML += `<br><span class="text-red-500">>>> LINK LOST. CHECK SERVER.</span>`;
      logSource.close();
    };
  }

  // --- 5. CRM DEEP DIVE ---

  async function loadUsers() {
    const users = await api('/admin/users');
    const container = document.getElementById('users-table-body');
    if (!container || !users) return;

    container.innerHTML = users.map(u => `
      <tr class="hover:bg-slate-50">
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
        <div>
          <h3 class="text-xl font-black text-slate-900">${profile.user.name}</h3>
          <p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">${profile.user.plan} MEMBER</p>
        </div>
      </div>
      <div class="space-y-4 pt-6 border-t border-slate-100 text-left">
        <div><p class="text-[9px] font-black text-slate-400 uppercase">Identity</p><p class="text-sm font-bold text-slate-700">${profile.user.email}</p></div>
        <div><p class="text-[9px] font-black text-slate-400 uppercase">Created</p><p class="text-sm font-bold text-slate-700">${new Date(profile.user.created_at).toLocaleDateString()}</p></div>
      </div>
    `;
    
    document.getElementById('profile-interactions').innerHTML = (profile.interactions || []).map(i => `
      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-2">
        <p class="text-xs font-bold text-slate-700">${i.type}: <span class="text-slate-400 font-medium">${i.metadata}</span></p>
        <span class="text-[9px] font-black text-slate-400 uppercase">${new Date(i.created_at).toLocaleTimeString()}</span>
      </div>
    `).join('') || '<p class="py-10 text-center text-xs italic text-slate-400">No telemetry detected.</p>';

    document.getElementById('profile-notes').innerHTML = (profile.notes || []).map(n => `
      <div class="p-4 bg-white rounded-xl border border-slate-100 shadow-sm mb-2 text-left">
        <div class="flex justify-between mb-1"><span class="text-[9px] font-black text-indigo-600">DR. ${n.therapist_name.toUpperCase()}</span></div>
        <p class="text-xs font-medium text-slate-600">${n.content}</p>
      </div>
    `).join('') || '<p class="py-10 text-center text-xs italic text-slate-400">Empty clinical record.</p>';
  }

  // --- 6. CONTENT ENGINE ---

  window.loadCollection = async function (name) {
    currentCollection = name;
    const items = await api(`/content/${name}`);
    const container = document.getElementById('collection-view');
    if (!container || !items) return;

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
    const res = await api(`/content/${currentCollection}/${currentSlug}`, 'POST', { data, body: simplemde.value() });
    if (res) { notify('Synced to Hugo'); showSection('content'); }
  }

  // --- 7. QUIZZES & DATA ---

  async function loadQuizzes() {
    const items = await api('/admin/quizzes');
    const container = document.getElementById('quizzes-list');
    if (!container || !items) return;

    container.innerHTML = items.map(q => `
      <div class="admin-card p-6 flex flex-col h-full group">
        <div class="flex justify-between mb-4"><span class="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">${q.status}</span></div>
        <h4 class="font-black text-slate-900 mb-6 flex-1">${q.title}</h4>
        <div class="flex gap-2">
          <button data-action="edit-quiz" data-id="${q.id}" class="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Build</button>
        </div>
      </div>
    `).join('') || '<p class="col-span-full py-20 text-center text-xs italic text-slate-400">Empty repository.</p>';
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
      <div class="flex justify-between items-center"><span class="text-[10px] font-black text-indigo-600 uppercase">Question</span><button data-action="remove-question" class="text-slate-400">&times;</button></div>
      <input type="text" placeholder="Question text" class="q-text w-full p-3 bg-white rounded-xl border-none font-bold text-sm" value="${data.question || ''}">
      <div class="grid grid-cols-2 gap-4">${[0, 1, 2, 3].map(i => `<div class="flex items-center gap-2 bg-white p-2 rounded-xl"><input type="radio" name="correct-${Math.random()}" class="q-correct" ${data.correct === i ? 'checked' : ''}><input type="text" placeholder="Option ${i + 1}" class="q-option w-full border-none bg-transparent text-xs" value="${(data.options || [])[i] || ''}"></div>`).join('')}</div>
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
    if (res) { notify('Quiz Engine Updated'); showSection('quizzes'); }
  }

  // --- 8. DASHBOARD RECAP ---

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
          <p class="text-sm font-bold text-slate-700">${i.user_name} <span class="text-[10px] font-black uppercase text-slate-400 ml-2">${i.event}</span></p>
          <span class="text-[10px] font-black text-indigo-600">${new Date(i.created_at).toLocaleTimeString()}</span>
        </div>
      `).join('');
    }
    if (Array.isArray(popular)) {
      document.getElementById('popular-list').innerHTML = popular.map(i => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2"><p class="text-xs font-bold text-slate-600 truncate">${i.slug}</p><span class="text-[10px] font-black text-emerald-600">${i.views} HITS</span></div>
      `).join('');
    }
  }

  // --- 9. BOOT ---
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
