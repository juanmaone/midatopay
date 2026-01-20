// backend/src/services/paymentService.js
const prisma = require('../config/database');

/**
 * Genera una cadena de datos para el código QR.
 * @param {string} paymentId - El ID único del pago.
 * @param {string} walletAddress - La dirección de la wallet de destino.
 * @param {number} amount - El monto del pago en la criptomoneda (ej. USDT).
 * @returns {string} La cadena de datos para generar el QR.
 */
function generateQrData(paymentId, walletAddress, amount) {
  // Formato: "starknet:direccion?amount=monto&payment_id=id"
  // Usar un prefijo como 'starknet:' es una buena práctica (similar a 'bitcoin:' o 'ethereum:').
  // Incluir el paymentId hace que la data del QR sea única y trazable.
  return `starknet:${walletAddress}?amount=${amount.toFixed(6)}&payment_id=${paymentId}`;
}

/**
 * Crea un nuevo registro de pago en la base de datos.
 * @param {object} paymentData - Los datos para crear el pago.
 * @param {number} paymentData.amount - Monto en la moneda original (ej. ARS).
 * @param {string} paymentData.currency - Moneda original (ej. 'ARS').
 * @param {string} paymentData.concept - Concepto del pago.
 * @param {string} paymentData.qrData - La cadena de datos generada para el QR.
 * @param {string} paymentData.userId - El ID del comerciante.
 * @returns {Promise<object>} El objeto de pago creado.
 */
async function createPayment(paymentData) {
  const { amount, currency, concept, qrData, userId } = paymentData;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // El pago expira en 15 minutos

  const payment = await prisma.payment.create({
    data: {
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      concept,
      status: 'PENDING',
      qrCode: qrData, // Guardamos la cadena de datos completa y única del QR
      expiresAt,
      userId,
    },
  });

  return payment;
}

module.exports = {
  generateQrData,
  createPayment,
};