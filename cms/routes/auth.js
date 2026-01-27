const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:1313';

// SSO Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// --- Local Login ---
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Please login with SSO' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });
});

// --- Google SSO ---
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(500).send('Google Auth not configured');

  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile email`;

  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  try {
    // 1. Exchange code for token
    const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    // 2. Get User Info
    const { data: userData } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    handleSSOUser(userData.email, userData.name, userData.picture, res);
  } catch (error) {
    console.error('Google Auth Error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

// --- GitHub SSO ---
router.get('/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) return res.status(500).send('GitHub Auth not configured');

  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // 1. Exchange code for token
    const { data: tokenData } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } },
    );

    if (tokenData.error) throw new Error(tokenData.error_description);

    // 2. Get User Profile
    const { data: userProfile } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    // 3. Get User Email (GitHub emails can be private)
    let email = userProfile.email;
    if (!email) {
      const { data: emails } = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const primary = emails.find(e => e.primary && e.verified);
      email = primary ? primary.email : emails[0].email;
    }

    handleSSOUser(email, userProfile.name || userProfile.login, userProfile.avatar_url, res);
  } catch (error) {
    console.error('GitHub Auth Error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/login?error=github_auth_failed`);
  }
});

// --- SSO Helper ---
function handleSSOUser(email, name, avatar, res) {
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.redirect(`${FRONTEND_URL}/login?error=db_error`);

    if (user) {
      // User exists - Log them in
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '8h',
      });
      // Redirect to frontend with token
      // In a real app, you might use a secure httpOnly cookie, but for this "theme" prototype, query param is okay for simple handoff
      // Or we can render a script to set localStorage and redirect.
      res.redirect(`${FRONTEND_URL}/dashboard?token=${token}&sso_success=true`);
    } else {
      // Create new user
      db.run(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        [name, email, 'user'],
        function (err) {
          if (err) return res.redirect(`${FRONTEND_URL}/login?error=create_error`);

          const newUser = { id: this.lastID, email, name, role: 'user' };
          const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '8h' },
          );

          res.redirect(`${FRONTEND_URL}/dashboard?token=${token}&sso_success=true&new_user=true`);
        },
      );
    }
  });
}

module.exports = router;
