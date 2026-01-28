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
    role TEXT DEFAULT 'user',
    plan TEXT DEFAULT 'Free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migration: Ensure plan and role exist
  db.all('PRAGMA table_info(users)', (err, rows) => {
    if (rows) {
      const hasPlan = rows.some(r => r.name === 'plan');
      if (!hasPlan) db.run("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'Free'");
    }
  });

  // CRM: Email Templates
  db.run(`CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    subject TEXT,
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Other Tables
  db.run(
    "CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, slug TEXT UNIQUE, category TEXT, illustration TEXT, status TEXT DEFAULT 'draft', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, title TEXT, content TEXT, slug TEXT, order_index INTEGER, illustration TEXT, status TEXT DEFAULT 'draft', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (course_id) REFERENCES courses(id))",
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS quizzes (id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_id INTEGER, title TEXT, description TEXT, result_message TEXT, questions JSON, status TEXT DEFAULT 'draft', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (lesson_id) REFERENCES lessons(id))",
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS therapists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, bio TEXT, specialty TEXT, location TEXT, rate TEXT, image_url TEXT, available INTEGER DEFAULT 1, status TEXT DEFAULT 'published', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS post_stats (slug TEXT PRIMARY KEY, views INTEGER DEFAULT 0, likes INTEGER DEFAULT 0, dislikes INTEGER DEFAULT 0)',
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_slug TEXT, user_name TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)',
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS view_locks (post_slug TEXT, viewer_id TEXT, PRIMARY KEY (post_slug, viewer_id))',
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS course_ratings (course_slug TEXT PRIMARY KEY, avg_rating REAL DEFAULT 0, total_ratings INTEGER DEFAULT 0)',
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS course_rating_locks (course_slug TEXT, viewer_id TEXT, rating INTEGER, PRIMARY KEY (course_slug, viewer_id))',
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, subject TEXT, message TEXT, status TEXT DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS user_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, therapist_id INTEGER, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (therapist_id) REFERENCES users(id))',
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS user_interactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, type TEXT, metadata TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))',
  );

  // Default Email Templates (Fixed with template literals)
  const templates = [
    {
      name: 'Welcome',
      subject: 'Welcome to MindFull!',
      body: 'Hi {{name}}, Welcome to your journey towards better mental health! We are thrilled to have you here.',
    },
    {
      name: 'Inquiry Reply',
      subject: 'Re: Your Inquiry',
      body: 'Hi {{name}}, Thank you for reaching out. We have reviewed your message: "{{message}}". How can we help further?',
    },
  ];

  templates.forEach(t => {
    db.run('INSERT OR IGNORE INTO email_templates (name, subject, body) VALUES (?, ?, ?)', [
      t.name,
      t.subject,
      t.body,
    ]);
  });

  // Create default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync(adminPassword, 10);
      db.run(
        'INSERT INTO users (name, email, password_hash, role, plan) VALUES (?, ?, ?, ?, ?)',
        ['Admin', adminEmail, hash, 'admin', 'Pro'],
        err => {
          if (err) console.error('Error creating admin:', err);
          else console.log(`Default admin created: ${adminEmail}`);
        },
      );
    } else {
      console.log('Admin user already exists.');
    }
  });
});
console.log('Database schema initialization started...');
