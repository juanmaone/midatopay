# 🚀 Quick Start - Despliegue Rápido

## Setup Inicial (Primera vez)

### 1. Configurar AWS (5-10 minutos)

```powershell
# Configurar credenciales AWS
aws configure

# Ejecutar script de infraestructura
cd c:\node\midatopay\midatopay
.\infrastructure\aws\setup-infrastructure.ps1

# Guardar los IDs generados
```

### 2. Configurar GitHub Secrets (2 minutos)

Ir a: https://github.com/MidatoPay/midatopay/settings/secrets/actions

```
AWS_ACCOUNT_ID=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

DATABASE_URL_TEST=...
STARKNET_PRIVATE_KEY_TEST=...
FRONTEND_BUCKET_TEST=midatopay-frontend-test
SUBNET_IDS_TEST=subnet-xxx,subnet-yyy
SECURITY_GROUP_ID_TEST=sg-xxx
```

### 3. Crear Branches (1 minuto)

```powershell
git checkout master
git checkout -b test
git push -u origin test

git checkout master
git checkout -b dev
git push -u origin dev
```

### 4. Validar Setup (1 minuto)

```powershell
.\scripts\validate-setup.ps1 -Environment test
```

### 5. Primer Deploy (automático)

```powershell
git checkout test
echo "# Test deployment" >> README.md
git add .
git commit -m "test: primer despliegue"
git push origin test
```

Ver progreso: https://github.com/MidatoPay/midatopay/actions

---

## Workflow Diario

### Desarrollo en DEV

```powershell
git checkout dev
git pull origin dev

# ... hacer cambios ...

git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev

# Deploy automático a DEV
```

### Testing en TEST

```powershell
git checkout test
git merge dev
git push origin test

# Deploy automático a TEST
```

### Producción

```powershell
git checkout master
git merge test
git push origin master

# Requiere aprobación manual en GitHub
```

---

## Comandos Útiles

### Ver Workflows

```powershell
# Listar workflows
gh run list --workflow=deploy-test.yml

# Ver último workflow
gh run view --log

# Ver workflow en tiempo real
gh run watch
```

### Ver Logs AWS

```powershell
# Logs de ECS
aws logs tail /ecs/midatopay-backend-test --follow

# Logs de RDS
aws rds describe-db-log-files --db-instance-identifier midatopay-test-db
```

### Health Checks

```powershell
# Backend
curl https://api-test.midatopay.com/health

# Ver estado de servicio
aws ecs describe-services `
  --cluster midatopay-test-cluster `
  --services midatopay-backend-test
```

### Rollback Rápido

```powershell
# Opción 1: Revertir commit
git revert HEAD
git push origin test

# Opción 2: Rollback en AWS
aws ecs update-service `
  --cluster midatopay-test-cluster `
  --service midatopay-backend-test `
  --task-definition midatopay-backend-test:REVISION_ANTERIOR `
  --force-new-deployment
```

---

## Troubleshooting

### Workflow Falla

```powershell
# Ver errores
gh run view --log

# Ver logs de GitHub Actions en web
# https://github.com/MidatoPay/midatopay/actions
```

### ECS Task No Inicia

```powershell
# Ver eventos
aws ecs describe-services `
  --cluster midatopay-test-cluster `
  --services midatopay-backend-test `
  --query 'services[0].events[0:5]'

# Ver logs
aws logs tail /ecs/midatopay-backend-test --follow --since 10m
```

### Database Connection Error

```powershell
# Verificar endpoint
aws rds describe-db-instances `
  --db-instance-identifier midatopay-test-db `
  --query 'DBInstances[0].Endpoint'

# Verificar security groups
aws ec2 describe-security-groups `
  --filters "Name=group-name,Values=midatopay-test-db-sg"
```

### Build Falla

```powershell
# Limpiar cache local
npm ci --cache .npm --prefer-offline

# Verificar permisos ECR
aws ecr get-login-password --region us-east-1 | `
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

---

## Comandos de Gestión

### Escalar Servicio

```powershell
# Aumentar réplicas
aws ecs update-service `
  --cluster midatopay-test-cluster `
  --service midatopay-backend-test `
  --desired-count 2
```

### Ver Métricas

```powershell
# CPU y Memoria
aws cloudwatch get-metric-statistics `
  --namespace AWS/ECS `
  --metric-name CPUUtilization `
  --dimensions Name=ServiceName,Value=midatopay-backend-test `
  --start-time (Get-Date).AddHours(-1) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Average
```

### Backup Database

```powershell
# Crear snapshot
aws rds create-db-snapshot `
  --db-instance-identifier midatopay-test-db `
  --db-snapshot-identifier "midatopay-test-$(Get-Date -Format 'yyyyMMdd-HHmm')"
```

### Limpiar Recursos (Cuidado!)

```powershell
# Eliminar ECS Service
aws ecs update-service `
  --cluster midatopay-test-cluster `
  --service midatopay-backend-test `
  --desired-count 0

aws ecs delete-service `
  --cluster midatopay-test-cluster `
  --service midatopay-backend-test `
  --force

# Eliminar RDS (crear snapshot primero!)
aws rds delete-db-instance `
  --db-instance-identifier midatopay-test-db `
  --final-db-snapshot-identifier midatopay-test-final-snapshot
```

---

## Monitoreo

### Dashboard CloudWatch

```powershell
# Abrir dashboard
start "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:"
```

### Alertas

```powershell
# Crear alarma de CPU alta
aws cloudwatch put-metric-alarm `
  --alarm-name midatopay-test-high-cpu `
  --alarm-description "Alert when CPU exceeds 80%" `
  --metric-name CPUUtilization `
  --namespace AWS/ECS `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2
```

---

## Links Rápidos

- **GitHub Actions**: https://github.com/MidatoPay/midatopay/actions
- **AWS Console**: https://console.aws.amazon.com
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
- **ECS Console**: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters
- **RDS Console**: https://console.aws.amazon.com/rds/home?region=us-east-1#databases:

---

## Ambientes

| Ambiente | Branch | URL Backend | URL Frontend | Auto Deploy |
|----------|--------|-------------|--------------|-------------|
| DEV | `dev` | api-dev.midatopay.com | dev.midatopay.com | ✅ |
| TEST | `test` | api-test.midatopay.com | test.midatopay.com | ✅ |
| PROD | `master` | api.midatopay.com | midatopay.com | ⏸️ Manual |

---

## Checklist Pre-Deploy

- [ ] Tests pasan localmente: `npm test`
- [ ] Build exitoso: `npm run build`
- [ ] Linting OK: `npm run lint`
- [ ] No hay secrets hardcodeados
- [ ] Database migrations probadas
- [ ] Variables de entorno actualizadas
- [ ] Documentación actualizada

---

## Scripts Disponibles

```powershell
# Validar setup
.\scripts\validate-setup.ps1 -Environment test

# Backup database
.\scripts\backup-db.sh

# Check status
.\scripts\check-status.sh

# Deploy manual (si es necesario)
.\scripts\deploy.sh

# Update configuración
.\scripts\update.sh
```

---

## Cheat Sheet AWS CLI

```powershell
# Ver todos los recursos con tag
aws resourcegroupstaggingapi get-resources `
  --tag-filters Key=Environment,Values=test

# Listar ECR images
aws ecr list-images --repository-name midatopay/backend

# Ver ECS tasks
aws ecs list-tasks --cluster midatopay-test-cluster

# Describir task
aws ecs describe-tasks `
  --cluster midatopay-test-cluster `
  --tasks <task-arn>

# Ver secrets
aws secretsmanager list-secrets --filters Key=name,Values=midatopay

# Ejecutar comando en contenedor (si SSH está habilitado)
aws ecs execute-command `
  --cluster midatopay-test-cluster `
  --task <task-id> `
  --container backend `
  --interactive `
  --command "/bin/sh"
```

---

## Costos Estimados (mensual)

| Servicio | Tamaño | Costo TEST | Costo PROD |
|----------|--------|------------|------------|
| ECS Fargate | 0.5 vCPU, 1GB | ~$15 | ~$30 |
| RDS PostgreSQL | db.t3.micro | ~$15 | ~$80 |
| S3 + CloudFront | 10GB | ~$5 | ~$20 |
| NAT Gateway | - | ~$30 | ~$30 |
| ALB | - | ~$20 | ~$20 |
| **Total** | | **~$85** | **~$180** |

*Nota: Costos aproximados, pueden variar según uso*

---

## Soporte

- **Documentación**: Ver archivos en `.github/workflows/` y `infrastructure/aws/`
- **Guía Completa**: `SETUP_TEST_ENVIRONMENT.md`
- **Logs**: GitHub Actions > Latest run > View logs
- **Issues**: https://github.com/MidatoPay/midatopay/issues
