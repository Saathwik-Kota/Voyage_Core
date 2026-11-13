const request = require('supertest');
const app = require('../src/index');

describe('Transaction Service', () => {
  let paymentMethodId;

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('POST /api/payment-methods', () => {
    it('should create a payment method', async () => {
      const res = await request(app)
        .post('/api/payment-methods')
        .send({
          name: 'Test Stripe',
          type: 'stripe',
          isActive: true,
          config: { key: 'test' }
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      paymentMethodId = res.body.id;
    });
  });

  describe('GET /api/payment-methods', () => {
    it('should get all payment methods', async () => {
      const res = await request(app).get('/api/payment-methods');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/payment-methods/:id', () => {
    it('should get payment method by id', async () => {
      const res = await request(app).get(`/api/payment-methods/${paymentMethodId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(paymentMethodId);
    });
  });

  describe('PUT /api/payment-methods/:id', () => {
    it('should update payment method', async () => {
      const res = await request(app)
        .put(`/api/payment-methods/${paymentMethodId}`)
        .send({
          name: 'Updated Stripe',
          type: 'stripe',
          isActive: false,
          config: { key: 'updated' }
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Stripe');
    });
  });

  describe('GET /api/payments', () => {
    it('should get payments list', async () => {
      const res = await request(app).get('/api/payments');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /api/payment-methods/:id', () => {
    it('should delete payment method', async () => {
      const res = await request(app).delete(`/api/payment-methods/${paymentMethodId}`);
      expect(res.statusCode).toBe(200);
    });
  });
});
