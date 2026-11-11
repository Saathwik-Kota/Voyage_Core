const Joi = require('joi');

const travelSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().positive().required(),
  durationDays: Joi.number().integer().positive().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  maxParticipants: Joi.number().integer().positive().required(),
  status: Joi.string().valid('active', 'inactive', 'cancelled', 'completed').optional(),
  destinations: Joi.array().items(Joi.object({
    destinationId: Joi.string().uuid().required(),
    dayNumber: Joi.number().integer().positive().required()
  })).optional(),
  accommodations: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    address: Joi.string().optional(),
    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().required()
  })).optional(),
  transportation: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    departureLocation: Joi.string().required(),
    arrivalLocation: Joi.string().required(),
    departureTime: Joi.date().required(),
    arrivalTime: Joi.date().required(),
    provider: Joi.string().optional()
  })).optional(),
  activities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    durationHours: Joi.number().optional(),
    price: Joi.number().optional(),
    scheduledTime: Joi.date().optional()
  })).optional()
});

const createBookingController = ({ pool, driver, logger }) => {
  const healthCheck = (req, res) => {
    res.json({ status: 'healthy', service: 'booking-engine' });
  };

  // Travels / Bookings handlers
  const getAllTravels = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM travels';
      let params = [limit, offset];

      if (status) {
        query += ' WHERE status = $3';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';

      const result = await pool.query(query, params);
      const countResult = await pool.query('SELECT COUNT(*) FROM travels' + (status ? ' WHERE status = $1' : ''), status ? [status] : []);

      res.json({
        travels: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch travels' });
    }
  };

  const getTravelById = async (req, res) => {
    try {
      const travelResult = await pool.query('SELECT * FROM travels WHERE id = $1', [req.params.id]);

      if (travelResult.rows.length === 0) return res.status(404).json({ error: 'Travel not found' });

      const travel = travelResult.rows[0];

      const [destinations, accommodations, transportation, activities] = await Promise.all([
        pool.query('SELECT td.*, d.name, d.country, d.city FROM travel_destinations td JOIN destinations d ON td.destination_id = d.id WHERE td.travel_id = $1', [req.params.id]),
        pool.query('SELECT * FROM accommodations WHERE travel_id = $1', [req.params.id]),
        pool.query('SELECT * FROM transportation WHERE travel_id = $1', [req.params.id]),
        pool.query('SELECT * FROM activities WHERE travel_id = $1', [req.params.id])
      ]);

      res.json({
        ...travel,
        destinations: destinations.rows,
        accommodations: accommodations.rows,
        transportation: transportation.rows,
        activities: activities.rows
      });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch travel' });
    }
  };

  const createTravel = async (req, res) => {
    const client = await pool.connect();
    try {
      const { error, value } = travelSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      await client.query('BEGIN');

      const { title, description, price, durationDays, startDate, endDate, maxParticipants, status = 'active', destinations, accommodations, transportation, activities } = value;

      const travelResult = await client.query(
        'INSERT INTO travels (title, description, price, duration_days, start_date, end_date, max_participants, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [title, description, price, durationDays, startDate, endDate, maxParticipants, status]
      );

      const travel = travelResult.rows[0];

      if (destinations) {
        for (const dest of destinations) {
          await client.query(
            'INSERT INTO travel_destinations (travel_id, destination_id, day_number) VALUES ($1, $2, $3)',
            [travel.id, dest.destinationId, dest.dayNumber]
          );
        }
      }

      if (accommodations) {
        for (const acc of accommodations) {
          await client.query(
            'INSERT INTO accommodations (travel_id, name, type, address, check_in_date, check_out_date) VALUES ($1, $2, $3, $4, $5, $6)',
            [travel.id, acc.name, acc.type, acc.address, acc.checkInDate, acc.checkOutDate]
          );
        }
      }

      if (transportation) {
        for (const trans of transportation) {
          await client.query(
            'INSERT INTO transportation (travel_id, type, departure_location, arrival_location, departure_time, arrival_time, provider) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [travel.id, trans.type, trans.departureLocation, trans.arrivalLocation, trans.departureTime, trans.arrivalTime, trans.provider]
          );
        }
      }

      if (activities) {
        for (const act of activities) {
          await client.query(
            'INSERT INTO activities (travel_id, name, description, duration_hours, price, scheduled_time) VALUES ($1, $2, $3, $4, $5, $6)',
            [travel.id, act.name, act.description, act.durationHours, act.price, act.scheduledTime]
          );
        }
      }

      await client.query('COMMIT');
      logger.info({ event: 'travel_created', travelId: travel.id });
      res.status(201).json(travel);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to create travel' });
    } finally {
      client.release();
    }
  };

  const updateTravel = async (req, res) => {
    try {
      const { error, value } = travelSchema.validate(req.body, { stripUnknown: true });
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { title, description, price, durationDays, startDate, endDate, maxParticipants, status } = value;

      const result = await pool.query(
        'UPDATE travels SET title = $1, description = $2, price = $3, duration_days = $4, start_date = $5, end_date = $6, max_participants = $7, status = $8 WHERE id = $9 RETURNING *',
        [title, description, price, durationDays, startDate, endDate, maxParticipants, status, req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Travel not found' });

      logger.info({ event: 'travel_updated', travelId: req.params.id });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to update travel' });
    }
  };

  const deleteTravel = async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM travels WHERE id = $1 RETURNING id', [req.params.id]);

      if (result.rows.length === 0) return res.status(404).json({ error: 'Travel not found' });

      logger.info({ event: 'travel_deleted', travelId: req.params.id });
      res.json({ message: 'Travel deleted successfully' });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to delete travel' });
    }
  };

  // Destinations handlers
  const getAllDestinations = async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM destinations ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch destinations' });
    }
  };

  const createDestination = async (req, res) => {
    try {
      const { name, country, city, description, imageUrl } = req.body;
      const result = await pool.query(
        'INSERT INTO destinations (name, country, city, description, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, country, city, description, imageUrl]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to create destination' });
    }
  };

  const updateDestination = async (req, res) => {
    try {
      const { name, country, city, description, imageUrl } = req.body;
      const result = await pool.query(
        'UPDATE destinations SET name = $1, country = $2, city = $3, description = $4, image_url = $5 WHERE id = $6 RETURNING *',
        [name, country, city, description, imageUrl, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Destination not found' });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to update destination' });
    }
  };

  const deleteDestination = async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM destinations WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Destination not found' });
      res.json({ message: 'Destination deleted successfully' });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to delete destination' });
    }
  };

  return {
    healthCheck,
    getAllTravels,
    getTravelById,
    createTravel,
    updateTravel,
    deleteTravel,
    getAllDestinations,
    createDestination,
    updateDestination,
    deleteDestination
  };
};

module.exports = { createBookingController };

