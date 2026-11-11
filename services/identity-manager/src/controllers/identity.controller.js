const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional()
});

const createIdentityController = ({ pool, logger }) => {
  const healthCheck = (req, res) => {
    res.json({ status: 'healthy', service: 'identity-manager' });
  };

  const register = async (req, res) => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { email, password, firstName, lastName, phone } = value;
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
        [email, passwordHash, firstName, lastName, phone]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info({ event: 'identity_registered', userId: user.id });
      res.status(201).json({ user, token });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Registration failed' });
    }
  };

  const login = async (req, res) => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { email, password } = value;
      const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);

      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info({ event: 'identity_login', userId: user.id });
      res.json({
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
        token
      });
    } catch (err) {
      logger.error({ error: err.message });
      res.status(500).json({ error: 'Login failed' });
    }
  };

  const verifyToken = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production');
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid token' });

      res.json({ user: result.rows[0] });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  return {
    healthCheck,
    register,
    login,
    verifyToken
  };
};

module.exports = { createIdentityController };

