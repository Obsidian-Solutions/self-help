const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.CMS_PORT || 3000;

// Security Middleware
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CMS is running' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CMS Server running on http://localhost:${PORT}`);
});
