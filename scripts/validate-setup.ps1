#!/usr/bin/env pwsh
# Script de validación de configuración para ambiente TEST
# Verifica que todos los requisitos estén configurados correctamente

param(
    [string]$Environment = "test"
)

$ErrorActionPreference = "Continue"

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

$checks = @{
    passed = 0
    failed = 0
    warnings = 0
}

Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "🔍 Validando configuración para ambiente: $Environment"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# 1. Verificar AWS CLI
Write-Info "1. Verificando AWS CLI..."
try {
    $awsVersion = aws --version 2>&1
    Write-Success "   ✅ AWS CLI instalado: $awsVersion"
    $checks.passed++
} catch {
    Write-Error "   ❌ AWS CLI no encontrado"
    $checks.failed++
}

# 2. Verificar credenciales AWS
Write-Info "`n2. Verificando credenciales AWS..."
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "   ✅ Credenciales configuradas"
    Write-Info "      Account: $($identity.Account)"
    Write-Info "      User: $($identity.Arn)"
    $checks.passed++
} catch {
    Write-Error "   ❌ Credenciales AWS no configuradas"
    $checks.failed++
}

# 3. Verificar ECR Repositories
Write-Info "`n3. Verificando ECR Repositories..."
try {
    $repos = aws ecr describe-repositories --query 'repositories[?contains(repositoryName, `midatopay`)].repositoryName' --output json | ConvertFrom-Json
    if ($repos.Count -ge 2) {
        Write-Success "   ✅ Repositories encontrados: $($repos -join ', ')"
        $checks.passed++
    } else {
        Write-Warning "   ⚠️  Solo $($repos.Count) repositories encontrados"
        $checks.warnings++
    }
} catch {
    Write-Error "   ❌ Error verificando ECR"
    $checks.failed++
}

# 4. Verificar VPC
Write-Info "`n4. Verificando VPC..."
try {
    $vpcs = aws ec2 describe-vpcs --filters "Name=tag:Name,Values=midatopay-$Environment-vpc" --query 'Vpcs[0].VpcId' --output text
    if ($vpcs -and $vpcs -ne "None") {
        Write-Success "   ✅ VPC encontrada: $vpcs"
        $checks.passed++
    } else {
        Write-Error "   ❌ VPC no encontrada"
        $checks.failed++
    }
} catch {
    Write-Error "   ❌ Error verificando VPC"
    $checks.failed++
}

# 5. Verificar Subnets
Write-Info "`n5. Verificando Subnets..."
try {
    $subnets = aws ec2 describe-subnets --filters "Name=tag:Name,Values=midatopay-$Environment-*" --query 'Subnets[].SubnetId' --output json | ConvertFrom-Json
    if ($subnets.Count -ge 2) {
        Write-Success "   ✅ Subnets encontradas: $($subnets.Count)"
        $checks.passed++
    } else {
        Write-Warning "   ⚠️  Solo $($subnets.Count) subnets encontradas (se recomiendan 2)"
        $checks.warnings++
    }
} catch {
    Write-Error "   ❌ Error verificando Subnets"
    $checks.failed++
}

# 6. Verificar Security Groups
Write-Info "`n6. Verificando Security Groups..."
try {
    $sgs = aws ec2 describe-security-groups --filters "Name=group-name,Values=midatopay-$Environment-*" --query 'SecurityGroups[].GroupId' --output json | ConvertFrom-Json
    if ($sgs.Count -ge 2) {
        Write-Success "   ✅ Security Groups encontrados: $($sgs.Count)"
        $checks.passed++
    } else {
        Write-Warning "   ⚠️  Solo $($sgs.Count) security groups encontrados"
        $checks.warnings++
    }
} catch {
    Write-Error "   ❌ Error verificando Security Groups"
    $checks.failed++
}

# 7. Verificar ECS Cluster
Write-Info "`n7. Verificando ECS Cluster..."
try {
    $cluster = aws ecs describe-clusters --clusters "midatopay-$Environment-cluster" --query 'clusters[0].status' --output text
    if ($cluster -eq "ACTIVE") {
        Write-Success "   ✅ ECS Cluster activo"
        $checks.passed++
    } else {
        Write-Error "   ❌ ECS Cluster no activo"
        $checks.failed++
    }
} catch {
    Write-Error "   ❌ Error verificando ECS Cluster"
    $checks.failed++
}

# 8. Verificar ECS Service
Write-Info "`n8. Verificando ECS Service..."
try {
    $service = aws ecs describe-services --cluster "midatopay-$Environment-cluster" --services "midatopay-backend-$Environment" --query 'services[0].status' --output text
    if ($service -eq "ACTIVE") {
        Write-Success "   ✅ ECS Service activo"
        $checks.passed++
        
        # Verificar running count
        $runningCount = aws ecs describe-services --cluster "midatopay-$Environment-cluster" --services "midatopay-backend-$Environment" --query 'services[0].runningCount' --output text
        Write-Info "      Running tasks: $runningCount"
    } else {
        Write-Warning "   ⚠️  ECS Service no activo"
        $checks.warnings++
    }
} catch {
    Write-Error "   ❌ Error verificando ECS Service"
    $checks.failed++
}

# 9. Verificar RDS
Write-Info "`n9. Verificando RDS..."
try {
    $rds = aws rds describe-db-instances --db-instance-identifier "midatopay-$Environment-db" --query 'DBInstances[0].DBInstanceStatus' --output text
    if ($rds -eq "available") {
        Write-Success "   ✅ RDS Database disponible"
        $endpoint = aws rds describe-db-instances --db-instance-identifier "midatopay-$Environment-db" --query 'DBInstances[0].Endpoint.Address' --output text
        Write-Info "      Endpoint: $endpoint"
        $checks.passed++
    } else {
        Write-Warning "   ⚠️  RDS Database status: $rds"
        $checks.warnings++
    }
} catch {
    Write-Error "   ❌ RDS Database no encontrada"
    $checks.failed++
}

# 10. Verificar S3 Bucket
Write-Info "`n10. Verificando S3 Bucket..."
try {
    $bucket = "midatopay-frontend-$Environment"
    aws s3 ls "s3://$bucket" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "   ✅ S3 Bucket existe: $bucket"
        $checks.passed++
    } else {
        Write-Error "   ❌ S3 Bucket no encontrado: $bucket"
        $checks.failed++
    }
} catch {
    Write-Error "   ❌ Error verificando S3 Bucket"
    $checks.failed++
}

# 11. Verificar Secrets Manager
Write-Info "`n11. Verificando AWS Secrets Manager..."
try {
    $secret = aws secretsmanager describe-secret --secret-id "midatopay/$Environment/backend" --query 'Name' --output text
    if ($secret) {
        Write-Success "   ✅ Secrets configurados: $secret"
        $checks.passed++
    } else {
        Write-Error "   ❌ Secrets no encontrados"
        $checks.failed++
    }
} catch {
    Write-Error "   ❌ Error verificando Secrets"
    $checks.failed++
}

# 12. Verificar IAM Roles
Write-Info "`n12. Verificando IAM Roles..."
try {
    $executionRole = aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.RoleName' --output text 2>$null
    $taskRole = aws iam get-role --role-name ecsTaskRole --query 'Role.RoleName' --output text 2>$null
    
    if ($executionRole -and $taskRole) {
        Write-Success "   ✅ IAM Roles configurados"
        $checks.passed++
    } else {
        Write-Warning "   ⚠️  Algunos IAM Roles faltan"
        $checks.warnings++
    }
} catch {
    Write-Warning "   ⚠️  Error verificando IAM Roles"
    $checks.warnings++
}

# 13. Verificar GitHub Workflows
Write-Info "`n13. Verificando GitHub Workflows..."
if (Test-Path ".github/workflows/deploy-$Environment.yml") {
    Write-Success "   ✅ Workflow file existe: deploy-$Environment.yml"
    $checks.passed++
} else {
    Write-Error "   ❌ Workflow file no encontrado"
    $checks.failed++
}

# 14. Verificar Task Definition
Write-Info "`n14. Verificando Task Definition..."
if (Test-Path "infrastructure/aws/ecs-task-definition-$Environment.json") {
    Write-Success "   ✅ Task Definition existe"
    
    # Verificar que no tenga placeholders
    $content = Get-Content "infrastructure/aws/ecs-task-definition-$Environment.json" -Raw
    if ($content -match "ACCOUNT_ID") {
        Write-Warning "   ⚠️  Task Definition contiene placeholders"
        $checks.warnings++
    } else {
        $checks.passed++
    }
} else {
    Write-Error "   ❌ Task Definition no encontrada"
    $checks.failed++
}

# 15. Verificar Git Branch
Write-Info "`n15. Verificando Git Branch..."
try {
    $branch = git branch -r | Select-String "origin/$Environment"
    if ($branch) {
        Write-Success "   ✅ Branch '$Environment' existe en remote"
        $checks.passed++
    } else {
        Write-Warning "   ⚠️  Branch '$Environment' no existe en remote"
        $checks.warnings++
    }
} catch {
    Write-Warning "   ⚠️  No se pudo verificar branch"
    $checks.warnings++
}

# 16. Verificar Node.js
Write-Info "`n16. Verificando Node.js..."
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Success "   ✅ Node.js: $nodeVersion | npm: $npmVersion"
    $checks.passed++
} catch {
    Write-Warning "   ⚠️  Node.js no encontrado"
    $checks.warnings++
}

# 17. Verificar dependencias
Write-Info "`n17. Verificando package.json..."
$packageFiles = @(
    "backend/package.json",
    "frontend/package.json"
)

$allExist = $true
foreach ($file in $packageFiles) {
    if (Test-Path $file) {
        Write-Success "   ✅ $file existe"
    } else {
        Write-Error "   ❌ $file no encontrado"
        $allExist = $false
    }
}

if ($allExist) {
    $checks.passed++
} else {
    $checks.failed++
}

# Resumen
Write-Info "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "📊 Resumen de Validación"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Success "✅ Checks Pasados: $($checks.passed)"
if ($checks.warnings -gt 0) {
    Write-Warning "⚠️  Advertencias: $($checks.warnings)"
}
if ($checks.failed -gt 0) {
    Write-Error "❌ Checks Fallidos: $($checks.failed)"
}

$total = $checks.passed + $checks.failed + $checks.warnings
$percentage = [math]::Round(($checks.passed / $total) * 100, 2)

Write-Info "`nPorcentaje de completitud: $percentage%"

if ($checks.failed -eq 0) {
    Write-Success "`n🎉 ¡Configuración lista para desplegar!"
    exit 0
} elseif ($checks.failed -le 3) {
    Write-Warning "`n⚠️  Configuración casi completa. Revisar checks fallidos."
    exit 0
} else {
    Write-Error "`n❌ Configuración incompleta. Completar los checks fallidos antes de desplegar."
    exit 1
}
