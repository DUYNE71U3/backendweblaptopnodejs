const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpayController');
const { authenticate } = require('../middlewares/authMiddleware'); // Import auth middleware

router.post('/create_payment_url', vnpayController.createPaymentURL);
router.get('/vnpay_return', authenticate, vnpayController.vnpayReturn); // Add authentication

module.exports = router;