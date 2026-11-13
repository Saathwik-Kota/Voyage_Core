const request = require('supertest');
const app = require('../src/index');

describe('Booking Engine Service', () => {
  let travelId;
  let destinationId;

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Destinations Management', () => {
    it('should create a new destination', async () => {
      const res = await request(app)
        .post('/api/destinations')
        .send({
          name: 'Paris',
          country: 'France',
          city: 'Paris',
          description: 'City of Lights',
          imageUrl: 'https://example.com/paris.jpg'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      destinationId = res.body.id;
    });

    it('should get all destinations', async () => {
      const res = await request(app).get('/api/destinations');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should delete destination', async () => {
      const res = await request(app).delete(`/api/destinations/${destinationId}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/travels', () => {
    it('should create a new travel', async () => {
      const res = await request(app)
        .post('/api/travels')
        .send({
          title: 'European Adventure',
          description: 'Explore Europe',
          price: 2500.00,
          durationDays: 10,
          startDate: '2024-06-01',
          endDate: '2024-06-10',
          maxParticipants: 20
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      travelId = res.body.id;
    });
  });

  describe('GET /api/travels', () => {
    it('should get all travels', async () => {
      const res = await request(app).get('/api/travels');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('travels');
    });
  });

  describe('GET /api/travels/:id', () => {
    it('should get travel by id', async () => {
      const res = await request(app).get(`/api/travels/${travelId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('European Adventure');
    });
  });

  describe('PUT /api/travels/:id', () => {
    it('should update travel', async () => {
      const res = await request(app)
        .put(`/api/travels/${travelId}`)
        .send({
          title: 'Updated European Adventure',
          description: 'Explore Europe Updated',
          price: 2600.00,
          durationDays: 10,
          startDate: '2024-06-01',
          endDate: '2024-06-10',
          maxParticipants: 25,
          status: 'active'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated European Adventure');
    });
  });

  describe('DELETE /api/travels/:id', () => {
    it('should delete travel', async () => {
      const res = await request(app).delete(`/api/travels/${travelId}`);
      expect(res.statusCode).toBe(200);
    });
  });
});
