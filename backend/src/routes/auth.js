const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Registro de usuario
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor, verifica los datos ingresados',
        details: errors.array()
      });
    }

    const { email, password, name, phone } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'Ya existe una cuenta con este email',
        code: 'USER_EXISTS'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Generar token JWT
   // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        app: 3525552664,
        autor: 'jmf',
        issuer: 'midatopay-auth',
        audience: 'chipipay'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'midatopay-auth',
        audience: 'chipipay',
        iss: 'midatopay-auth',
        aud: 'chipipay'

      }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login de usuario
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor, verifica los datos ingresados',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Actualizar perfil
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor, verifica los datos ingresados',
        details: errors.array()
      });
    }

    const { name, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Perfil actualizado exitosamente',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar wallet del usuario
router.post('/update-wallet', authenticateToken, [
  body('walletAddress').notEmpty().isLength({ min: 20 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor, verifica los datos ingresados',
        details: errors.array()
      });
    }

    const { walletAddress } = req.body;

    // Actualizar wallet del usuario
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { walletAddress },
      select: {
        id: true,
        email: true,
        name: true,
        walletAddress: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Wallet actualizada exitosamente',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Cambiar contraseña
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor, verifica los datos ingresados',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Encriptar nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// Generar/Regenerar API Keys para el usuario autenticado
router.post('/generate-api-keys', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Generar credenciales seguras y aleatorias
    const crypto = require('crypto');
    const apiKey = `mp_pk_${crypto.randomBytes(16).toString('hex')}`; // pk = public key
    const apiSecret = `mp_sk_${crypto.randomBytes(24).toString('hex')}`; // sk = secret key

    // 2. Hashear el apiSecret antes de guardarlo (¡MUY IMPORTANTE!)
    const hashedApiSecret = await bcrypt.hash(apiSecret, 12);

    // 3. Actualizar el usuario en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: {
        apiKey: apiKey,
        apiSecret: hashedApiSecret,
      },
    });

    // 4. Devolver las credenciales al usuario (SOLO esta vez se muestra el secreto)
    res.status(200).json({
      message: 'API Keys generadas exitosamente. Guarda tu apiSecret en un lugar seguro, no se mostrará de nuevo.',
      apiKey: apiKey,
      apiSecret: apiSecret, // Devolvemos el secreto en texto plano solo en esta respuesta
    });

  } catch (error) {
    next(error);
  }
});

// Endpoint para obtener token con API Keys (ya lo tenías, lo muevo aquí para cohesión)
router.post('/token', [
  body('apiKey').notEmpty().withMessage('apiKey es requerido.'),
  body('apiSecret').notEmpty().withMessage('apiSecret es requerido.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor, verifica los datos ingresados',
        details: errors.array()
      });
    }

    const { apiKey, apiSecret } = req.body;

    // 1. Buscar al usuario por su apiKey
    const user = await prisma.user.findUnique({
      where: { apiKey },
    });

    if (!user || !user.apiSecret) {
      return res.status(401).json({ message: 'Credenciales de API inválidas.' });
    }

    // 2. Comparar el apiSecret proporcionado con el hash almacenado
    const isSecretValid = await bcrypt.compare(apiSecret, user.apiSecret);

    if (!isSecretValid) {
      return res.status(401).json({ message: 'Credenciales de API inválidas.' });
    }

    // 3. Generar el token JWT con un scope específico para la API
    const payload = {
      userId: user.id,
      scope: 'api', // Diferencia este token de los de sesión de usuario
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, expiresIn: 3600 });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
