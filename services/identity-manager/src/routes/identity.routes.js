const express = require('express');

const createIdentityRouter = (controller) => {
  const router = express.Router();

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/verify', controller.verifyToken);

  return router;
};

module.exports = { createIdentityRouter };

