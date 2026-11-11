const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const { initTracer } = require('jaeger-client');
const winston = require('winston');

const { createProfileController } = require('./controllers/profile.controller');
const { createProfileRouter } = require('./routes/profile.routes');

const app = express();
const PORT = process.env.PORT || 3002;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const tracer = initTracer({
  serviceName: 'profile-service',
  sampler: { type: 'const', param: 1 },
  reporter: { agentHost: process.env.JAEGER_AGENT_HOST || 'localhost' }
}, {});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  req.span = span;
  logger.info({ method: req.method, path: req.path, traceId: span.context().toTraceId() });
  res.on('finish', () => span.finish());
  next();
});

const profileController = createProfileController({ pool, logger });
const profileRouter = createProfileRouter(profileController);

app.get('/health', profileController.healthCheck);
app.use('/api/users', profileRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info({ event: 'server_started', service: 'profile-service', port: PORT }));
}

module.exports = app;
