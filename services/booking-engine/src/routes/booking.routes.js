const express = require('express');

const createBookingRouter = (controller) => {
  const router = express.Router();

  // Travels routes
  router.get('/travels', controller.getAllTravels);
  router.get('/travels/:id', controller.getTravelById);
  router.post('/travels', controller.createTravel);
  router.put('/travels/:id', controller.updateTravel);
  router.delete('/travels/:id', controller.deleteTravel);

  // Destinations routes
  router.get('/destinations', controller.getAllDestinations);
  router.post('/destinations', controller.createDestination);
  router.put('/destinations/:id', controller.updateDestination);
  router.delete('/destinations/:id', controller.deleteDestination);

  return router;
};

module.exports = { createBookingRouter };

