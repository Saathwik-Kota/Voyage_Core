const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const { initTracer } = require('jaeger-client');
const winston = require('winston');

const { createIdentityController } = require('./controllers/identity.controller');
const { createIdentityRouter } = require('./routes/identity.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Distributed Jaeger tracing
const tracer = initTracer({
  serviceName: 'identity-manager',
  sampler: { type: 'const', param: 1 },
  reporter: { agentHost: process.env.JAEGER_AGENT_HOST || 'localhost' }
}, {});

// Database connection
if (!process.env.DATABASE_URL) {
  logger.error({ error: 'DATABASE_URL is not set' });
}
if (!process.env.JWT_SECRET) {
  logger.error({ error: 'JWT_SECRET is not set' });
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging with tracing span
app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  req.span = span;
  logger.info({ method: req.method, path: req.path, traceId: span.context().toTraceId() });
  res.on('finish', () => span.finish());
  next();
});

// Controllers and Routes initialization
const identityController = createIdentityController({ pool, logger });
const identityRouter = createIdentityRouter(identityController);

app.get('/health', identityController.healthCheck);
app.use('/api/auth', identityRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info({ event: 'server_started', service: 'identity-manager', port: PORT }));
}

module.exports = app;
