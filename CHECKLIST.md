# ✅ Checklist de Configuración CI/CD

## 📋 Pre-requisitos

- [ ] Cuenta AWS con permisos de administrador
- [ ] AWS CLI instalado (`aws --version`)
- [ ] Git instalado (`git --version`)
- [ ] Node.js 20+ instalado (`node --version`)
- [ ] Acceso al repositorio GitHub de MidatoPay
- [ ] Editor de texto (VS Code recomendado)

---

## 🔧 Fase 1: Configuración AWS

### 1.1 Usuario IAM

- [ ] Crear usuario IAM `github-actions-midatopay`
- [ ] Crear política `GitHubActionsMidatoPay` con permisos
- [ ] Adjuntar política al usuario
- [ ] Crear Access Keys
- [ ] **Guardar**: `AWS_ACCESS_KEY_ID`
- [ ] **Guardar**: `AWS_SECRET_ACCESS_KEY`

### 1.2 Infraestructura Base

- [ ] Ejecutar `.\infrastructure\aws\setup-infrastructure.ps1`
- [ ] **Guardar**: VPC ID
- [ ] **Guardar**: Subnet IDs (mínimo 2)
- [ ] **Guardar**: Security Group IDs
- [ ] Verificar ECR repositories creados
- [ ] Verificar S3 bucket creado
- [ ] Verificar ECS cluster creado

### 1.3 Base de Datos RDS

- [ ] Crear RDS instance (db.t3.micro para test)
- [ ] Configurar security group para permitir conexión desde ECS
- [ ] Esperar a que esté "available" (~10 min)
- [ ] **Guardar**: Database endpoint
- [ ] **Guardar**: Database password

### 1.4 AWS Secrets Manager

- [ ] Crear secret `midatopay/test/backend`
- [ ] Agregar `DATABASE_URL`
- [ ] Agregar `JWT_SECRET`
- [ ] Agregar `STARKNET_PRIVATE_KEY`
- [ ] Agregar `STARKNET_RPC_URL`
- [ ] Agregar `REDIS_URL`

### 1.5 IAM Roles

- [ ] Crear/verificar `ecsTaskExecutionRole`
- [ ] Adjuntar política `AmazonECSTaskExecutionRolePolicy`
- [ ] Crear/verificar `ecsTaskRole`
- [ ] Configurar trust relationships para ECS

### 1.6 ECS Service

- [ ] Registrar task definition inicial
- [ ] Crear servicio ECS
- [ ] Configurar networking (subnets, security groups)
- [ ] Configurar desired count = 1
- [ ] Verificar servicio en estado ACTIVE

---

## 🐙 Fase 2: Configuración GitHub

### 2.1 Secrets Globales

Ir a: `Settings` > `Secrets and variables` > `Actions`

- [ ] `AWS_ACCOUNT_ID` = (tu account ID)
- [ ] `AWS_REGION` = us-east-1
- [ ] `AWS_ACCESS_KEY_ID` = (del paso 1.1)
- [ ] `AWS_SECRET_ACCESS_KEY` = (del paso 1.1)

### 2.2 Secrets TEST Environment

- [ ] `DATABASE_URL_TEST` = (del paso 1.3)
- [ ] `STARKNET_PRIVATE_KEY_TEST` = (tu clave privada)
- [ ] `FRONTEND_BUCKET_TEST` = midatopay-frontend-test
- [ ] `SUBNET_IDS_TEST` = subnet-xxx,subnet-yyy
- [ ] `SECURITY_GROUP_ID_TEST` = sg-xxx

### 2.3 Secrets Opcionales

- [ ] `SLACK_WEBHOOK_URL` (si usas Slack)
- [ ] `SNYK_TOKEN` (si usas Snyk)
- [ ] `CLOUDFRONT_DISTRIBUTION_ID_TEST` (si usas CloudFront)

### 2.4 Git Branches

- [ ] Verificar branch `master` existe
- [ ] Crear branch `test`: `git checkout -b test`
- [ ] Push branch: `git push -u origin test`
- [ ] Crear branch `dev`: `git checkout -b dev`
- [ ] Push branch: `git push -u origin dev`

---

## 📝 Fase 3: Configuración Archivos

### 3.1 Task Definitions

- [ ] Actualizar `infrastructure/aws/ecs-task-definition-test.json`
  - [ ] Reemplazar `ACCOUNT_ID` con tu AWS Account ID
  - [ ] Verificar ARNs de secrets
  - [ ] Verificar configuración de CPU/Memory
  
- [ ] Actualizar `infrastructure/aws/ecs-task-definition-dev.json`
- [ ] Actualizar `infrastructure/aws/ecs-task-definition-prod.json`

### 3.2 Workflows

Los workflows ya están creados en:
- [ ] `.github/workflows/deploy-test.yml`
- [ ] `.github/workflows/deploy-dev.yml`
- [ ] `.github/workflows/deploy-prod.yml`
- [ ] `.github/workflows/pr-validation.yml`

### 3.3 Scripts

- [ ] Verificar `.github/scripts/run-tests.sh` existe
- [ ] Verificar `.github/scripts/security-scan.sh` existe
- [ ] Dar permisos de ejecución: `chmod +x .github/scripts/*.sh`

---

## ✅ Fase 4: Validación

### 4.1 Validación Local

- [ ] Ejecutar: `.\scripts\validate-setup.ps1 -Environment test`
- [ ] Verificar todos los checks pasan
- [ ] Resolver warnings si es necesario

### 4.2 Validación Manual

- [ ] AWS CLI conectado: `aws sts get-caller-identity`
- [ ] VPC existe: `aws ec2 describe-vpcs`
- [ ] ECS cluster activo: `aws ecs list-clusters`
- [ ] RDS disponible: `aws rds describe-db-instances`
- [ ] ECR repositories: `aws ecr describe-repositories`
- [ ] S3 bucket: `aws s3 ls`

---

## 🚀 Fase 5: Primer Despliegue

### 5.1 Preparación

- [ ] Todos los archivos commiteados en `master`
- [ ] Branch `test` actualizado: `git checkout test && git merge master`
- [ ] No hay cambios pendientes: `git status`

### 5.2 Trigger Deploy

- [ ] Hacer un cambio menor (ej: update README)
- [ ] Commit: `git commit -m "test: primer despliegue"`
- [ ] Push: `git push origin test`

### 5.3 Monitoreo

- [ ] Abrir GitHub Actions: https://github.com/MidatoPay/midatopay/actions
- [ ] Ver workflow "Deploy to Test Environment" ejecutándose
- [ ] Verificar cada job pasa:
  - [ ] Tests & Security Scans
  - [ ] Build & Push Images
  - [ ] Deploy Backend
  - [ ] Deploy Frontend
  - [ ] Health Checks

### 5.4 Verificación Post-Deploy

- [ ] Backend health check: `curl https://api-test.midatopay.com/health`
- [ ] Ver logs ECS: `aws logs tail /ecs/midatopay-backend-test --follow`
- [ ] Ver tasks running: `aws ecs list-tasks --cluster midatopay-test-cluster`
- [ ] Frontend accesible (si configurado CloudFront)

---

## 🔧 Fase 6: Configuración Opcional

### 6.1 Application Load Balancer

- [ ] Crear ALB
- [ ] Crear Target Group
- [ ] Crear Listener HTTP/HTTPS
- [ ] Actualizar ECS service para usar ALB
- [ ] Configurar health check path: `/health`

### 6.2 CloudFront (Frontend)

- [ ] Crear distribución CloudFront
- [ ] Configurar origen S3
- [ ] Configurar cache behaviors
- [ ] Habilitar HTTPS
- [ ] **Guardar**: Distribution ID
- [ ] Agregar a GitHub Secrets: `CLOUDFRONT_DISTRIBUTION_ID_TEST`

### 6.3 Route 53 (DNS)

- [ ] Crear hosted zone
- [ ] Crear record A para backend: `api-test.midatopay.com`
- [ ] Crear record CNAME para frontend: `test.midatopay.com`
- [ ] Configurar alias a ALB/CloudFront

### 6.4 Certificate Manager (SSL)

- [ ] Solicitar certificado SSL
- [ ] Validar dominio (DNS o email)
- [ ] Adjuntar certificado a ALB/CloudFront

### 6.5 Monitoring

- [ ] Crear dashboard en CloudWatch
- [ ] Configurar alarmas:
  - [ ] CPU alta (>80%)
  - [ ] Memory alta (>80%)
  - [ ] Error rate alta
  - [ ] RDS connections
- [ ] Configurar SNS topic para notificaciones
- [ ] Suscribirse a topic (email)

---

## 🔄 Fase 7: Replicar para DEV y PROD

### 7.1 Ambiente DEV

- [ ] Replicar infraestructura AWS con suffix `-dev`
- [ ] Crear secrets GitHub con suffix `_DEV`
- [ ] Verificar workflow `deploy-dev.yml`
- [ ] Hacer deploy a branch `dev`
- [ ] Verificar funcionamiento

### 7.2 Ambiente PROD

- [ ] Replicar infraestructura AWS con suffix `-prod`
- [ ] Usar instancias más grandes (db.t3.small+, 1vCPU/2GB)
- [ ] Crear secrets GitHub con suffix `_PROD`
- [ ] Verificar workflow `deploy-prod.yml`
- [ ] Configurar ambiente de producción en GitHub
- [ ] Configurar aprobadores requeridos
- [ ] Hacer deploy a branch `master`

---

## 📚 Fase 8: Documentación

- [ ] Leer `SETUP_TEST_ENVIRONMENT.md`
- [ ] Leer `QUICK_START.md`
- [ ] Leer `FILES_CREATED.md`
- [ ] Leer `.github/workflows/README.md`
- [ ] Leer `infrastructure/aws/README.md`
- [ ] Actualizar documentación del equipo
- [ ] Entrenar equipo en uso de CI/CD

---

## 🎉 Checklist Final

- [ ] ✅ Infraestructura AWS completa
- [ ] ✅ GitHub Secrets configurados
- [ ] ✅ Workflows funcionando
- [ ] ✅ Primer deploy exitoso a TEST
- [ ] ✅ Health checks pasando
- [ ] ✅ Logs accesibles
- [ ] ✅ Ambiente DEV configurado
- [ ] ✅ Ambiente PROD configurado
- [ ] ✅ Documentación completa
- [ ] ✅ Equipo entrenado

---

## 📊 Métricas de Éxito

- [ ] Deploy time < 10 minutos
- [ ] Success rate > 95%
- [ ] Tests coverage > 70%
- [ ] Zero downtime deployments
- [ ] Rollback time < 2 minutos

---

## 🆘 Troubleshooting

### Si algo falla:

1. **Workflow falla en build**
   - [ ] Verificar permisos ECR
   - [ ] Verificar Dockerfile
   - [ ] Ver logs de GitHub Actions

2. **Workflow falla en deploy**
   - [ ] Verificar secrets configurados
   - [ ] Verificar task definition
   - [ ] Ver logs de CloudWatch

3. **Health check falla**
   - [ ] Verificar endpoint `/health` existe
   - [ ] Verificar security groups
   - [ ] Verificar logs del contenedor

4. **Base de datos no conecta**
   - [ ] Verificar DATABASE_URL en secrets
   - [ ] Verificar security group permite conexión
   - [ ] Verificar RDS está available

### Comandos útiles:

```powershell
# Ver logs
aws logs tail /ecs/midatopay-backend-test --follow

# Ver estado servicio
aws ecs describe-services --cluster midatopay-test-cluster --services midatopay-backend-test

# Ver workflows
gh run list --workflow=deploy-test.yml

# Validar setup
.\scripts\validate-setup.ps1 -Environment test
```

---

## 📞 Soporte

- 📖 **Documentación**: Ver archivos `.md` en el repositorio
- 🐛 **Issues**: https://github.com/MidatoPay/midatopay/issues
- 📧 **Email**: devops@midatopay.com

---

**Última actualización**: 2026-01-21

**Versión**: 1.0.0
