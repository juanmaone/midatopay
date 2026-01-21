# 🚀 Guía Completa: Configuración Ambiente TEST

Esta guía te llevará paso a paso para configurar y desplegar el ambiente de TEST de MidatoPay en AWS.

## ✅ Checklist Pre-requisitos

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta de AWS con permisos de administrador
- [ ] AWS CLI instalado y configurado
- [ ] Git instalado
- [ ] Acceso al repositorio GitHub de MidatoPay
- [ ] Node.js 20+ instalado

## 📋 Paso 1: Configurar Infraestructura AWS

### 1.1 Crear Usuario IAM para GitHub Actions

```powershell
# Crear usuario
aws iam create-user --user-name github-actions-midatopay

# Crear y adjuntar política
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Crear política (guardar en policy.json)
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:*",
        "ecs:*",
        "s3:*",
        "cloudfront:*",
        "rds:*",
        "secretsmanager:*",
        "logs:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
"@ | Out-File -FilePath policy.json

aws iam create-policy `
  --policy-name GitHubActionsMidatoPay `
  --policy-document file://policy.json

aws iam attach-user-policy `
  --user-name github-actions-midatopay `
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/GitHubActionsMidatoPay"

# Crear access keys
$KEYS = aws iam create-access-key --user-name github-actions-midatopay --output json | ConvertFrom-Json

Write-Host "🔑 Access Key ID: $($KEYS.AccessKey.AccessKeyId)"
Write-Host "🔐 Secret Access Key: $($KEYS.AccessKey.SecretAccessKey)"
Write-Host ""
Write-Warning "⚠️ GUARDAR ESTAS CREDENCIALES - No se pueden recuperar después"
```

**✅ Guardar:** `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`

### 1.2 Ejecutar Script de Infraestructura

```powershell
cd c:\node\midatopay\midatopay

# Ejecutar script de configuración
.\infrastructure\aws\setup-infrastructure.ps1
```

Este script creará:
- ✅ VPC y Subnets
- ✅ Internet Gateway
- ✅ Security Groups
- ✅ ECR Repositories
- ✅ S3 Bucket
- ✅ ECS Cluster
- ✅ RDS Subnet Group

**📝 Anotar los IDs generados** (VPC, Subnets, Security Groups, etc.)

### 1.3 Crear Base de Datos RDS

```powershell
# Obtener Security Group ID del output anterior
$DB_SG_ID = "sg-xxxxx"  # Del paso anterior
$SUBNET_GROUP = "midatopay-test-db-subnet-group"

# Crear RDS instance
aws rds create-db-instance `
  --db-instance-identifier midatopay-test-db `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 15.5 `
  --master-username midatopay_admin `
  --master-user-password 'TuPasswordSeguro123!' `
  --allocated-storage 20 `
  --db-subnet-group-name $SUBNET_GROUP `
  --vpc-security-group-ids $DB_SG_ID `
  --backup-retention-period 7 `
  --storage-encrypted `
  --tags Key=Environment,Value=test

Write-Host "⏳ Esperando a que RDS esté disponible (esto toma ~10 minutos)..."

# Esperar a que esté disponible
aws rds wait db-instance-available --db-instance-identifier midatopay-test-db

# Obtener endpoint
$DB_ENDPOINT = aws rds describe-db-instances `
  --db-instance-identifier midatopay-test-db `
  --query 'DBInstances[0].Endpoint.Address' `
  --output text

Write-Host "✅ RDS Database Endpoint: $DB_ENDPOINT"
```

**✅ Guardar:** Database endpoint

### 1.4 Crear Secrets en AWS Secrets Manager

```powershell
$DB_ENDPOINT = "midatopay-test-db.xxxxx.us-east-1.rds.amazonaws.com"  # Del paso anterior

# Crear secrets para backend
$SECRETS = @{
    DATABASE_URL = "postgresql://midatopay_admin:TuPasswordSeguro123!@${DB_ENDPOINT}:5432/midatopay"
    JWT_SECRET = "test-jwt-secret-$(New-Guid)"
    STARKNET_PRIVATE_KEY = "0x..."  # Tu clave privada de Starknet
    STARKNET_RPC_URL = "https://starknet-sepolia.infura.io/v3/YOUR_KEY"
    REDIS_URL = "redis://midatopay-test-redis:6379"
} | ConvertTo-Json

$SECRETS | Out-File -FilePath secrets-test.json

aws secretsmanager create-secret `
  --name midatopay/test/backend `
  --description "Backend secrets for test environment" `
  --secret-string file://secrets-test.json

Write-Host "✅ Secrets creados en AWS Secrets Manager"

# Limpiar archivo temporal
Remove-Item secrets-test.json
```

### 1.5 Crear Roles IAM para ECS

```powershell
# Crear ecsTaskExecutionRole si no existe
aws iam create-role `
  --role-name ecsTaskExecutionRole `
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>$null

aws iam attach-role-policy `
  --role-name ecsTaskExecutionRole `
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Crear ecsTaskRole
aws iam create-role `
  --role-name ecsTaskRole `
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>$null

Write-Host "✅ Roles IAM creados"
```

### 1.6 Actualizar Task Definition con tu Account ID

```powershell
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Actualizar task definitions
$files = @(
    "infrastructure\aws\ecs-task-definition-test.json",
    "infrastructure\aws\ecs-task-definition-dev.json",
    "infrastructure\aws\ecs-task-definition-prod.json"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace "ACCOUNT_ID", $ACCOUNT_ID
    Set-Content $file $content
}

Write-Host "✅ Task definitions actualizadas con Account ID: $ACCOUNT_ID"
```

### 1.7 Crear ECS Service

```powershell
$SUBNET_1_ID = "subnet-xxx"  # Del paso 1.2
$SUBNET_2_ID = "subnet-yyy"  # Del paso 1.2
$BACKEND_SG_ID = "sg-zzz"    # Del paso 1.2

# Registrar task definition inicial
aws ecs register-task-definition `
  --cli-input-json file://infrastructure/aws/ecs-task-definition-test.json

# Crear servicio ECS
aws ecs create-service `
  --cluster midatopay-test-cluster `
  --service-name midatopay-backend-test `
  --task-definition midatopay-backend-test `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1_ID,$SUBNET_2_ID],securityGroups=[$BACKEND_SG_ID],assignPublicIp=ENABLED}"

Write-Host "✅ ECS Service creado"
```

## 📋 Paso 2: Configurar GitHub

### 2.1 Configurar GitHub Secrets

En GitHub, ir a: `Settings` > `Secrets and variables` > `Actions` > `New repository secret`

Agregar los siguientes secrets:

```
AWS_ACCOUNT_ID=<tu-account-id>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<del-paso-1.1>
AWS_SECRET_ACCESS_KEY=<del-paso-1.1>

# TEST Environment
DATABASE_URL_TEST=<del-paso-1.4>
STARKNET_PRIVATE_KEY_TEST=<tu-clave>
FRONTEND_BUCKET_TEST=midatopay-frontend-test
SUBNET_IDS_TEST=<subnet-1>,<subnet-2>
SECURITY_GROUP_ID_TEST=<security-group-id>
```

### 2.2 Crear y Configurar Branch TEST

```powershell
cd c:\node\midatopay\midatopay

# Asegurarse de estar en master
git checkout master
git pull origin master

# Crear branch test
git checkout -b test

# Push del branch con todos los archivos nuevos
git add .
git commit -m "feat: configurar CI/CD para ambiente test"
git push -u origin test
```

## 📋 Paso 3: Primer Despliegue

### 3.1 Verificar Workflow

1. Ir a GitHub: `Actions` tab
2. Deberías ver el workflow "Deploy to Test Environment" ejecutándose
3. Click para ver los logs en tiempo real

### 3.2 Monitorear Despliegue

```powershell
# Ver logs de GitHub Actions
gh run list --workflow=deploy-test.yml

# Ver último run
gh run view --log

# Ver logs de ECS en tiempo real
aws logs tail /ecs/midatopay-backend-test --follow
```

### 3.3 Verificar Aplicación

```powershell
# Obtener IP pública del servicio ECS
$TASK_ARN = aws ecs list-tasks `
  --cluster midatopay-test-cluster `
  --service-name midatopay-backend-test `
  --query 'taskArns[0]' `
  --output text

$ENI_ID = aws ecs describe-tasks `
  --cluster midatopay-test-cluster `
  --tasks $TASK_ARN `
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' `
  --output text

$PUBLIC_IP = aws ec2 describe-network-interfaces `
  --network-interface-ids $ENI_ID `
  --query 'NetworkInterfaces[0].Association.PublicIp' `
  --output text

Write-Host "🌐 Backend URL: http://${PUBLIC_IP}:3001"
Write-Host "🏥 Health Check: http://${PUBLIC_IP}:3001/health"

# Probar health check
curl "http://${PUBLIC_IP}:3001/health"
```

## 📋 Paso 4: Configurar Dominio (Opcional)

### 4.1 Crear Application Load Balancer

```powershell
# Crear ALB
$ALB_ARN = aws elbv2 create-load-balancer `
  --name midatopay-test-alb `
  --subnets $SUBNET_1_ID $SUBNET_2_ID `
  --security-groups $BACKEND_SG_ID `
  --scheme internet-facing `
  --type application `
  --query 'LoadBalancers[0].LoadBalancerArn' `
  --output text

# Crear Target Group
$TG_ARN = aws elbv2 create-target-group `
  --name midatopay-test-tg `
  --protocol HTTP `
  --port 3001 `
  --vpc-id $VPC_ID `
  --target-type ip `
  --health-check-path /health `
  --query 'TargetGroups[0].TargetGroupArn' `
  --output text

# Crear Listener
aws elbv2 create-listener `
  --load-balancer-arn $ALB_ARN `
  --protocol HTTP `
  --port 80 `
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Actualizar ECS Service para usar ALB
aws ecs update-service `
  --cluster midatopay-test-cluster `
  --service midatopay-backend-test `
  --load-balancers targetGroupArn=$TG_ARN,containerName=backend,containerPort=3001

Write-Host "✅ ALB configurado"
```

### 4.2 Configurar DNS en Route 53 (si tienes dominio)

```powershell
# Obtener DNS del ALB
$ALB_DNS = aws elbv2 describe-load-balancers `
  --load-balancer-arns $ALB_ARN `
  --query 'LoadBalancers[0].DNSName' `
  --output text

Write-Host "📝 Configurar CNAME en tu DNS:"
Write-Host "api-test.midatopay.com -> $ALB_DNS"
```

## 📋 Paso 5: Configurar CloudFront (Frontend)

### 5.1 Crear Distribución CloudFront

```powershell
# Crear configuración
$CF_CONFIG = @{
    CallerReference = "midatopay-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3-midatopay-frontend-test"
                DomainName = "midatopay-frontend-test.s3.amazonaws.com"
                S3OriginConfig = @{
                    OriginAccessIdentity = ""
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-midatopay-frontend-test"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods = @{
            Quantity = 2
            Items = @("GET", "HEAD")
        }
        ForwardedValues = @{
            QueryString = $false
            Cookies = @{ Forward = "none" }
        }
        TrustedSigners = @{
            Enabled = $false
            Quantity = 0
        }
        MinTTL = 0
    }
    Comment = "MidatoPay Test Frontend"
    Enabled = $true
} | ConvertTo-Json -Depth 10

$CF_CONFIG | Out-File -FilePath cloudfront-config.json

# Crear distribución
$CF_ID = aws cloudfront create-distribution `
  --distribution-config file://cloudfront-config.json `
  --query 'Distribution.Id' `
  --output text

Write-Host "✅ CloudFront Distribution ID: $CF_ID"
Write-Host "📝 Agregar a GitHub Secrets: CLOUDFRONT_DISTRIBUTION_ID_TEST=$CF_ID"
```

## 📋 Paso 6: Prueba de Despliegue Completo

### 6.1 Hacer un cambio y deployar

```powershell
# Hacer un cambio menor
git checkout test
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: validar despliegue automático"
git push origin test

# Ver workflow ejecutarse
gh run watch
```

### 6.2 Verificar Aplicación

```powershell
# Health check
curl https://api-test.midatopay.com/health

# Ver logs
aws logs tail /ecs/midatopay-backend-test --follow --since 5m

# Ver métricas de ECS
aws ecs describe-services `
  --cluster midatopay-test-cluster `
  --services midatopay-backend-test
```

## ✅ Checklist Final

- [ ] Infraestructura AWS creada
- [ ] RDS Database funcionando
- [ ] Secrets configurados en AWS Secrets Manager
- [ ] ECR Repositories creados
- [ ] ECS Cluster y Service funcionando
- [ ] S3 Bucket configurado
- [ ] GitHub Secrets configurados
- [ ] Branch `test` creado
- [ ] Primer despliegue exitoso
- [ ] Health check funcionando
- [ ] Logs visibles en CloudWatch
- [ ] CloudFront configurado (opcional)
- [ ] ALB configurado (opcional)
- [ ] DNS configurado (opcional)

## 🎉 ¡Ambiente TEST Configurado!

Tu ambiente de TEST está listo. Ahora puedes:

1. **Desarrollar localmente**
2. **Push a branch `test`**
3. **Despliegue automático a TEST**
4. **Verificar en ambiente TEST**
5. **Repetir proceso para DEV y PROD**

## 📞 Troubleshooting

### Problema: Workflow falla en build

**Solución:**
```powershell
# Verificar permisos de ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Problema: ECS Task no inicia

**Solución:**
```powershell
# Ver logs del task
aws logs tail /ecs/midatopay-backend-test --follow

# Ver eventos del servicio
aws ecs describe-services `
  --cluster midatopay-test-cluster `
  --services midatopay-backend-test `
  --query 'services[0].events[0:5]'
```

### Problema: Health check falla

**Solución:**
```powershell
# Verificar que el backend expone /health
# Verificar security groups permiten tráfico
# Verificar logs del contenedor
```

## 📚 Siguiente Pasos

1. ✅ Replicar configuración para ambiente **DEV**
2. ✅ Replicar configuración para ambiente **PROD**
3. ✅ Configurar monitoreo con CloudWatch
4. ✅ Configurar alertas con SNS
5. ✅ Configurar backup automatizado

## 🔗 Enlaces Útiles

- [Workflows](.github/workflows/README.md)
- [Infraestructura](infrastructure/aws/README.md)
- [Testing](tests/security/)
- [AWS Console](https://console.aws.amazon.com)
- [GitHub Actions](https://github.com/MidatoPay/midatopay/actions)
