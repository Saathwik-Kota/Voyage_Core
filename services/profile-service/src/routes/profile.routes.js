const express = require('express');

const createProfileRouter = (controller) => {
  const router = express.Router();

  router.get('/', controller.getProfiles);
  router.get('/:id', controller.getProfileById);
  router.post('/', controller.createProfile);
  router.put('/:id', controller.updateProfile);
  router.delete('/:id', controller.deleteProfile);

  return router;
};

module.exports = { createProfileRouter };

