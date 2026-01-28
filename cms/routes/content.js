const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const matter = require('gray-matter');
const { auth } = require('../middleware/auth');
const db = require('../utils/db');
const jwt = require('jsonwebtoken');

const CONTENT_DIR = path.join(__dirname, '../../content');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

// --- Security Helpers ---

const sanitizeLog = str => {
  if (typeof str !== 'string') return '';
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[^\w\s-./]/gi, '').substring(0, 100);
};

const isValidSlug = slug => {
  // eslint-disable-next-line no-useless-escape
  return typeof slug === 'string' && /^[a-z0-9-/]+$/i.test(slug);
};

// --- Public Blog Interaction Endpoints ---

router.get('/posts/:slug/stats', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });

  db.get('SELECT * FROM post_stats WHERE slug = ?', [slug], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json(row || { slug, views: 0, likes: 0, dislikes: 0 });
  });
});

router.post('/posts/:slug/view', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });

  let viewerId = req.cookies.mindfull_viewer_id;
  let userId = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      viewerId = `user_${userId}`;
    } catch (e) {
      /* fallback */
    }
  }

  if (!viewerId || typeof viewerId !== 'string' || !viewerId.startsWith('user_')) {
    const guestId = req.cookies.mindfull_viewer_id;
    if (guestId && typeof guestId === 'string' && /^[a-z0-9_]+$/i.test(guestId)) {
      viewerId = guestId;
    } else {
      viewerId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      res.cookie('mindfull_viewer_id', viewerId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
  }

  db.get(
    'SELECT * FROM view_locks WHERE post_slug = ? AND viewer_id = ?',
    [slug, viewerId],
    (err, lock) => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      if (lock) return res.json({ success: true, already_counted: true });

      db.serialize(() => {
        db.run('INSERT INTO view_locks (post_slug, viewer_id) VALUES (?, ?)', [slug, viewerId]);
        db.run(
          'INSERT INTO post_stats (slug, views) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET views = views + 1',
          [slug],
        );
        db.run('INSERT INTO user_interactions (user_id, type, metadata) VALUES (?, ?, ?)', [
          userId,
          'post_view',
          slug,
        ]);
        res.json({ success: true, new_view: true });
      });
    },
  );
});

router.post('/posts/:slug/react', (req, res) => {
  const { slug } = req.params;
  const { type } = req.body;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });
  if (type !== 'like' && type !== 'dislike')
    return res.status(400).json({ message: 'Invalid type' });

  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      userId = jwt.verify(authHeader.split(' ')[1], JWT_SECRET).id;
    } catch (e) {}
  }

  const column = type === 'like' ? 'likes' : 'dislikes';
  db.serialize(() => {
    db.run(
      `INSERT INTO post_stats (slug, ${column}) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET ${column} = ${column} + 1`,
      [slug],
    );
    db.run('INSERT INTO user_interactions (user_id, type, metadata) VALUES (?, ?, ?)', [
      userId,
      'post_reaction',
      `${type}: ${slug}`,
    ]);
    res.json({ success: true });
  });
});

router.get('/posts/:slug/comments', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });
  db.all(
    'SELECT * FROM comments WHERE post_slug = ? ORDER BY timestamp DESC',
    [slug],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json(rows);
    },
  );
});

router.post('/posts/:slug/comments', (req, res) => {
  const { slug } = req.params;
  const { user_name, content } = req.body;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });
  if (!user_name || !content) return res.status(400).json({ message: 'Missing fields' });

  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      userId = jwt.verify(authHeader.split(' ')[1], JWT_SECRET).id;
    } catch (e) {}
  }

  db.serialize(() => {
    db.run('INSERT INTO comments (post_slug, user_name, content) VALUES (?, ?, ?)', [
      slug,
      sanitizeLog(user_name),
      content.substring(0, 1000),
    ]);
    db.run('INSERT INTO user_interactions (user_id, type, metadata) VALUES (?, ?, ?)', [
      userId,
      'post_comment',
      slug,
    ]);
    res.json({ success: true });
  });
});

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Missing fields' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: 'Invalid email' });

  db.run(
    'INSERT INTO inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [sanitizeLog(name), email, sanitizeLog(subject || 'Inquiry'), message],
    err => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json({ success: true });
    },
  );
});

router.get('/courses/:slug/rating', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });
  db.get('SELECT * FROM course_ratings WHERE course_slug = ?', [slug], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json(row || { course_slug: slug, avg_rating: 0, total_ratings: 0 });
  });
});

router.post('/courses/:slug/rate', (req, res) => {
  const { slug } = req.params;
  const { rating } = req.body;
  if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Invalid rating' });

  let viewerId = req.cookies.mindfull_viewer_id;
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      userId = decoded.id;
      viewerId = `user_${userId}`;
    } catch (e) {}
  }

  if (!viewerId) {
    viewerId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    res.cookie('mindfull_viewer_id', viewerId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  db.get(
    'SELECT * FROM course_rating_locks WHERE course_slug = ? AND viewer_id = ?',
    [slug, viewerId],
    (err, lock) => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      if (lock) return res.status(400).json({ message: 'Already rated' });

      db.serialize(() => {
        db.run(
          'INSERT INTO course_rating_locks (course_slug, viewer_id, rating) VALUES (?, ?, ?)',
          [slug, viewerId, rating],
        );
        db.run(
          'INSERT INTO course_ratings (course_slug, avg_rating, total_ratings) VALUES (?, ?, 1) ON CONFLICT(course_slug) DO UPDATE SET avg_rating = (avg_rating * total_ratings + ?) / (total_ratings + 1), total_ratings = total_ratings + 1',
          [slug, rating, rating],
        );
        db.run('INSERT INTO user_interactions (user_id, type, metadata) VALUES (?, ?, ?)', [
          userId,
          'course_rating',
          `${rating} stars: ${slug}`,
        ]);
        res.json({ success: true });
      });
    },
  );
});

const safePath = (...paths) => {
  const joined = path.join(CONTENT_DIR, ...paths);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(path.resolve(CONTENT_DIR))) {
    throw new Error('Access denied: path is outside content directory');
  }
  return resolved;
};

router.get('/:collection', auth, async (req, res) => {
  try {
    const { collection } = req.params;
    if (!isValidSlug(collection)) return res.status(400).json({ message: 'Invalid collection' });
    const collectionPath = safePath(collection);
    if (!(await fs.pathExists(collectionPath)))
      return res.status(404).json({ message: 'Not found' });
    const files = await fs.readdir(collectionPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));
    const content = await Promise.all(
      mdFiles.map(async file => {
        const { data, content: body } = matter(
          await fs.readFile(path.join(collectionPath, file), 'utf8'),
        );
        return { slug: file.replace('.md', ''), data, body: body.substring(0, 200) + '...' };
      }),
    );
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = safePath(collection, `${slug}.md`);
    if (!(await fs.pathExists(filePath))) return res.status(404).json({ message: 'Not found' });
    const { data, content: body } = matter(await fs.readFile(filePath, 'utf8'));
    res.json({ data, body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const { data, body } = req.body;
    const filePath = safePath(collection, `${slug}.md`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, matter.stringify(body || '', data || {}), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = safePath(collection, `${slug}.md`);
    if (!(await fs.pathExists(filePath))) return res.status(404).json({ message: 'Not found' });
    await fs.remove(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
