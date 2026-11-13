const request = require('supertest');
const app = require('../src/index');

describe('Profile Service', () => {
  let userId;

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          password: 'Pass@1234',
          firstName: 'New',
          lastName: 'User'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      userId = res.body.id;
    });
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const res = await request(app).get(`/api/users/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('newuser@example.com');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({
          email: 'updated@example.com',
          firstName: 'Updated',
          lastName: 'User',
          role: 'user',
          isActive: true
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('updated@example.com');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const res = await request(app).delete(`/api/users/${userId}`);
      expect(res.statusCode).toBe(200);
    });
  });
});
