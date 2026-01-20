// backend/src/controllers/sdk.controller.js
const prisma = require('../config/database');
const priceOracle = require('../services/priceOracle.js');
const paymentService = require('../services/paymentService.js');

/**
 * Controlador para POST /api/sdk/payments
 * Inicia un cobro a petición del SDK.
 */
const createPaymentFromSdk = async (req, res, next) => {
  // Gracias al middleware `authenticateApi`, ya tenemos al comerciante en `req.user`.
  // Este objeto 'user' representa al comerciante autenticado mediante API Key.
  const merchant = req.user;
  const { amount, currency = 'ARS', concept = 'Pago recibido' } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'El monto debe ser un número positivo.' });
  }

  if (!merchant.walletAddress) {
    return res.status(400).json({ message: 'El comerciante no tiene una wallet configurada para recibir pagos.' });
  }

  try {
    let amountInUsdt;

    // 1. Convertir a USDT si es necesario usando el oráculo
    // El oráculo ya maneja la lógica de conversión y devuelve el monto en la unidad correcta.
    if (currency.toUpperCase() === 'ARS') {
      const quote = await priceOracle.convertARSToCrypto(amount, 'USDT'); // 'USDT' es el targetCrypto
      amountInUsdt = quote.cryptoAmount;
    } else if (currency.toUpperCase() === 'USDT') {
      amountInUsdt = amount;
    } else {
      return res.status(400).json({ message: 'Moneda no soportada. Use ARS o USDT.' });
    }

    // 2. Crear el pago usando el servicio de pagos.
    // Esto crea primero el registro en la BD para obtener un ID único.
    const payment = await paymentService.createPayment({
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      concept,
      qrData: 'temp', // Usamos un valor temporal porque necesitamos el ID para el QR final.
      userId: merchant.id,
    });

    // 3. Generar la cadena de datos del QR con el ID del pago para asegurar unicidad.
    const qrDataString = paymentService.generateQrData(payment.id, merchant.walletAddress, amountInUsdt);

    // 4. Actualizar el pago con la cadena de QR final.
    const finalPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { qrCode: qrDataString },
    });

    // 5. Devolver la respuesta al SDK.
    res.status(201).json({
      paymentId: payment.id,
      qrData: qrDataString,
      amountARS: currency.toUpperCase() === 'ARS' ? amount : null, // Opcional: devolver el monto original
      amountUSDT: amountInUsdt,
      walletDestino: merchant.walletAddress,
      expiresAt: finalPayment.expiresAt.toISOString(),
    });

  } catch (error) {
    next(error); // Pasamos el error al manejador centralizado (errorHandler)
  }
};

module.exports = {
  createPaymentFromSdk,
};
