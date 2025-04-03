const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middlewares/authMiddleware'); // Assuming you have authentication middleware

router.get('/balance', authenticate, walletController.getWalletBalance);
router.post('/create_payment_url', authenticate, walletController.createPaymentRequest);
router.get('/vnpay_ipn', walletController.vnpayIpn);

module.exports = router;