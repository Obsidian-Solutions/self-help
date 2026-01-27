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

module.exports = router;
