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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', limiter);
app.use('/api/v1/auth', authLimiter);

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/leads', require('./routes/leads'));
app.use('/api/v1/opportunities', require('./routes/opportunities'));
app.use('/api/v1/activities', require('./routes/activities'));
app.use('/api/v1/kpis', require('./routes/kpis'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use(errorHandler);

module.exports = app;
