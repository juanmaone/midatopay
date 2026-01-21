# GitHub Actions CI/CD Workflows

Este directorio contiene los workflows de GitHub Actions para el despliegue continuo de MidatoPay en AWS.

## 📁 Estructura

```
.github/
├── workflows/
│   ├── deploy-test.yml      # Despliegue automático a TEST
│   ├── deploy-dev.yml       # Despliegue automático a DEV
│   ├── deploy-prod.yml      # Despliegue a PRODUCTION (con aprobación)
│   └── pr-validation.yml    # Validación de Pull Requests
└── scripts/
    ├── run-tests.sh         # Script de testing
    └── security-scan.sh     # Script de seguridad
```

## 🚀 Workflows

### 1. Deploy to Test (`deploy-test.yml`)

**Trigger:** Push al branch `test`

**Jobs:**
1. ✅ Tests y Seguridad
2. 🐳 Build y Push Docker Images
3. 🚀 Deploy Backend a ECS
4. 🌐 Deploy Frontend a S3
5. 🏥 Health Checks
6. 📢 Notificaciones

**URL:** https://test.midatopay.com

### 2. Deploy to Dev (`deploy-dev.yml`)

**Trigger:** Push al branch `dev`

**Jobs:** Mismos que TEST pero con configuración DEV

**URL:** https://dev.midatopay.com

### 3. Deploy to Production (`deploy-prod.yml`)

**Trigger:** Push al branch `master`

**Jobs:** 
1. ⏸️ Manual Approval Required
2. (resto igual que TEST/DEV pero con más validaciones)

**URL:** https://midatopay.com

### 4. PR Validation (`pr-validation.yml`)

**Trigger:** Pull Request a `master`, `test`, o `dev`

**Validaciones:**
- ✅ Tests unitarios
- 🔍 Linting
- 🔒 Security audit
- 🏗️ Build verification

## 🔐 Secrets Requeridos

### Secrets Globales (todos los ambientes)

```bash
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxx
```

### Secrets por Ambiente

#### TEST
```bash
DATABASE_URL_TEST=postgresql://...
STARKNET_PRIVATE_KEY_TEST=0x...
FRONTEND_BUCKET_TEST=midatopay-frontend-test
CLOUDFRONT_DISTRIBUTION_ID_TEST=E1234567890ABC
SUBNET_IDS_TEST=subnet-xxx,subnet-yyy
SECURITY_GROUP_ID_TEST=sg-xxx
```

#### DEV
```bash
DATABASE_URL_DEV=postgresql://...
STARKNET_PRIVATE_KEY_DEV=0x...
FRONTEND_BUCKET_DEV=midatopay-frontend-dev
CLOUDFRONT_DISTRIBUTION_ID_DEV=E0987654321ABC
SUBNET_IDS_DEV=subnet-aaa,subnet-bbb
SECURITY_GROUP_ID_DEV=sg-aaa
```

#### PROD
```bash
DATABASE_URL_PROD=postgresql://...
STARKNET_PRIVATE_KEY_PROD=0x...
FRONTEND_BUCKET_PROD=midatopay-frontend-prod
CLOUDFRONT_DISTRIBUTION_ID_PROD=EABCDEF123456
SUBNET_IDS_PROD=subnet-111,subnet-222
SECURITY_GROUP_ID_PROD=sg-111
```

### Secrets Opcionales

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SNYK_TOKEN=xxxxxxxx
```

## 📝 Configurar Secrets

### Via GitHub Web UI

1. Ir a: `Settings` > `Secrets and variables` > `Actions`
2. Click `New repository secret`
3. Agregar nombre y valor
4. Click `Add secret`

### Via GitHub CLI

```bash
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set DATABASE_URL_TEST
# ... etc
```

## 🔄 Flujo de Trabajo

### 1. Desarrollo Local

```bash
git checkout dev
# ... hacer cambios ...
git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev
```

Esto automáticamente:
- ✅ Ejecuta tests
- 🔒 Escanea seguridad
- 🐳 Construye imágenes Docker
- 🚀 Despliega a DEV

### 2. Testing

```bash
git checkout test
git merge dev
git push origin test
```

Despliega a ambiente de TEST para QA.

### 3. Producción

```bash
git checkout master
git merge test
git push origin master
```

Requiere **aprobación manual** antes de desplegar.

## 🛠️ Comandos Útiles

### Ver logs de workflow

```bash
# Listar workflows
gh run list --workflow=deploy-test.yml

# Ver detalles
gh run view <run-id>

# Ver logs
gh run view <run-id> --log
```

### Ejecutar workflow manualmente

```bash
gh workflow run deploy-test.yml
```

### Cancelar workflow en ejecución

```bash
gh run cancel <run-id>
```

## 🔍 Debugging

### Ver logs en AWS

```bash
# Logs de ECS
aws logs tail /ecs/midatopay-backend-test --follow

# Logs de CloudWatch
aws logs get-log-events \
  --log-group-name /ecs/midatopay-backend-test \
  --log-stream-name ecs/backend/xxx
```

### Verificar despliegue

```bash
# Health check
curl https://api-test.midatopay.com/health

# Ver versión desplegada
curl https://api-test.midatopay.com/api/version
```

## 📊 Métricas y Monitoreo

Los workflows generan:
- 📈 Reportes de coverage en GitHub
- 🔒 Análisis de seguridad en Security tab
- 📝 Logs en CloudWatch
- 📢 Notificaciones en Slack

## 🚨 Troubleshooting

### Error: "No space left on device"

```yaml
- name: Clean up Docker
  run: docker system prune -af
```

### Error: "Failed to pull image"

Verificar permisos de ECR:

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Error: "Task failed health check"

Verificar logs:

```bash
aws logs tail /ecs/midatopay-backend-test --follow --since 10m
```

## 📚 Referencias

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AWS ECS Deploy Action](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)
- [AWS ECR Login Action](https://github.com/aws-actions/amazon-ecr-login)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## 🤝 Contribuir

Para modificar workflows:

1. Hacer cambios en branch feature
2. Crear PR a `dev`
3. Validar en DEV
4. Merge a `test` para QA
5. Merge a `master` para PROD

## 📞 Soporte

Para problemas con CI/CD, contactar al equipo de DevOps.
