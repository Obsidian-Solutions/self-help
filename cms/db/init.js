const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = path.join(__dirname, '../db/mindfull.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users/Admin
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Courses
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    slug TEXT UNIQUE,
    category TEXT,
    illustration TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Lessons
  db.run(`CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    content TEXT,
    slug TEXT,
    order_index INTEGER,
    illustration TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`);

  // Quizzes
  db.run(`CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER,
    title TEXT,
    description TEXT,
    result_message TEXT,
    questions JSON,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
  )`);

  // Therapists
  db.run(`CREATE TABLE IF NOT EXISTS therapists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    bio TEXT,
    specialty TEXT,
    location TEXT,
    rate TEXT,
    image_url TEXT,
    available INTEGER DEFAULT 1,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Post Stats (Views, Likes, Dislikes)
  db.run(`CREATE TABLE IF NOT EXISTS post_stats (
    slug TEXT PRIMARY KEY,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0
  )`);

  // Comments
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT,
    user_name TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // View Locks (Prevent double-counting)
  db.run(`CREATE TABLE IF NOT EXISTS view_locks (
    post_slug TEXT,
    viewer_id TEXT,
    PRIMARY KEY (post_slug, viewer_id)
  )`);

  // Create default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (err) console.error(err);
    if (!row) {
      const hash = bcrypt.hashSync(adminPassword, 10);
      db.run(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Admin', adminEmail, hash],
        err => {
          if (err) console.error(err);
          else console.log(`Default admin created: ${adminEmail}`);
        },
      );
    } else {
      console.log('Admin user already exists.');
    }
  });
});

console.log('Database schema initialized.');
