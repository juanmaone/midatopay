const { EMVQRGenerator, EMVQRParser } = require('./emvQRGenerator');
const CavosService = require('./cavosService');
const prisma = require('../config/database');

class MidatoPayService {
  constructor() {
    this.qrGenerator = new EMVQRGenerator();
    this.qrParser = new EMVQRParser();
    this.cavosService = new CavosService();
  }

  // Generar QR de pago para comercio
  async generatePaymentQR(merchantId, amountARS, targetCrypto, concept = 'Pago QR') {
    try {
      // 1. Obtener datos del comercio
      const merchant = await this.getMerchant(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // 2. Generar session ID único
      const sessionId = this.qrGenerator.generateSessionId();
      
      // 3. Preparar datos para QR (SIN conversión - el Oracle lo hará)
      const paymentData = {
        amountARS,
        targetCrypto,
        cryptoAmount: null, // El Oracle calculará esto
        exchangeRate: null, // El Oracle calculará esto
        merchantWallet: merchant.walletAddress,
        concept,
        sessionId,
        timestamp: new Date()
      };

      // 4. Validar datos básicos
      const validation = this.qrGenerator.validatePaymentData(merchant, paymentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // 5. Generar TLV data
      const tlvData = this.qrGenerator.generateEMVQR(merchant, paymentData);
      
      // 6. Agregar QR data a paymentData
      paymentData.qrCode = tlvData;
      
      // 7. Generar QR visual
      const qrCodeImage = await this.qrGenerator.generateQRCodeImage(tlvData);
      
      // 8. Guardar sesión en base de datos
      console.log('💾 Guardando pago con sessionId:', sessionId);
      console.log('💾 MerchantId:', merchantId);
      console.log('💾 PaymentData:', paymentData);
      await this.savePaymentSession(sessionId, merchantId, paymentData);
      console.log('✅ Pago guardado exitosamente');
      
      return {
        success: true,
        qrCodeImage,
        tlvData,
        paymentData: {
          amountARS,
          targetCrypto,
          cryptoAmount: null, // El Oracle calculará esto
          exchangeRate: null, // El Oracle calculará esto
          sessionId,
          merchantName: merchant.name,
          merchantWallet: merchant.walletAddress
        }
      };
      
    } catch (error) {
      console.error('Error generating payment QR:', error);
      throw error;
    }
  }

  // Obtener comercio por ID
  async getMerchant(merchantId) {
    try {
      // Verificar que prisma esté disponible
      if (!prisma || !prisma.user) {
        throw new Error('Prisma client not initialized');
      }
      
      const merchant = await prisma.user.findUnique({
        where: { id: merchantId }
      });
      
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Por ahora usamos un wallet temporal (aquí entraría Cavos)
      if (!merchant.walletAddress) {
        merchant.walletAddress = `temp_wallet_${merchantId}`;
      }

      return merchant;
    } catch (error) {
      console.error('Error getting merchant:', error);
      throw error;
    }
  }

  // Generar wallet para comercio (placeholder para Cavos)
  async generateMerchantWallet(merchantId) {
    // TODO: Integrar con Cavos Aegis para generar wallet automático
    // Por ahora retornamos un placeholder
    const timestamp = Date.now();
    const randomHex = Math.random().toString(16).substring(2, 10);
    return `0x${merchantId}_${timestamp}_${randomHex}`;
  }

  // Guardar sesión de pago
  async savePaymentSession(sessionId, merchantId, paymentData) {
    try {
      // Calcular tiempo de expiración (30 minutos)
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 30);

      console.log('💾 Creando pago en BD con datos:', {
        sessionId,
        merchantId,
        amount: paymentData.amountARS,
        concept: paymentData.concept || 'Pago QR',
        orderId: sessionId,
        status: 'PENDING',
        qrCode: paymentData.qrCode || 'QR_PLACEHOLDER',
        expiresAt: expirationTime
      });

      const createdPayment = await prisma.payment.create({
        data: {
          amount: paymentData.amountARS, // Campo obligatorio del schema
          currency: 'ARS', // Campo obligatorio del schema
          concept: paymentData.concept || 'Pago QR', // Campo obligatorio del schema
          orderId: sessionId, // Usar sessionId como orderId
          status: 'PENDING', // Campo obligatorio del schema
          qrCode: paymentData.qrCode || 'QR_PLACEHOLDER', // Campo obligatorio del schema
          expiresAt: expirationTime, // Campo obligatorio del schema
          userId: merchantId // Campo obligatorio del schema para la relación
        }
      });
      
      console.log('✅ Payment session saved successfully:', createdPayment);
    } catch (error) {
      console.error('Error saving payment session:', error);
      throw error;
    }
  }

  // Obtener sesión de pago
  async getPaymentSession(sessionId) {
    try {
      return await prisma.payment.findUnique({
        where: { sessionId }
      });
    } catch (error) {
      console.error('Error getting payment session:', error);
      throw error;
    }
  }

  // Actualizar sesión de pago
  async updatePaymentSession(sessionId, updateData) {
    try {
      await prisma.payment.update({
        where: { sessionId },
        data: updateData
      });
    } catch (error) {
      console.error('Error updating payment session:', error);
      throw error;
    }
  }

  // Ejecutar conversión crypto (placeholder para Cavos)
  async executeCryptoConversion(paymentSession) {
    // TODO: Integrar con Cavos Aegis para ejecutar conversión automática
    // Por ahora simulamos la transacción
    const transactionHash = `0x${Date.now().toString(16)}_${Math.random().toString(16).substring(2)}`;
    
    return {
      success: true,
      transactionHash,
      gasUsed: '0x1234',
      blockNumber: '0x5678',
      timestamp: new Date()
    };
  }

  // Notificar comercio
  async notifyMerchant(merchantId, notificationData) {
    // TODO: Implementar notificaciones (WebSocket, email, SMS)
    console.log(`📬 Notifying merchant ${merchantId}:`, notificationData);
  }

  // Obtener historial de pagos del comercio
  async getMerchantPaymentHistory(merchantId, limit = 50) {
    try {
      const payments = await prisma.payment.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      return payments;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Obtener estadísticas del comercio
  async getMerchantStats(merchantId) {
    try {
      const stats = await prisma.payment.aggregate({
        where: { merchantId },
        _sum: {
          amountARS: true,
          cryptoAmount: true
        },
        _count: {
          sessionId: true
        }
      });

      const completedPayments = await prisma.payment.count({
        where: {
          merchantId,
          status: 'COMPLETED'
        }
      });

      return {
        totalPayments: stats._count.sessionId,
        completedPayments,
        totalARS: stats._sum.amountARS || 0,
        totalCrypto: stats._sum.cryptoAmount || 0,
        successRate: stats._count.sessionId > 0 ? (completedPayments / stats._count.sessionId) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting merchant stats:', error);
      throw error;
    }
  }

  // Escanear QR y obtener datos del pago
  async scanPaymentQR(qrData) {
    try {
      // Parsear el QR EMVCo TLV
      const paymentInfo = this.parseEMVQR(qrData);
      
      if (!paymentInfo.isValid) {
        throw new Error(`QR Code no válido: ${paymentInfo.error}`);
      }

      // Buscar el pago en la base de datos usando coincidencia parcial
      // El QR puede tener un sessionId más largo que el orderId en BD
      console.log('Buscando pago con sessionId:', paymentInfo.sessionId);
      console.log('QR Data completo:', qrData);
      
      // Primero intentar coincidencia exacta
      let payment = await prisma.payment.findFirst({
        where: { orderId: paymentInfo.sessionId },
        include: { user: true }
      });

      // Si no encuentra, intentar coincidencia parcial (el QR puede tener sufijos adicionales)
      if (!payment) {
        console.log('No se encontró con coincidencia exacta, intentando coincidencia parcial...');
        // Extraer la parte base del sessionId (sess_timestamp_hash)
        // El hash en el QR puede tener caracteres adicionales, así que buscamos por el patrón base
        const baseSessionId = paymentInfo.sessionId.substring(0, paymentInfo.sessionId.lastIndexOf('_') + 9);
        console.log('Buscando con baseSessionId:', baseSessionId);
        
        payment = await prisma.payment.findFirst({
          where: { 
            orderId: { 
              startsWith: baseSessionId
            }
          },
          include: { user: true }
        });
      }

      console.log('Pago encontrado:', payment);

      if (!payment) {
        // Buscar todos los pagos para debug
        const allPayments = await prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' }
        });
        console.log('Últimos 5 pagos:', allPayments);
        console.log('Buscando por orderId:', paymentInfo.sessionId);
        throw new Error('Pago no encontrado');
      }

      // Verificar si el pago ha expirado
      if (new Date() > payment.expiresAt) {
        throw new Error('El QR ha expirado');
      }

      // Verificar si el pago ya fue procesado
      if (payment.status !== 'PENDING') {
        throw new Error('El pago ya fue procesado');
      }

      // Extraer datos reales del QR parseado
      const parsedQRData = this.parseEMVQR(qrData);
      
      return {
        success: true,
        paymentData: {
          sessionId: payment.orderId,
          merchantName: payment.user.name,
          amountARS: parseFloat(payment.amount),
          targetCrypto: parsedQRData.targetCrypto || 'USDT', // Usar datos del QR o USDT por defecto
          cryptoAmount: null, // El Oracle calculará esto
          exchangeRate: null, // El Oracle calculará esto
          concept: payment.concept,
          expiresAt: payment.expiresAt.toISOString(),
          status: payment.status
        }
      };
    } catch (error) {
      console.error('Error scanning payment QR:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Procesar pago ARS
  async processARSPayment(sessionId, arsPaymentData) {
    try {
      console.log('🔄 Procesando pago ARS:', { sessionId, arsPaymentData });
      
      // Buscar el pago
      const payment = await prisma.payment.findFirst({
        where: { orderId: sessionId },
        include: { user: true }
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      // Verificar estado
      if (payment.status !== 'PENDING') {
        throw new Error('El pago ya fue procesado');
      }

      // Verificar expiración
      if (new Date() > payment.expiresAt) {
        throw new Error('El pago ha expirado');
      }

      // Validar monto
      if (Math.abs(payment.amount - arsPaymentData.amount) > 0.01) {
        throw new Error('El monto no coincide');
      }

      // Simular procesamiento de pago ARS
      // En producción, aquí se integraría con el sistema bancario argentino
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🚀 EJECUTAR SWAP REAL CON ORACLE DE BLOCKCHAIN
      console.log('🚀 Ejecutando swap ARS → Crypto con Oracle de blockchain...');
      
      const swapResult = await this.cavosService.executeARSToCryptoSwap({
        merchantWalletAddress: payment.user.walletAddress || `temp_wallet_${payment.user.id}`,
        amountARS: arsPaymentData.amount,
        targetCrypto: arsPaymentData.targetCrypto,
        cryptoAmount: null, // El Oracle calculará esto
        exchangeRate: null, // El Oracle calculará esto
        sessionId: sessionId
      });

      if (!swapResult.success) {
        throw new Error(`Swap falló: ${swapResult.error}`);
      }

      console.log('✅ Swap ejecutado exitosamente:', swapResult);

      // Actualizar estado del pago
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'PAID',
          updatedAt: new Date()
        }
      });

      // Crear transacción de crypto con datos del Oracle
      const transaction = await prisma.transaction.create({
        data: {
          paymentId: payment.id,
          amount: swapResult.cryptoAmount, // Del Oracle
          currency: arsPaymentData.targetCrypto,
          exchangeRate: swapResult.exchangeRate, // Del Oracle
          finalAmount: parseFloat(payment.amount),
          finalCurrency: 'ARS',
          status: 'CONFIRMED',
          blockchainTxHash: swapResult.transactionHash, // Hash real de Starknet
          walletAddress: payment.user.walletAddress || `temp_wallet_${payment.user.id}`,
          userId: payment.userId,
          confirmationCount: 1,
          requiredConfirmations: 1
        }
      });

      console.log('✅ Pago procesado exitosamente:', {
        paymentId: payment.id,
        transactionId: transaction.id,
        cryptoAmount: swapResult.cryptoAmount, // Del Oracle
        targetCrypto: arsPaymentData.targetCrypto,
        blockchainTxHash: swapResult.transactionHash,
        explorerUrl: swapResult.explorerUrl,
        mode: swapResult.mode || 'REAL'
      });

      return {
        success: true,
        transactionId: transaction.id,
        message: swapResult.mode === 'SIMULATION' 
          ? 'Pago procesado exitosamente (Modo Simulación)' 
          : 'Pago procesado exitosamente',
        cryptoAmount: swapResult.cryptoAmount, // Del Oracle
        targetCrypto: arsPaymentData.targetCrypto,
        exchangeRate: swapResult.exchangeRate, // Del Oracle
        blockchainTxHash: swapResult.transactionHash,
        explorerUrl: swapResult.explorerUrl,
        gasUsed: swapResult.gasUsed,
        gasPrice: swapResult.gasPrice,
        mode: swapResult.mode || 'REAL'
      };
    } catch (error) {
      console.error('Error processing ARS payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parsear QR EMVCo TLV
  parseEMVQR(qrData) {
    try {
      // Buscar el patrón sess_ seguido de timestamp y exactamente 8 caracteres hex
      // El sessionId real es: sess_1759532707710_cf360816 (8 caracteres hex)
      // CORREGIDO: Capturar exactamente 8 caracteres hex después del timestamp
      const sessionMatch = qrData.match(/sess_(\d+)_([a-f0-9]{8})/i);
      
      if (sessionMatch) {
        const fullMatch = sessionMatch[0];
        const timestamp = sessionMatch[1];
        const hash = sessionMatch[2];
        
        // Validar longitud del timestamp (debe tener al menos 10 dígitos)
        if (timestamp.length < 10) {
          console.warn('⚠️ Timestamp inválido en QR:', timestamp);
          return { 
            isValid: false, 
            error: 'Timestamp inválido',
            qrData: qrData 
          };
        }
        
        console.log('🔍 REGEX DEBUG - Full Match:', fullMatch);
        console.log('🔍 REGEX DEBUG - Timestamp:', timestamp);
        console.log('🔍 REGEX DEBUG - Hash:', hash);
        console.log('🔍 REGEX DEBUG - Full QR:', qrData);
        
        // Extraer datos adicionales del QR
        // CORREGIDO: Capturar solo el token (STRK, USDT, etc.) sin números adicionales
        const targetCryptoMatch = qrData.match(/6504([A-Z]+)/);
        const cryptoAmountMatch = qrData.match(/6609([0-9.]+)/);
        const exchangeRateMatch = qrData.match(/6707([0-9.]+)/);
        
        return {
          isValid: true,
          sessionId: fullMatch,
          timestamp: timestamp,
          hash: hash,
          targetCrypto: targetCryptoMatch ? targetCryptoMatch[1] : 'USDT',
          cryptoAmount: null, // El Oracle calculará esto
          exchangeRate: null, // El Oracle calculará esto
          qrData: qrData
        };
      }
      
      console.warn('⚠️ QR inválido o sessionId no encontrado');
      console.log('🔍 REGEX DEBUG - No match found in:', qrData);
      return { 
        isValid: false, 
        error: 'SessionId no encontrado',
        qrData: qrData 
      };
    } catch (error) {
      console.error('Error parsing EMV QR:', error);
      return { 
        isValid: false, 
        error: error.message,
        qrData: qrData 
      };
    }
  }
}

module.exports = MidatoPayService;
