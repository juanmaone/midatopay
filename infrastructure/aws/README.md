# Infraestructura AWS - MidatoPay

Este directorio contiene las definiciones de infraestructura para los diferentes ambientes de MidatoPay en AWS.

## 📁 Archivos

### ECS Task Definitions

- `ecs-task-definition-test.json` - Configuración para ambiente TEST
- `ecs-task-definition-dev.json` - Configuración para ambiente DEV
- `ecs-task-definition-prod.json` - Configuración para ambiente PROD

## 🔧 Configuración

### Antes de usar

Reemplazar los siguientes valores en cada archivo:

1. **ACCOUNT_ID**: Tu AWS Account ID
2. **IMAGE**: Se reemplaza automáticamente por GitHub Actions
3. **Secret ARNs**: Actualizar con los ARNs reales de tus secrets

### Ejemplo de actualización

```bash
# Reemplazar ACCOUNT_ID en todos los archivos
ACCOUNT_ID="123456789012"

sed -i "s/ACCOUNT_ID/$ACCOUNT_ID/g" infrastructure/aws/*.json
```

## 📊 Diferencias entre ambientes

### TEST
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB (1 GB)
- Propósito: Testing automatizado

### DEV
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB (1 GB)
- Propósito: Desarrollo continuo

### PROD
- CPU: 1024 (1 vCPU)
- Memory: 2048 MB (2 GB)
- Propósito: Producción
- Features adicionales:
  - ulimits configurados
  - Más recursos

## 🚀 Deploy Manual (si es necesario)

### Registrar Task Definition

```bash
# Test
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/ecs-task-definition-test.json

# Dev
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/ecs-task-definition-dev.json

# Prod
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/ecs-task-definition-prod.json
```

### Actualizar Servicio

```bash
# Test
aws ecs update-service \
  --cluster midatopay-test-cluster \
  --service midatopay-backend-test \
  --task-definition midatopay-backend-test \
  --force-new-deployment

# Dev
aws ecs update-service \
  --cluster midatopay-dev-cluster \
  --service midatopay-backend-dev \
  --task-definition midatopay-backend-dev \
  --force-new-deployment

# Prod
aws ecs update-service \
  --cluster midatopay-prod-cluster \
  --service midatopay-backend-prod \
  --task-definition midatopay-backend-prod \
  --force-new-deployment
```

## 🔐 Secrets Configuration

Los secrets se gestionan en AWS Secrets Manager con el siguiente formato:

```json
{
  "DATABASE_URL": "postgresql://...",
  "JWT_SECRET": "...",
  "STARKNET_PRIVATE_KEY": "0x...",
  "STARKNET_RPC_URL": "https://...",
  "REDIS_URL": "redis://..."
}
```

### Crear Secret

```bash
aws secretsmanager create-secret \
  --name midatopay/test/backend \
  --description "Backend secrets for test environment" \
  --secret-string file://secrets-test.json
```

## 📝 Health Checks

Todos los ambientes tienen configurado:

```json
{
  "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

Asegúrate de que tu aplicación exponga el endpoint `/health`.

## 🔄 Actualizar Task Definitions

1. Modificar archivo JSON
2. Commit y push
3. GitHub Actions automáticamente usa la nueva definición

O manualmente:

```bash
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/ecs-task-definition-test.json
```

## 📊 Logs

Los logs se envían a CloudWatch:

```bash
# Ver logs
aws logs tail /ecs/midatopay-backend-test --follow

# Filtrar errores
aws logs filter-log-events \
  --log-group-name /ecs/midatopay-backend-test \
  --filter-pattern "ERROR"
```

## 🛠️ Troubleshooting

### Task no inicia

1. Verificar logs:
   ```bash
   aws ecs describe-tasks \
     --cluster midatopay-test-cluster \
     --tasks <task-id>
   ```

2. Verificar secrets:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id midatopay/test/backend
   ```

3. Verificar permisos IAM

### Health check falla

1. Verificar que el endpoint `/health` existe
2. Verificar que el puerto 3001 está expuesto
3. Aumentar `startPeriod` si la app tarda en iniciar

## 📚 Referencias

- [ECS Task Definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- [Fargate Task Sizes](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html)
- [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
