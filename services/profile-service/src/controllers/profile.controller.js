const bcrypt = require('bcrypt');
const Joi = require('joi');

const profileSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('admin', 'user').optional(),
  isActive: Joi.boolean().optional()
});

const createProfileController = ({ pool, logger }) => {
  const healthCheck = (req, res) => {
    res.json({ status: 'healthy', service: 'profile-service' });
  };

  const getProfiles = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role, phone, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const countResult = await pool.query('SELECT COUNT(*) FROM users');

      res.json({
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  const getProfileById = async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role, phone, is_active, created_at FROM users WHERE id = $1',
        [req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  const createProfile = async (req, res) => {
    try {
      const { error, value } = profileSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { email, password, firstName, lastName, phone, role = 'user', isActive = true } = value;
      const passwordHash = await bcrypt.hash(password || 'TempPass@123', 10);

      const result = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role, phone, is_active',
        [email, passwordHash, firstName, lastName, phone, role, isActive]
      );

      logger.info({ event: 'profile_created', userId: result.rows[0].id });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to create user' });
    }
  };

  const updateProfile = async (req, res) => {
    try {
      const { error, value } = profileSchema.validate(req.body, { stripUnknown: true });
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { email, firstName, lastName, phone, role, isActive } = value;

      const result = await pool.query(
        'UPDATE users SET email = $1, first_name = $2, last_name = $3, phone = $4, role = $5, is_active = $6 WHERE id = $7 RETURNING id, email, first_name, last_name, role, phone, is_active',
        [email, firstName, lastName, phone, role, isActive, req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      logger.info({ event: 'profile_updated', userId: req.params.id });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to update user' });
    }
  };

  const deleteProfile = async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      logger.info({ event: 'profile_deleted', userId: req.params.id });
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Failed to delete user' });
    }
  };

  return {
    healthCheck,
    getProfiles,
    getProfileById,
    createProfile,
    updateProfile,
    deleteProfile
  };
};

module.exports = { createProfileController };

