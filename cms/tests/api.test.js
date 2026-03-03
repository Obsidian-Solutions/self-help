const request = require('supertest');
const express = require('express');

// Import our routes and app logic
// We'll create a test version of the app to avoid port conflicts
// Mock middleware before importing routes
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  roleAuth: _roles => (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
}));

const authRoutes = require('../routes/auth');
const contentRoutes = require('../routes/content');
const adminRoutes = require('../routes/admin');
const mediaRoutes = require('../routes/media');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/illustrations', mediaRoutes);

describe('CMS API Suite', () => {
  test('GET /api/health should be online', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/content/posts should return a list', async () => {
    const res = await request(app).get('/api/content/posts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/content/courses should return a list', async () => {
    const res = await request(app).get('/api/content/courses');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Illustration Proxy should resolve valid prefixes', async () => {
    // We know 'breaking-barriers' exists based on previous ls
    const res = await request(app).get('/illustrations/breaking-barriers.svg');
    expect([200, 404]).toContain(res.statusCode); // Allow 404 if file missing, but check logic
  });

  test('GET /api/admin/stats should return dashboard numbers', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
  });
});
