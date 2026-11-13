const request = require('supertest');
const app = require('../src/index');

describe('Identity Manager Service', () => {
  let authToken;

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test@1234',
          firstName: 'Test',
          lastName: 'User'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@1234',
          firstName: 'Test',
          lastName: 'User'
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should reject missing token', async () => {
      const res = await request(app).post('/api/auth/verify');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });
});
