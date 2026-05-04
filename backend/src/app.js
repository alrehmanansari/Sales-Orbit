const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const DIST = path.join(__dirname, '../../dist');

const errorHandler = require('./middleware/error');

const app = express();

// Trust Nginx reverse proxy — required for req.ip to be the real client IP
// (affects rate limiting, logging, and CORS origin detection)
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());

// Reflect origin for all localhost origins in dev; strict in production
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman / curl / same-origin
    if (process.env.NODE_ENV !== 'production') {
      // Dev: allow any localhost or 127.0.0.1 origin by reflecting it
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, origin);
      }
    }
    // Production: only the configured frontend URL
    const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
    cb(null, origin === allowed ? origin : false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiters — always return JSON so the frontend can parse the error message
const jsonRateLimit = (opts) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many requests. Please wait a moment and try again.' });
  },
  ...opts,
});

const limiter     = jsonRateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
// Higher limit in dev (Vite proxy funnels all clients through 127.0.0.1)
const authLimiter = jsonRateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 200,
});

app.use('/api/', limiter);
app.use('/api/v1/auth', authLimiter);

app.use('/api/v1/auth',         require('./routes/auth'));
app.use('/api/v1/users',        require('./routes/users'));
app.use('/api/v1/leads',        require('./routes/leads'));
app.use('/api/v1/opportunities',require('./routes/opportunities'));
app.use('/api/v1/activities',   require('./routes/activities'));
app.use('/api/v1/kpis',         require('./routes/kpis'));
app.use('/api/v1/dashboard',    require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST));
}

// Catch-all: API routes → JSON 404; frontend routes → serve index.html (SPA)
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
  }
  if (process.env.NODE_ENV === 'production') {
    return res.sendFile(path.join(DIST, 'index.html'));
  }
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
});

app.use(errorHandler);

module.exports = app;
