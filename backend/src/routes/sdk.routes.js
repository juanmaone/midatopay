// backend/src/routes/sdk.routes.js
const { Router } = require('express');
const { authenticateApi } = require('../middleware/auth');
const { createPaymentFromSdk } = require('../controllers/sdk.controller.js');

const router = Router();

/**
 * @route   POST /api/sdk/payments
 * @desc    Crea una nueva solicitud de pago desde el SDK.
 * @access  Private (requiere token de API)
 */
router.post('/payments', authenticateApi, createPaymentFromSdk);

module.exports = router;
