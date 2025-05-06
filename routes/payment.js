const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, getLastPaymentDetails } = require('../controllers/paymentController');
// Create payment order
router.post('/create-order/:eventId', auth, createOrder);
// Verify payment
router.post('/verify', auth, verifyPayment);
// Get last payment details (for testing/debugging)
router.get('/last-payment', getLastPaymentDetails);
module.exports = router;