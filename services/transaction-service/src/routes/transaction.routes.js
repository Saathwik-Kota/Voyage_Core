const express = require('express');

const createTransactionRouter = (controller) => {
  const router = express.Router();

  // Payment methods routes
  router.get('/payment-methods', controller.getPaymentMethods);
  router.get('/payment-methods/:id', controller.getPaymentMethodById);
  router.post('/payment-methods', controller.createPaymentMethod);
  router.put('/payment-methods/:id', controller.updatePaymentMethod);
  router.delete('/payment-methods/:id', controller.deletePaymentMethod);

  // Payments / Transaction routes
  router.post('/payments/stripe', controller.processStripePayment);
  router.post('/payments/paypal', controller.processPaypalPayment);
  router.get('/payments', controller.getPayments);

  return router;
};

module.exports = { createTransactionRouter };

