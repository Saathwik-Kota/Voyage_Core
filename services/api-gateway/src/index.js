const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { initTracer } = require('jaeger-client');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3009;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const tracer = initTracer({
  serviceName: 'api-gateway',
  sampler: { type: 'const', param: 1 },
  reporter: { agentHost: process.env.JAEGER_AGENT_HOST || 'localhost' }
}, {});

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 origin in development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  req.span = span;
  logger.info({ method: req.method, path: req.path, traceId: span.context().toTraceId() });
  res.on('finish', () => span.finish());
  next();
});

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Downstream Microservices Service Discovery Configuration
const IDENTITY_MANAGER_URL = process.env.IDENTITY_MANAGER_URL || process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || process.env.USER_SERVICE_URL || 'http://localhost:3002';
const BOOKING_ENGINE_URL = process.env.BOOKING_ENGINE_URL || process.env.TRAVEL_SERVICE_URL || 'http://localhost:3003';
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    downstream: {
      identityManager: IDENTITY_MANAGER_URL,
      profileService: PROFILE_SERVICE_URL,
      bookingEngine: BOOKING_ENGINE_URL,
      transactionService: TRANSACTION_SERVICE_URL
    }
  });
});

const proxyRequest = async (req, res, targetUrl, pathPrefix) => {
  try {
    const headers = { ...req.headers };
    delete headers.host;
    let targetPath = req.originalUrl;
    if (pathPrefix) {
      targetPath = targetPath.replace(new RegExp('^' + pathPrefix), '');
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }
      targetPath = pathPrefix + targetPath;
    }
    const response = await axios({
      method: req.method,
      url: targetUrl + targetPath,
      data: req.rawBody || req.body,
      headers: headers,
      validateStatus: () => true
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
};

// 1. Identity Manager (Authentication & Tokens)
app.use('/api/auth', (req, res) => {
  proxyRequest(req, res, IDENTITY_MANAGER_URL, '/api/auth');
});

// 2. Profile Service (User Management - Admin only)
app.use('/api/users', authenticate, requireAdmin, (req, res) => {
  proxyRequest(req, res, PROFILE_SERVICE_URL, '/api/users');
});

// 3. Booking Engine (Trips, Itineraries & Destinations)
app.get('/api/travels*', (req, res) => {
  proxyRequest(req, res, BOOKING_ENGINE_URL, '/api/travels');
});

app.use('/api/travels', authenticate, requireAdmin, (req, res) => {
  proxyRequest(req, res, BOOKING_ENGINE_URL, '/api/travels');
});

app.use('/api/destinations', authenticate, requireAdmin, (req, res) => {
  proxyRequest(req, res, BOOKING_ENGINE_URL, '/api/destinations');
});

// 4. Transaction Service (Payment Gateways & Processing)
app.use('/api/payment-methods', authenticate, requireAdmin, (req, res) => {
  proxyRequest(req, res, TRANSACTION_SERVICE_URL, '/api/payment-methods');
});

app.use('/api/payments', authenticate, (req, res) => {
  proxyRequest(req, res, TRANSACTION_SERVICE_URL, '/api/payments');
});

// Error handling
app.use((err, req, res, next) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => logger.info({ event: 'server_started', port: PORT }));

module.exports = app;
