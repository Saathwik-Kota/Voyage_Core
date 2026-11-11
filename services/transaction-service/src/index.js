const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const Stripe = require('stripe');
const paypal = require('@paypal/checkout-server-sdk');
const { initTracer } = require('jaeger-client');
const winston = require('winston');

const { createTransactionController } = require('./controllers/transaction.controller');
const { createTransactionRouter } = require('./routes/transaction.routes');

const app = express();
const PORT = process.env.PORT || 3004;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const tracer = initTracer({
  serviceName: 'transaction-service',
  sampler: { type: 'const', param: 1 },
  reporter: { agentHost: process.env.JAEGER_AGENT_HOST || 'localhost' }
}, {});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// PayPal environment
const paypalEnvironment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'dummy';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'dummy';
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
};
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment());

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

const transactionController = createTransactionController({ pool, stripe, paypalClient, paypal, logger });
const transactionRouter = createTransactionRouter(transactionController);

app.get('/health', transactionController.healthCheck);
app.use('/api', transactionRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info({ event: 'server_started', service: 'transaction-service', port: PORT }));
}

module.exports = app;
