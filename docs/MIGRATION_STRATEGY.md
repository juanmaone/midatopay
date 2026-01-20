# Estrategia de Migración: Monolito Modular → Microservicios

## Índice

1. [Visión General](#visión-general)
2. [Patrón Strangler Fig](#patrón-strangler-fig)
3. [Fase 0: Preparación](#fase-0-preparación)
4. [Fase 1: Auth Service](#fase-1-auth-service)
5. [Fase 2: Payment Service](#fase-2-payment-service)
6. [Fase 3: Blockchain Service](#fase-3-blockchain-service)
7. [Fase 4: Servicios de Soporte](#fase-4-servicios-de-soporte)
8. [Testing en Producción](#testing-en-producción)
9. [Rollback y Contingencias](#rollback-y-contingencias)
10. [Métricas de Éxito](#métricas-de-éxito)

---

## Visión General

### Estrategia: Strangler Fig Pattern

El **Strangler Fig Pattern** (patrón de la higuera estranguladora) es la estrategia recomendada para migrar un monolito a microservicios sin interrumpir el servicio.

```
┌─────────────────────────────────────────────────────────────┐
│                        Timeline                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Semana 0-4:   [████████] Preparación                       │
│  Semana 5-8:   [████████] Auth Service                      │
│  Semana 9-12:  [████████] Payment Service                   │
│  Semana 13-16: [████████] Blockchain Service                │
│  Semana 17-20: [████████] Servicios de Soporte              │
│  Semana 21-24: [████████] Deprecar Monolito                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Estado Inicial (100% Monolito):
┌────────────────────────────┐
│      Monolito Backend      │
│  ┌──────────────────────┐  │
│  │ Auth + Payment +     │  │
│  │ Blockchain + ...     │  │
│  └──────────────────────┘  │
└────────────────────────────┘

Estado Intermedio (50% Monolito, 50% Microservicios):
┌──────────────┐  ┌──────────────┐
│ Auth Service │  │   Monolito   │
├──────────────┤  │ ┌──────────┐ │
│ Payment Svc  │  │ │Blockchain│ │
└──────────────┘  │ │Oracle    │ │
                  │ │WebSocket │ │
                  └─┴──────────┴─┘

Estado Final (100% Microservicios):
┌──────────┐ ┌──────────┐ ┌──────────┐
│   Auth   │ │ Payment  │ │Blockchain│
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Oracle  │ │WebSocket │ │  Notif   │
└──────────┘ └──────────┘ └──────────┘
```

### Principios Clave

1. **Incremental**: Migrar un módulo a la vez
2. **Reversible**: Poder hacer rollback en cualquier momento
3. **Sin Downtime**: Cero interrupción del servicio
4. **Dual Running**: Monolito y microservicio corren en paralelo
5. **Dark Launching**: Probar en producción sin afectar usuarios
6. **Feature Flags**: Controlar migración por porcentaje de tráfico

---

## Fase 0: Preparación

### Duración: 4 semanas
### Objetivo: Preparar el monolito para la migración

### Checklist

```
✅ Implementar Event Bus interno
✅ Refactorizar código en módulos desacoplados
✅ Instalar infraestructura (RabbitMQ, Redis, Kong)
✅ Crear métricas y observabilidad
✅ Configurar CI/CD para múltiples servicios
✅ Establecer contratos de API (OpenAPI)
✅ Crear feature flags system
```

### 1. Implementar Event Bus Interno

Actualmente el monolito tiene llamadas directas entre módulos. Necesitamos desacoplar.

**Antes (Acoplado):**

```javascript
// modules/payments/payment.service.js

const NotificationService = require('../notifications/notification.service');
const BlockchainService = require('../blockchain/blockchain.service');

class PaymentService {
  async createPayment(data) {
    const payment = await prisma.payment.create({ data });
    
    // ❌ Acoplamiento directo
    await NotificationService.sendEmail(payment.userId, 'Payment created');
    await BlockchainService.executeTransaction(payment);
    
    return payment;
  }
}
```

**Después (Desacoplado):**

```javascript
// modules/payments/payment.service.js

const eventBus = require('../../shared/events/eventBus');
const { PAYMENT_CREATED } = require('../../shared/events/eventTypes');

class PaymentService {
  async createPayment(data) {
    const payment = await prisma.payment.create({ data });
    
    // ✅ Publicar evento (desacoplado)
    eventBus.publish(PAYMENT_CREATED, {
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      timestamp: new Date(),
    });
    
    return payment;
  }
}
```

**Event Bus con soporte para RabbitMQ:**

```javascript
// shared/events/eventBus.js

const EventEmitter = require('events');
const amqp = require('amqplib');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.rabbitChannel = null;
    this.useRabbitMQ = process.env.USE_RABBITMQ === 'true';
    
    if (this.useRabbitMQ) {
      this.connectRabbitMQ();
    }
  }

  async connectRabbitMQ() {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.rabbitChannel = await connection.createChannel();
      
      // Declarar exchange
      await this.rabbitChannel.assertExchange('midatopay.events', 'topic', {
        durable: true,
      });
      
      console.log('✅ RabbitMQ connected');
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
      this.useRabbitMQ = false;
    }
  }

  async publish(eventType, data) {
    console.log(`📤 Publishing: ${eventType}`, data);
    
    // Emitir localmente (para módulos en el monolito)
    this.emit(eventType, data);
    
    // También publicar a RabbitMQ (para microservicios externos)
    if (this.useRabbitMQ && this.rabbitChannel) {
      try {
        await this.rabbitChannel.publish(
          'midatopay.events',
          eventType,
          Buffer.from(JSON.stringify(data)),
          { persistent: true }
        );
      } catch (error) {
        console.error('Error publishing to RabbitMQ:', error);
      }
    }
  }

  subscribe(eventType, handler) {
    console.log(`📥 Subscribing to: ${eventType}`);
    this.on(eventType, handler);
  }
}

module.exports = new EventBus();
```

### 2. Feature Flags System

```javascript
// shared/featureFlags/featureFlags.js

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class FeatureFlags {
  /**
   * Verificar si un feature está habilitado para un usuario
   */
  async isEnabled(flagName, userId) {
    // Obtener configuración del flag
    const config = await this.getConfig(flagName);
    
    if (!config) {
      return false; // Flag no existe o está deshabilitado
    }
    
    // Verificar si el usuario está en la whitelist
    if (config.whitelist?.includes(userId)) {
      return true;
    }
    
    // Verificar rollout percentage
    if (config.percentage > 0) {
      const hash = this.hashUserId(userId);
      return hash % 100 < config.percentage;
    }
    
    return false;
  }

  async getConfig(flagName) {
    const data = await redis.get(`feature:${flagName}`);
    return data ? JSON.parse(data) : null;
  }

  async setConfig(flagName, config) {
    await redis.set(`feature:${flagName}`, JSON.stringify(config));
  }

  hashUserId(userId) {
    // Simple hash para distribución consistente
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

module.exports = new FeatureFlags();
```

**Uso en código:**

```javascript
// modules/auth/auth.controller.js

const featureFlags = require('../../shared/featureFlags/featureFlags');

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;
    
    // Verificar si usar nuevo Auth Service
    const useAuthService = await featureFlags.isEnabled(
      'use-auth-microservice',
      email
    );
    
    if (useAuthService) {
      // ✅ Llamar a Auth Microservice
      const response = await fetch('http://auth-service:3001/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return res.json(await response.json());
    } else {
      // ⚠️ Usar código del monolito (legacy)
      const result = await AuthService.login(email, password);
      return res.json(result);
    }
  }
}
```

**Configurar flags desde CLI:**

```bash
# Habilitar para 0% (solo testing interno)
redis-cli SET feature:use-auth-microservice '{"percentage": 0, "whitelist": ["admin@midatopay.com"]}'

# Habilitar para 5% de usuarios (canary)
redis-cli SET feature:use-auth-microservice '{"percentage": 5, "whitelist": []}'

# Habilitar para 50% de usuarios
redis-cli SET feature:use-auth-microservice '{"percentage": 50, "whitelist": []}'

# Habilitar para 100% (migración completa)
redis-cli SET feature:use-auth-microservice '{"percentage": 100, "whitelist": []}'
```

### 3. Instalar Infraestructura

```yaml
# docker-compose.infrastructure.yml

version: '3.8'

services:
  # RabbitMQ para mensajería entre servicios
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: midatopay-rabbitmq
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: midatopay
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - midatopay-network
    restart: unless-stopped

  # Redis para cache y feature flags
  redis:
    image: redis:7-alpine
    container_name: midatopay-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - midatopay-network
    restart: unless-stopped

  # Kong API Gateway
  kong-database:
    image: postgres:15-alpine
    container_name: midatopay-kong-db
    environment:
      POSTGRES_DB: kong
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: ${KONG_PASSWORD}
    volumes:
      - kong_db_data:/var/lib/postgresql/data
    networks:
      - midatopay-network

  kong-migration:
    image: kong:3.5-alpine
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: ${KONG_PASSWORD}
    depends_on:
      - kong-database
    networks:
      - midatopay-network

  kong:
    image: kong:3.5-alpine
    container_name: midatopay-kong
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: ${KONG_PASSWORD}
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"   # Proxy
      - "8443:8443"   # Proxy SSL
      - "8001:8001"   # Admin API
    depends_on:
      - kong-migration
    networks:
      - midatopay-network
    restart: unless-stopped

  # Prometheus para métricas
  prometheus:
    image: prom/prometheus:latest
    container_name: midatopay-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./infrastructure/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - midatopay-network

  # Grafana para visualización
  grafana:
    image: grafana/grafana:latest
    container_name: midatopay-grafana
    ports:
      - "3100:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - midatopay-network

volumes:
  rabbitmq_data:
  redis_data:
  kong_db_data:
  prometheus_data:
  grafana_data:

networks:
  midatopay-network:
    driver: bridge
```

**Iniciar infraestructura:**

```bash
# Crear archivo .env con passwords
cat > .env << 'EOF'
RABBITMQ_PASSWORD=rabbitmq_secure_password
REDIS_PASSWORD=redis_secure_password
KONG_PASSWORD=kong_secure_password
GRAFANA_PASSWORD=admin
EOF

# Iniciar servicios
docker-compose -f docker-compose.infrastructure.yml up -d

# Verificar estado
docker-compose -f docker-compose.infrastructure.yml ps
```

### 4. Configurar Observabilidad

```javascript
// shared/monitoring/metrics.js

const prometheus = require('prom-client');

// Crear registry
const register = new prometheus.Registry();

// Métricas por defecto (CPU, memoria, etc)
prometheus.collectDefaultMetrics({ register });

// Métricas custom
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_request_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

const eventPublished = new prometheus.Counter({
  name: 'event_published_total',
  help: 'Total number of events published',
  labelNames: ['event_type', 'service'],
  registers: [register],
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['operation', 'table'],
  registers: [register],
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  eventPublished,
  dbQueryDuration,
};
```

**Middleware para capturar métricas:**

```javascript
// shared/middleware/metricsMiddleware.js

const { httpRequestDuration, httpRequestTotal } = require('../monitoring/metrics');

function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
        service: serviceName,
      };
      
      httpRequestDuration.observe(labels, duration);
      httpRequestTotal.inc(labels);
    });
    
    next();
  };
}

module.exports = metricsMiddleware;
```

**Endpoint de métricas:**

```javascript
// server.js

const { register } = require('./shared/monitoring/metrics');
const metricsMiddleware = require('./shared/middleware/metricsMiddleware');

app.use(metricsMiddleware('monolith'));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## Fase 1: Auth Service

### Duración: 4 semanas
### Objetivo: Extraer módulo de autenticación como primer microservicio

### ¿Por qué Auth Service primero?

1. ✅ **Menos acoplado**: No depende de otros módulos
2. ✅ **Stateless**: Solo maneja JWT y sesiones
3. ✅ **Alta criticidad**: Si falla, podemos revertir fácilmente
4. ✅ **Bien definido**: APIs claras (login, register, verify)

### Paso 1.1: Crear Estructura del Servicio

```bash
# Crear directorio del microservicio
mkdir -p microservices/auth-service
cd microservices/auth-service

# Inicializar proyecto
npm init -y

# Instalar dependencias
npm install express prisma @prisma/client bcryptjs jsonwebtoken ioredis cors dotenv
npm install -D typescript @types/node @types/express ts-node tsx nodemon

# Crear estructura
mkdir -p src/{controllers,services,repositories,middleware,types,config}
mkdir -p prisma tests
```

**Estructura de archivos:**

```
auth-service/
├── src/
│   ├── server.ts
│   ├── config/
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── jwt.service.ts
│   │   └── session.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   └── session.repository.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Paso 1.2: Copiar Código del Monolito

```typescript
// microservices/auth-service/src/services/auth.service.ts

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { JWTService } from './jwt.service';

export class AuthService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;
  private jwtService: JWTService;

  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
    this.jwtService = new JWTService();
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    // Verificar si usuario existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    // Generar token
    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Crear sesión
    await this.sessionRepository.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Buscar usuario
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verificar password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generar token
    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Crear sesión
    await this.sessionRepository.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  }

  async verifyToken(token: string) {
    const payload = this.jwtService.verifyToken(token);
    
    // Verificar que la sesión exista
    const session = await this.sessionRepository.findByToken(token);
    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired token');
    }

    return payload;
  }

  async logout(token: string) {
    await this.sessionRepository.deleteByToken(token);
  }
}
```

### Paso 1.3: Migrar Base de Datos

```prisma
// microservices/auth-service/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String?
  firstName     String?
  lastName      String?
  role          UserRole @default(USER)
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  sessions      Session[]
  
  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}

enum UserRole {
  USER
  MERCHANT
  ADMIN
}
```

**Script de migración de datos:**

```sql
-- migrate-auth-data.sql

-- Crear nueva base de datos
CREATE DATABASE auth_db;

-- Conectar a auth_db
\c auth_db;

-- Copiar datos de users
INSERT INTO auth_db.users 
SELECT * FROM midatopay_db.users;

-- Copiar datos de sessions
INSERT INTO auth_db.sessions 
SELECT * FROM midatopay_db.sessions;

-- Verificar counts
SELECT 'users' as table_name, COUNT(*) FROM auth_db.users
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) FROM auth_db.sessions;
```

```bash
# Ejecutar migración
psql -U postgres -f migrate-auth-data.sql

# Crear usuario y permisos
psql -U postgres -d auth_db -c "
  CREATE USER auth_service WITH PASSWORD 'auth_password';
  GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_service;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO auth_service;
"
```

### Paso 1.4: Dual Routing con Kong

```bash
# Configurar servicio en Kong

# 1. Crear upstream para auth
curl -X POST http://localhost:8001/upstreams \
  --data name=auth-upstream

# 2. Agregar targets (monolito como primary, microservicio como secondary)
curl -X POST http://localhost:8001/upstreams/auth-upstream/targets \
  --data target=monolith:3001 \
  --data weight=100

curl -X POST http://localhost:8001/upstreams/auth-upstream/targets \
  --data target=auth-service:3001 \
  --data weight=0

# 3. Crear servicio
curl -X POST http://localhost:8001/services \
  --data name=auth-service \
  --data host=auth-upstream \
  --data port=3001

# 4. Crear ruta
curl -X POST http://localhost:8001/services/auth-service/routes \
  --data paths[]=/api/auth \
  --data strip_path=false
```

### Paso 1.5: Canary Deployment (Rollout Gradual)

**Semana 1: Testing Interno (0%)**

```bash
# Solo admin puede usar el nuevo servicio
redis-cli SET feature:use-auth-microservice '{
  "percentage": 0,
  "whitelist": ["admin@midatopay.com", "dev@midatopay.com"]
}'
```

**Semana 2: Canary (5%)**

```bash
# 5% de usuarios reales
redis-cli SET feature:use-auth-microservice '{
  "percentage": 5,
  "whitelist": []
}'

# Monitorear errores
# Si error rate > 1%, hacer rollback
```

**Semana 3: Expansión (25%)**

```bash
# 25% de usuarios
redis-cli SET feature:use-auth-microservice '{
  "percentage": 25,
  "whitelist": []
}'
```

**Semana 4: Migración Completa (100%)**

```bash
# 100% de usuarios
redis-cli SET feature:use-auth-microservice '{
  "percentage": 100,
  "whitelist": []
}'

# Después de 1 semana sin problemas:
# - Actualizar weight en Kong
curl -X PATCH http://localhost:8001/upstreams/auth-upstream/targets/{monolith-target-id} \
  --data weight=0

curl -X PATCH http://localhost:8001/upstreams/auth-upstream/targets/{auth-service-target-id} \
  --data weight=100

# - Remover código auth del monolito
```

### Paso 1.6: Métricas de Validación

```bash
# Consultas Prometheus

# Comparar latencia
rate(http_request_duration_ms{service="monolith", route="/api/auth/login"}[5m])
vs
rate(http_request_duration_ms{service="auth-service", route="/api/auth/login"}[5m])

# Comparar error rate
rate(http_request_total{service="monolith", route="/api/auth/login", status_code=~"5.."}[5m])
vs
rate(http_request_total{service="auth-service", route="/api/auth/login", status_code=~"5.."}[5m])

# Success rate
sum(rate(http_request_total{service="auth-service", status_code=~"2.."}[5m]))
/
sum(rate(http_request_total{service="auth-service"}[5m]))
```

**Criterios de Éxito:**

```
✅ Latencia P95 < 200ms (igual o mejor que monolito)
✅ Error rate < 0.1%
✅ Success rate > 99.9%
✅ Sin quejas de usuarios
✅ 0 downtime durante migración
```

---

## Fase 2: Payment Service

### Duración: 4 semanas
### Objetivo: Extraer módulo de pagos

### Consideraciones Especiales

Payment Service es más complejo porque:
- ⚠️ Depende de Auth Service (userId)
- ⚠️ Publica eventos para Blockchain Service
- ⚠️ Tiene lógica crítica de negocio
- ⚠️ Maneja transacciones financieras

### Paso 2.1: Comunicación entre Servicios

**Auth Service → Payment Service (HTTP)**

```typescript
// microservices/payment-service/src/middleware/auth.middleware.ts

import axios from 'axios';

export async function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Llamar a Auth Service para verificar token
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      { timeout: 3000 }
    );
    
    req.user = response.data;
    next();
  } catch (error) {
    // Fallback: Si Auth Service está caído, verificar JWT localmente
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}
```

**Payment Service → Blockchain Service (RabbitMQ)**

```typescript
// microservices/payment-service/src/messaging/publishers/paymentCreated.publisher.ts

import amqp from 'amqplib';

let channel: amqp.Channel;

export async function setupRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  channel = await connection.createChannel();
  
  await channel.assertExchange('midatopay.events', 'topic', { durable: true });
  await channel.assertQueue('payment.created', { durable: true });
  
  await channel.bindQueue(
    'payment.created',
    'midatopay.events',
    'payment.created'
  );
}

export async function publishPaymentCreated(data: any) {
  if (!channel) {
    throw new Error('RabbitMQ not connected');
  }
  
  await channel.publish(
    'midatopay.events',
    'payment.created',
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
  
  console.log('📤 Published: payment.created', data);
}
```

### Paso 2.2: Manejo de Transacciones Distribuidas

**Problema:** Payment Service crea un pago, pero Blockchain Service puede fallar al ejecutar la transacción.

**Solución: Saga Pattern (Coreografía)**

```typescript
// microservices/payment-service/src/services/payment.service.ts

import { publishPaymentCreated } from '../messaging/publishers/paymentCreated.publisher';
import { consumeTransactionConfirmed } from '../messaging/consumers/transactionConfirmed.consumer';

export class PaymentService {
  constructor() {
    // Escuchar confirmaciones de blockchain
    this.setupConsumers();
  }
  
  setupConsumers() {
    // Cuando blockchain confirma, actualizar pago
    consumeTransactionConfirmed(async (data) => {
      const { paymentId, txHash, status } = data;
      
      await this.repository.update(paymentId, {
        status: status === 'CONFIRMED' ? 'CONFIRMED' : 'FAILED',
        transactionHash: txHash,
        confirmedAt: status === 'CONFIRMED' ? new Date() : undefined,
      });
      
      console.log(`✅ Payment ${paymentId} updated to ${status}`);
    });
  }
  
  async createPayment(userId: string, amount: number, currency: string) {
    // 1. Crear pago en estado PENDING
    const payment = await this.repository.create({
      userId,
      amount,
      currency,
      status: 'PENDING',
    });
    
    // 2. Publicar evento para Blockchain Service
    await publishPaymentCreated({
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      timestamp: new Date(),
    });
    
    // 3. Retornar inmediatamente (async)
    return payment;
  }
}
```

**Diagrama de flujo:**

```
Payment Service                 Blockchain Service
      |                                |
      | 1. Create payment (PENDING)   |
      |--------------------------------|
      |                                |
      | 2. Publish payment.created     |
      |------------------------------->|
      |                                | 3. Execute transaction
      |                                |    on Starknet
      |                                |
      | 5. Update to CONFIRMED         |
      |<-------------------------------|
      | 4. Publish transaction.confirmed
      |
```

### Paso 2.3: Idempotencia

**Problema:** RabbitMQ puede entregar el mismo mensaje múltiples veces.

**Solución:** Usar IDs únicos y verificar duplicados.

```typescript
// microservices/payment-service/src/services/payment.service.ts

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class PaymentService {
  async createPayment(data: any) {
    // Generar ID idempotente
    const idempotencyKey = data.idempotencyKey || `payment:${data.userId}:${Date.now()}`;
    
    // Verificar si ya fue procesado
    const existing = await redis.get(idempotencyKey);
    if (existing) {
      console.log('⚠️ Duplicate request detected:', idempotencyKey);
      return JSON.parse(existing);
    }
    
    // Crear pago
    const payment = await this.repository.create(data);
    
    // Guardar en cache por 24 horas
    await redis.setex(idempotencyKey, 86400, JSON.stringify(payment));
    
    return payment;
  }
}
```

**Cliente debe enviar idempotency key:**

```typescript
// frontend/src/services/api.ts

async function createPayment(amount: number) {
  const idempotencyKey = `${userId}-${Date.now()}-${Math.random()}`;
  
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ amount, currency: 'USD' }),
  });
  
  return response.json();
}
```

### Paso 2.4: Testing en Producción (Shadow Traffic)

**Concepto:** Enviar tráfico real DUPLICADO al nuevo servicio sin afectar usuarios.

```javascript
// monolito/shared/middleware/shadowTraffic.js

const axios = require('axios');

function shadowTrafficMiddleware(req, res, next) {
  // Continuar normalmente con el monolito
  next();
  
  // En paralelo, enviar request al microservicio (fire and forget)
  if (req.path.startsWith('/api/payments')) {
    axios({
      method: req.method,
      url: `http://payment-service:3002${req.path}`,
      headers: req.headers,
      data: req.body,
      timeout: 5000,
    })
    .then(response => {
      console.log('✅ Shadow request succeeded');
    })
    .catch(error => {
      console.error('❌ Shadow request failed (no impact on user):', error.message);
    });
  }
}

module.exports = shadowTrafficMiddleware;
```

---

## Fase 3: Blockchain Service

### Duración: 4 semanas
### Objetivo: Extraer módulo de blockchain y workers

### Consideraciones

- ⚠️ Tiene workers en background (monitoring de transacciones)
- ⚠️ Consultas a Starknet pueden ser lentas (5-10s)
- ⚠️ Necesita timeout handling y retries

### Paso 3.1: Separar Worker del API

```typescript
// microservices/blockchain-service/src/server.ts (API)

import express from 'express';
import { WalletController } from './controllers/wallet.controller';
import { TransactionController } from './controllers/transaction.controller';

const app = express();

app.get('/api/blockchain/wallet', WalletController.getWallet);
app.post('/api/blockchain/transaction', TransactionController.create);

app.listen(3003, () => {
  console.log('⛓️  Blockchain Service API running on port 3003');
});
```

```typescript
// microservices/blockchain-service/src/worker.ts (Background Worker)

import { TransactionMonitor } from './workers/transactionMonitor';
import { consumePaymentCreated } from './messaging/consumers/paymentCreated.consumer';

async function main() {
  // Iniciar monitor de transacciones
  const monitor = new TransactionMonitor();
  monitor.start();
  
  // Consumir eventos de pagos
  await consumePaymentCreated(async (data) => {
    const { paymentId, userId, amount } = data;
    
    // Ejecutar transacción en Starknet
    const txHash = await executeTransaction(userId, amount);
    
    console.log(`📤 Transaction created: ${txHash}`);
  });
  
  console.log('🔧 Blockchain Worker started');
}

main();
```

**Docker Compose:**

```yaml
# docker-compose.microservices.yml

services:
  blockchain-service:
    build: ./microservices/blockchain-service
    command: npm start  # API server
    ports:
      - "3003:3003"
    environment:
      STARKNET_RPC_URL: ${STARKNET_RPC_URL}
    depends_on:
      - blockchain-db
      - rabbitmq

  blockchain-worker:
    build: ./microservices/blockchain-service
    command: npm run worker  # Background worker
    environment:
      STARKNET_RPC_URL: ${STARKNET_RPC_URL}
    depends_on:
      - blockchain-db
      - rabbitmq
    # Escalar workers según carga
    deploy:
      replicas: 2
```

### Paso 3.2: Circuit Breaker Pattern

**Problema:** Starknet RPC puede estar caído o lento.

**Solución:** Circuit Breaker para evitar timeouts en cascada.

```typescript
// microservices/blockchain-service/src/utils/circuitBreaker.ts

enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Service is down, don't try
  HALF_OPEN // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  
  private readonly threshold = 5;  // Open after 5 failures
  private readonly timeout = 60000; // Try again after 60s
  private readonly successThreshold = 2; // Close after 2 successes
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if timeout passed
      if (this.lastFailureTime && 
          Date.now() - this.lastFailureTime.getTime() > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        console.log('🔄 Circuit breaker: HALF_OPEN (testing)');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log('✅ Circuit breaker: CLOSED (recovered)');
      }
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      console.error('❌ Circuit breaker: OPEN (too many failures)');
    }
  }
}

// Uso
const starknetCircuitBreaker = new CircuitBreaker();

async function getBalance(address: string) {
  return starknetCircuitBreaker.execute(async () => {
    const response = await provider.getBalance(address);
    return response;
  });
}
```

---

## Fase 4: Servicios de Soporte

### Duración: 4 semanas
### Objetivo: Migrar Notification, Oracle y WebSocket services

Estos son más simples porque:
- ✅ No tienen lógica crítica de negocio
- ✅ Pueden fallar sin afectar pagos
- ✅ Son principalmente consumers de eventos

### Estrategia Simplificada

1. Crear servicio nuevo
2. Suscribir a eventos de RabbitMQ
3. Verificar funcionalidad
4. Remover del monolito

**No necesitan canary deployment** porque no afectan flujos críticos.

---

## Testing en Producción

### Tipos de Testing

#### 1. Shadow Traffic (Semana 1-2)

```
Usuario → Monolito (respuesta real)
       ↓
       → Microservicio (solo logging, no respuesta)
```

**Ventaja:** Cero riesgo para usuarios
**Desventaja:** No prueba flujo completo

#### 2. Canary (Semana 3-4)

```
5% usuarios → Microservicio
95% usuarios → Monolito
```

**Ventaja:** Prueba real con usuarios reales
**Desventaja:** 5% usuarios afectados si hay bug

#### 3. Blue-Green (Deployment final)

```
100% tráfico → Blue (Monolito) → Green (Microservicios)
                                    ↓
                         Switch instantáneo
```

---

## Rollback y Contingencias

### Plan de Rollback Inmediato

```bash
# 1. Detectar problema (alerta automática)
# Error rate > 1% o latencia P95 > 500ms

# 2. Cambiar feature flag a 0%
redis-cli SET feature:use-auth-microservice '{"percentage": 0}'

# 3. Actualizar weight en Kong
curl -X PATCH http://localhost:8001/upstreams/auth-upstream/targets/{microservice-target-id} \
  --data weight=0

curl -X PATCH http://localhost:8001/upstreams/auth-upstream/targets/{monolith-target-id} \
  --data weight=100

# 4. Verificar que tráfico vuelve al monolito
watch -n 1 'curl -s http://localhost:8001/upstreams/auth-upstream/health'

# Total time: < 30 segundos
```

### Alertas Automáticas

```yaml
# infrastructure/prometheus/alerts.yml

groups:
  - name: migration_alerts
    interval: 10s
    rules:
      - alert: HighErrorRate
        expr: |
          rate(http_request_total{status_code=~"5..", service="auth-service"}[1m]) > 0.01
        for: 1m
        annotations:
          summary: "Auth service error rate > 1%"
          description: "Consider rollback"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_ms_bucket{service="auth-service"}[5m])) > 500
        for: 2m
        annotations:
          summary: "Auth service P95 latency > 500ms"
          description: "Consider rollback"
```

---

## Métricas de Éxito

### Por Fase

| Fase | Métrica | Objetivo |
|------|---------|----------|
| **Auth Service** | Latencia P95 | < 200ms |
|                  | Error rate | < 0.1% |
|                  | Success rate | > 99.9% |
| **Payment Service** | Latencia P95 | < 300ms |
|                     | Error rate | < 0.01% |
|                     | Success rate | > 99.99% |
| **Blockchain Service** | Latency P95 | < 1000ms |
|                        | Worker lag | < 30s |
|                        | Transaction success | > 95% |

### Globales

```
✅ 0 downtime durante migración
✅ < 0.1% error rate global
✅ Costo infraestructura < 150% del monolito
✅ Time to deployment < 10 minutos por servicio
✅ Mean Time to Recovery < 5 minutos
```

---

## Checklist Final

### Antes de Migrar un Módulo

```
✅ Código refactorizado en módulo desacoplado
✅ Eventos implementados (sin llamadas directas)
✅ Feature flags configurados
✅ Métricas y dashboards creados
✅ Alertas configuradas
✅ Plan de rollback documentado
✅ Tests de integración pasando
✅ Shadow traffic corriendo 1 semana
✅ Equipo entrenado en nuevo servicio
```

### Durante la Migración

```
✅ Iniciar con 0% (solo whitelist)
✅ Escalar a 5% después de 3 días
✅ Escalar a 25% después de 1 semana
✅ Escalar a 50% después de 2 semanas
✅ Escalar a 100% después de 3 semanas
✅ Monitorear 24/7 durante primeros 7 días
✅ Rollback plan activado si error rate > 1%
```

### Después de la Migración

```
✅ Monitorear 2 semanas adicionales
✅ Verificar que monolito no recibe tráfico
✅ Remover código del monolito
✅ Actualizar documentación
✅ Celebrar con el equipo 🎉
```

---

## Conclusión

La migración de monolito modular a microservicios es un proceso **gradual, incremental y reversible**.

**Claves del Éxito:**

1. ✅ **Preparación exhaustiva** (Fase 0)
2. ✅ **Migrar módulos de menor a mayor complejidad**
3. ✅ **Feature flags** para control granular
4. ✅ **Dual running** para fallback inmediato
5. ✅ **Testing en producción** (shadow traffic, canary)
6. ✅ **Monitoreo intensivo** y alertas automáticas
7. ✅ **Plan de rollback** probado

**Tiempo Total:** 20-24 semanas para migración completa

**Resultado Final:**
- 6 microservicios independientes
- 6 bases de datos separadas
- Escalabilidad horizontal
- Deploy independiente
- Resiliencia mejorada

**Recomendación Final:** No migrar hasta que sea absolutamente necesario. El monolito modular bien diseñado puede servir a un equipo de 3-5 desarrolladores por años.
