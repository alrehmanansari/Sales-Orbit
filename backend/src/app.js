const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(compression());

// Allow any localhost / 127.0.0.1 origin in dev; strict in production
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman, mobile, same-origin
    if (process.env.NODE_ENV !== 'production') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    }
    const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
    cb(origin === allowed ? null : new Error('CORS'), origin === allowed);
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

// Catch-all: return JSON 404 instead of Express's default HTML page
app.use((req, res) => {
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
});

app.use(errorHandler);

module.exports = app;
