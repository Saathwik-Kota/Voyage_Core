const request = require('supertest');
const app = require('../src/index');

describe('Transaction Service', () => {
  let paymentMethodId;

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

  describe('DELETE /api/payment-methods/:id', () => {
    it('should delete payment method', async () => {
      const res = await request(app).delete(`/api/payment-methods/${paymentMethodId}`);
      expect(res.statusCode).toBe(200);
    });
  });
});
