const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.CMS_PORT || 3000;

// Security Middleware
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline for admin panel simplicity
      },
    },
  }),
);

// --- Custom Lightweight CSRF Protection ---
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const csrfCookie = req.cookies['XSRF-TOKEN'];
  const csrfHeader = req.headers['x-xsrf-token'];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }
  next();
};

app.use((req, res, next) => {
  if (!req.cookies['XSRF-TOKEN']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:1313',
  'http://localhost:1314',
  'http://localhost:4242',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(morgan('dev'));
// Increase limit for base64 media uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CMS is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', csrfProtection, contentRoutes);
app.use('/api/admin', csrfProtection, adminRoutes);
app.use('/api/media', csrfProtection, mediaRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CMS Server running on http://localhost:${PORT}`);
});
