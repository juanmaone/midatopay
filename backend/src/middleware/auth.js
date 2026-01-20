const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token requerido',
      message: 'Debes proporcionar un token de autenticación',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuario no válido',
        message: 'El usuario no existe o está inactivo',
        code: 'INVALID_USER'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(403).json({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware para verificar un token JWT para las rutas de la API del SDK.
 * Extrae el token, lo verifica y se asegura de que tenga el 'scope' de 'api'.
 */
const authenticateApi = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de API requerido',
      message: 'Debes proporcionar un token de autenticación para usar la API.',
      code: 'MISSING_API_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificación clave: el token debe ser para la API.
    if (decoded.scope !== 'api') {
      return res.status(403).json({
        error: 'Permiso denegado',
        message: 'El token proporcionado no es válido para el acceso a la API.',
        code: 'INVALID_TOKEN_SCOPE'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuario no válido',
        message: 'El usuario asociado a la API key no existe o está inactivo',
        code: 'INVALID_API_USER'
      });
    }

    req.user = user; // Adjuntamos el usuario completo para usarlo en el controlador
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token de API expirado',
        message: 'Tu token de API ha expirado. Por favor, genera uno nuevo.',
        code: 'API_TOKEN_EXPIRED'
      });
    }

    return res.status(403).json({ error: 'Token de API inválido', code: 'INVALID_API_TOKEN' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para acceder a este recurso',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  authenticateApi // Añadimos la nueva función a las exportaciones
};
