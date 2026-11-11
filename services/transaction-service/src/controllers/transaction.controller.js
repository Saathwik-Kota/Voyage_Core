const Joi = require('joi');

const paymentMethodSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('stripe', 'paypal').required(),
  isActive: Joi.boolean().optional(),
  config: Joi.object().optional()
});

const createTransactionController = ({ pool, stripe, paypalClient, paypal, logger }) => {
  const healthCheck = (req, res) => {
    res.json({ status: 'healthy', service: 'transaction-service' });
  };

  const getPaymentMethods = async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM payment_methods ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  };

  const getPaymentMethodById = async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM payment_methods WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Payment method not found' });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch payment method' });
    }
  };

  const createPaymentMethod = async (req, res) => {
    try {
      const { error, value } = paymentMethodSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { name, type, isActive = true, config = {} } = value;

      const result = await pool.query(
        'INSERT INTO payment_methods (name, type, is_active, config) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, type, isActive, JSON.stringify(config)]
      );

      logger.info({ event: 'payment_method_created', methodId: result.rows[0].id });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Payment method already exists' });
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to create payment method' });
    }
  };

  const updatePaymentMethod = async (req, res) => {
    try {
      const { error, value } = paymentMethodSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { name, type, isActive, config } = value;

      const result = await pool.query(
        'UPDATE payment_methods SET name = $1, type = $2, is_active = $3, config = $4 WHERE id = $5 RETURNING *',
        [name, type, isActive, JSON.stringify(config), req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Payment method not found' });

      logger.info({ event: 'payment_method_updated', methodId: req.params.id });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to update payment method' });
    }
  };

  const deletePaymentMethod = async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM payment_methods WHERE id = $1 RETURNING id', [req.params.id]);

      if (result.rows.length === 0) return res.status(404).json({ error: 'Payment method not found' });

      logger.info({ event: 'payment_method_deleted', methodId: req.params.id });
      res.json({ message: 'Payment method deleted successfully' });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to delete payment method' });
    }
  };

  const processStripePayment = async (req, res) => {
    try {
      const { amount, currency = 'usd', bookingId, paymentMethodId } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: { bookingId }
      });

      await pool.query(
        'INSERT INTO payments (booking_id, payment_method_id, amount, currency, status, transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [bookingId, paymentMethodId, amount, currency, 'pending', paymentIntent.id]
      );

      logger.info({ event: 'stripe_payment_initiated', paymentIntentId: paymentIntent.id });
      res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to process Stripe payment' });
    }
  };

  const processPaypalPayment = async (req, res) => {
    try {
      const { amount, currency = 'USD', bookingId, paymentMethodId } = req.body;

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }]
      });

      const order = await paypalClient.execute(request);

      await pool.query(
        'INSERT INTO payments (booking_id, payment_method_id, amount, currency, status, transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [bookingId, paymentMethodId, amount, currency, 'pending', order.result.id]
      );

      logger.info({ event: 'paypal_payment_initiated', orderId: order.result.id });
      res.json({ orderId: order.result.id, links: order.result.links });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to process PayPal payment' });
    }
  };

  const getPayments = async (req, res) => {
    try {
      const { bookingId } = req.query;
      let query = 'SELECT * FROM payments';
      let params = [];

      if (bookingId) {
        query += ' WHERE booking_id = $1';
        params.push(bookingId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  };

  return {
    healthCheck,
    getPaymentMethods,
    getPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    processStripePayment,
    processPaypalPayment,
    getPayments
  };
};

module.exports = { createTransactionController };

