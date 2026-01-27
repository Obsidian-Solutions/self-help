const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { roleAuth } = require('../middleware/auth');

// Protect all admin routes
router.use(roleAuth(['admin', 'therapist']));

// --- Overall Stats ---
router.get('/stats', (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    stats.totalUsers = row?.count || 0;

    db.get('SELECT SUM(views) as count FROM post_stats', [], (err, row) => {
      stats.totalViews = row?.count || 0;

      db.get('SELECT COUNT(*) as count FROM comments', [], (err, row) => {
        stats.totalComments = row?.count || 0;

        db.get('SELECT AVG(avg_rating) as avg FROM course_ratings', [], (err, row) => {
          stats.averageRating = row?.avg ? row.avg.toFixed(1) : '0.0';
          res.json(stats);
        });
      });
    });
  });
});

// --- Popular Content ---
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

// --- Latest Comments ---
router.get('/comments', (req, res) => {
  db.all('SELECT * FROM comments ORDER BY timestamp DESC LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// --- User List ---
router.get('/users', (req, res) => {
  db.all(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(rows);
    },
  );
});

// --- CRM: Inquiries (Leads) ---
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

// --- CRM: User Profile Deep-dive ---
router.get('/users/:id/profile', (req, res) => {
  const { id } = req.params;
  const profile = {};

  db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, user) => {
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
  });
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

module.exports = router;
