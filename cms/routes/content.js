const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const matter = require('gray-matter');
const auth = require('../middleware/auth');
const db = require('../utils/db');

const CONTENT_DIR = path.join(__dirname, '../../content');

// --- Public Blog Interaction Endpoints ---

// Get post stats (views, likes)
router.get('/posts/:slug/stats', (req, res) => {
  const { slug } = req.params;
  db.get('SELECT * FROM post_stats WHERE slug = ?', [slug], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json(row || { slug, views: 0, likes: 0, dislikes: 0 });
  });
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

// Record a view (Unique per person)
router.post('/posts/:slug/view', (req, res) => {
  const { slug } = req.params;

  // 1. Identify the viewer
  let viewerId = req.cookies.mindfull_viewer_id;

  // Check if they are logged in via JWT header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      viewerId = `user_${decoded.id}`;
    } catch (e) {
      /* Invalid token, fallback to cookie */
    }
  }

  // If no viewerId yet (first time guest), create one
  if (!viewerId) {
    viewerId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    res.cookie('mindfull_viewer_id', viewerId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
  }

  // 2. Check for existing lock
  db.get(
    'SELECT * FROM view_locks WHERE post_slug = ? AND viewer_id = ?',
    [slug, viewerId],
    (err, lock) => {
      if (err) return res.status(500).json({ message: 'DB Error' });

      if (lock) {
        // Already counted this view
        return res.json({ success: true, already_counted: true });
      }

      // 3. Record new view and create lock
      db.serialize(() => {
        db.run('INSERT INTO view_locks (post_slug, viewer_id) VALUES (?, ?)', [slug, viewerId]);
        db.run(
          'INSERT INTO post_stats (slug, views) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET views = views + 1',
          [slug],
          err => {
            if (err) return res.status(500).json({ message: 'DB Error' });
            res.json({ success: true, new_view: true });
          },
        );
      });
    },
  );
});

// Record a reaction (like/dislike)
router.post('/posts/:slug/react', (req, res) => {
  const { slug } = req.params;
  const { type } = req.body; // 'like' or 'dislike'
  const column = type === 'like' ? 'likes' : 'dislikes';

  db.run(
    `INSERT INTO post_stats (slug, ${column}) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET ${column} = ${column} + 1`,
    [slug],
    err => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json({ success: true });
    },
  );
});

// Get comments for a post
router.get('/posts/:slug/comments', (req, res) => {
  const { slug } = req.params;
  db.all(
    'SELECT * FROM comments WHERE post_slug = ? ORDER BY timestamp DESC',
    [slug],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json(rows);
    },
  );
});

// Post a new comment
router.post('/posts/:slug/comments', (req, res) => {
  const { slug } = req.params;
  const { user_name, content } = req.body;
  db.run(
    'INSERT INTO comments (post_slug, user_name, content) VALUES (?, ?, ?)',
    [slug, user_name, content],
    err => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json({ success: true });
    },
  );
});

// --- CMS Content Management Endpoints ---
const safePath = (...paths) => {
  const joined = path.join(CONTENT_DIR, ...paths);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(path.resolve(CONTENT_DIR))) {
    throw new Error('Access denied: path is outside content directory');
  }
  return resolved;
};

// Helper to get all files in a collection
router.get('/:collection', auth, async (req, res) => {
  try {
    const { collection } = req.params;
    const collectionPath = safePath(collection);

    if (!(await fs.pathExists(collectionPath))) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const files = await fs.readdir(collectionPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    const content = await Promise.all(
      mdFiles.map(async file => {
        const filePath = path.join(collectionPath, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content: body } = matter(fileContent);
        return {
          slug: file.replace('.md', ''),
          data,
          body: body.substring(0, 200) + '...', // Excerpt
        };
      }),
    );

    res.json(content);
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// Get single entry
router.get('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = safePath(collection, `${slug}.md`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content: body } = matter(fileContent);
    res.json({ data, body });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// Create/Update entry
router.post('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const { data, body } = req.body;
    const filePath = safePath(collection, `${slug}.md`);

    const fileContent = matter.stringify(body || '', data || {});
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, fileContent, 'utf8');
    res.json({ message: 'Entry saved successfully', slug });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// Delete entry
router.delete('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = safePath(collection, `${slug}.md`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    await fs.remove(filePath);
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

module.exports = router;
