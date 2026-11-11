const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const neo4j = require('neo4j-driver');
const { initTracer } = require('jaeger-client');
const winston = require('winston');

const { createBookingController } = require('./controllers/booking.controller');
const { createBookingRouter } = require('./routes/booking.routes');

const app = express();
const PORT = process.env.PORT || 3003;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const tracer = initTracer({
  serviceName: 'booking-engine',
  sampler: { type: 'const', param: 1 },
  reporter: { agentHost: process.env.JAEGER_AGENT_HOST || 'localhost' }
}, {});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
);

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

const bookingController = createBookingController({ pool, driver, logger });
const bookingRouter = createBookingRouter(bookingController);

app.get('/health', bookingController.healthCheck);
app.use('/api', bookingRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info({ event: 'server_started', service: 'booking-engine', port: PORT }));
}

module.exports = app;
