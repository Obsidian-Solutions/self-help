const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { roleAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Protect all admin routes
router.use(roleAuth(['admin', 'therapist']));

// --- Overall Stats ---
const fs = require('fs-extra');
const path = require('path');

// --- Log Streaming (SSE) ---
router.get('/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const logPath = path.join(__dirname, '../../dev.log');

  // Send initial heartbeat
  res.write('data: {"type":"status", "msg":"Log link established"}\n\n');

  // Simple tail implementation
  let lastSize = 0;
  try {
    const stats = fs.statSync(logPath);
    lastSize = stats.size;
  } catch (e) {
    // Log file might not exist yet
  }

  const timer = setInterval(() => {
    try {
      const stats = fs.statSync(logPath);
      if (stats.size > lastSize) {
        const stream = fs.createReadStream(logPath, { start: lastSize, end: stats.size });
        stream.on('data', chunk => {
          res.write(`data: ${JSON.stringify({ type: 'log', content: chunk.toString() })}\n\n`);
        });
        lastSize = stats.size;
      }
    } catch (e) {
      // Ignore read errors during polling
    }
  }, 1000);

  req.on('close', () => clearInterval(timer));
});

router.get('/stats', (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    stats.totalUsers = row?.count || 0;
    db.get('SELECT COALESCE(SUM(views), 0) as count FROM post_stats', [], (err, row) => {
      stats.totalViews = row?.count || 0;
      db.get('SELECT COUNT(*) as count FROM comments', [], (err, row) => {
        stats.totalComments = row?.count || 0;
        db.get('SELECT COALESCE(AVG(avg_rating), 0) as avg FROM course_ratings', [], (err, row) => {
          stats.averageRating = row?.avg ? row.avg.toFixed(1) : '0.0';
          db.get('SELECT COUNT(*) as count FROM inquiries WHERE status = "new"', [], (err, row) => {
            stats.newInquiries = row?.count || 0;
            res.json(stats);
          });
        });
      });
    });
  });
});

// --- Analytics Trends ---
router.get('/analytics/trends', (req, res) => {
  // Mock trend data based on user creation dates
  const query = `
    SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count 
    FROM users 
    GROUP BY date ORDER BY date DESC LIMIT 7
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json(rows.reverse());
  });
});

// --- User Management ---
router.post('/users', roleAuth(['admin']), (req, res) => {
  const { name, email, password, role, plan } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (name, email, password_hash, role, plan) VALUES (?, ?, ?, ?, ?)',
    [name, email, hash, role || 'user', plan || 'Free'],
    function (err) {
      if (err) return res.status(400).json({ message: 'User already exists' });
      res.json({ id: this.lastID, success: true });
    },
  );
});

router.patch('/users/:id', roleAuth(['admin']), (req, res) => {
  const { role, plan, name } = req.body;
  db.run(
    'UPDATE users SET role = COALESCE(?, role), plan = COALESCE(?, plan), name = COALESCE(?, name) WHERE id = ?',
    [role, plan, name, req.params.id],
    err => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json({ success: true });
    },
  );
});

router.get('/users', (req, res) => {
  const { plan, role } = req.query;
  let query = 'SELECT id, name, email, role, plan, created_at FROM users';
  const params = [];
  const conditions = [];
  if (plan) {
    conditions.push('plan = ?');
    params.push(plan);
  }
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// --- CRM: Inquiries & Email Templates ---
router.get('/templates', (req, res) => {
  db.all('SELECT * FROM email_templates', [], (err, rows) => {
    res.json(rows);
  });
});

router.post('/templates', (req, res) => {
  const { name, subject, body } = req.body;
  db.run(
    'INSERT INTO email_templates (name, subject, body) VALUES (?, ?, ?)',
    [name, subject, body],
    err => {
      if (err) return res.status(400).json({ message: 'Template name must be unique' });
      res.json({ success: true });
    },
  );
});

router.get('/activity', (req, res) => {
  const query = `
    SELECT 'interaction' as activity_type, type as event, metadata, created_at, COALESCE(u.name, 'Guest User') as user_name
    FROM user_interactions ui LEFT JOIN users u ON ui.user_id = u.id
    UNION ALL
    SELECT 'inquiry' as activity_type, subject as event, message as metadata, created_at, name as user_name FROM inquiries
    ORDER BY created_at DESC LIMIT 15
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

router.get('/inquiries', (req, res) => {
  db.all('SELECT * FROM inquiries ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

router.patch('/inquiries/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run('UPDATE inquiries SET status = ? WHERE id = ?', [status, id], err => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ success: true });
  });
});

router.get('/users/:id/profile', (req, res) => {
  const { id } = req.params;
  const profile = {};
  db.get(
    'SELECT id, name, email, role, plan, created_at FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err || !user) return res.status(404).json({ message: 'User not found' });
      profile.user = user;
      db.all(
        'SELECT * FROM user_interactions WHERE user_id = ? ORDER BY created_at DESC',
        [id],
        (err, interactions) => {
          profile.interactions = interactions || [];
          db.all(
            'SELECT n.*, u.name as therapist_name FROM user_notes n JOIN users u ON n.therapist_id = u.id WHERE n.user_id = ? ORDER BY n.created_at DESC',
            [id],
            (err, notes) => {
              profile.notes = notes || [];
              res.json(profile);
            },
          );
        },
      );
    },
  );
});

router.post('/users/:id/notes', (req, res) => {
  const { id: user_id } = req.params;
  const { content } = req.body;
  const therapist_id = req.user.id;
  db.run(
    'INSERT INTO user_notes (user_id, therapist_id, content) VALUES (?, ?, ?)',
    [user_id, therapist_id, content],
    err => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ success: true });
    },
  );
});

// --- Quizzes ---
router.get('/quizzes', (req, res) => {
  db.all('SELECT * FROM quizzes ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json(rows);
  });
});

router.get('/quizzes/:id', (req, res) => {
  db.get('SELECT * FROM quizzes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    if (row && row.questions) row.questions = JSON.parse(row.questions);
    res.json(row);
  });
});

router.post('/quizzes', (req, res) => {
  const { title, description, result_message, questions, status } = req.body;
  db.run(
    'INSERT INTO quizzes (title, description, result_message, questions, status) VALUES (?, ?, ?, ?, ?)',
    [title, description, result_message, JSON.stringify(questions), status || 'draft'],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json({ id: this.lastID, success: true });
    },
  );
});

router.put('/quizzes/:id', (req, res) => {
  const { title, description, result_message, questions, status } = req.body;
  db.run(
    'UPDATE quizzes SET title = ?, description = ?, result_message = ?, questions = ?, status = ? WHERE id = ?',
    [title, description, result_message, JSON.stringify(questions), status, req.params.id],
    err => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json({ success: true });
    },
  );
});

router.delete('/quizzes/:id', (req, res) => {
  db.run('DELETE FROM quizzes WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json({ success: true });
  });
});

router.get('/popular', (req, res) => {
  db.all(
    'SELECT slug, views, likes, dislikes FROM post_stats ORDER BY views DESC LIMIT 5',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(rows);
    },
  );
});

router.get('/comments', (req, res) => {
  db.all('SELECT * FROM comments ORDER BY timestamp DESC LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

module.exports = router;
