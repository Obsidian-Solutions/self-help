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
// Uses Double-Submit Cookie pattern
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies['XSRF-TOKEN'];
  const csrfHeader = req.headers['x-xsrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }
  next();
};

// Middleware to set CSRF cookie
app.use((req, res, next) => {
  if (!req.cookies['XSRF-TOKEN']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by client-side JS to send in header
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:1313',
  'http://localhost:1314', // Docs site
  'http://localhost:4242', // Pubdev gateway
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(null, true); // Fallback to allow for dynamic ngrok URLs
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CMS is running' });
});

// Routes - Apply CSRF protection to all API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', csrfProtection, contentRoutes);
app.use('/api/admin', csrfProtection, adminRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CMS Server running on http://localhost:${PORT}`);
});