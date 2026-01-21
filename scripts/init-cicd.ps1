#!/usr/bin/env pwsh
# Script de inicialización rápida para ambiente TEST
# Este script te guía paso a paso en la configuración inicial

param(
    [switch]$SkipAWS,
    [switch]$SkipGitHub,
    [switch]$AutoMode
)

$ErrorActionPreference = "Stop"

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Step { Write-Host "`n$($args[0])" -ForegroundColor Magenta }

Clear-Host

Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "   🚀 MidatoPay - Configuración Inicial CI/CD"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Verificar ubicación
$currentPath = Get-Location
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Error "❌ Por favor ejecuta este script desde la raíz del proyecto"
    exit 1
}

Write-Success "✅ Ubicación correcta: $currentPath`n"

# ============================================
# PASO 0: Verificar Pre-requisitos
# ============================================
Write-Step "📋 PASO 0: Verificando Pre-requisitos"

$prerequisites = @{
    "AWS CLI" = { aws --version 2>&1 }
    "Git" = { git --version }
    "Node.js" = { node --version }
    "npm" = { npm --version }
}

$allPrereqsOk = $true
foreach ($prereq in $prerequisites.GetEnumerator()) {
    try {
        $version = & $prereq.Value
        Write-Success "   ✅ $($prereq.Key): $version"
    } catch {
        Write-Error "   ❌ $($prereq.Key) no encontrado"
        $allPrereqsOk = $false
    }
}

if (-not $allPrereqsOk) {
    Write-Error "`n❌ Faltan pre-requisitos. Por favor instala las herramientas faltantes."
    exit 1
}

# ============================================
# PASO 1: AWS Setup
# ============================================
if (-not $SkipAWS) {
    Write-Step "🔧 PASO 1: Configuración AWS"
    
    Write-Info "Verificando credenciales AWS..."
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Success "✅ Conectado a AWS como: $($identity.Arn)"
        Write-Info "   Account ID: $($identity.Account)"
        
        $awsAccountId = $identity.Account
        
        if (-not $AutoMode) {
            $continue = Read-Host "`n¿Continuar con esta cuenta AWS? (y/n)"
            if ($continue -ne "y") {
                Write-Warning "Configuración cancelada. Ejecuta 'aws configure' para cambiar de cuenta."
                exit 0
            }
        }
    } catch {
        Write-Error "❌ No se pudo conectar a AWS"
        Write-Info "Por favor ejecuta: aws configure"
        exit 1
    }
    
    # Preguntar si crear infraestructura
    if (-not $AutoMode) {
        Write-Info "`n¿Deseas crear la infraestructura AWS ahora?"
        Write-Info "Esto incluye: VPC, Subnets, Security Groups, ECR, S3, ECS, etc."
        $createInfra = Read-Host "(y/n)"
        
        if ($createInfra -eq "y") {
            Write-Info "`nEjecutando script de infraestructura..."
            & ".\infrastructure\aws\setup-infrastructure.ps1"
            
            Write-Success "`n✅ Infraestructura base creada"
            Write-Warning "⚠️  IMPORTANTE: Guarda los IDs generados para GitHub Secrets"
            
            if (-not $AutoMode) {
                Read-Host "Presiona Enter cuando hayas guardado los IDs..."
            }
        }
    }
    
    # Actualizar Task Definitions con Account ID
    Write-Info "`nActualizando Task Definitions con Account ID..."
    
    $files = @(
        "infrastructure\aws\ecs-task-definition-test.json",
        "infrastructure\aws\ecs-task-definition-dev.json",
        "infrastructure\aws\ecs-task-definition-prod.json"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            if ($content -match "ACCOUNT_ID") {
                $content = $content -replace "ACCOUNT_ID", $awsAccountId
                Set-Content $file $content
                Write-Success "   ✅ Actualizado: $file"
            }
        }
    }
}

# ============================================
# PASO 2: GitHub Setup
# ============================================
if (-not $SkipGitHub) {
    Write-Step "🐙 PASO 2: Configuración GitHub"
    
    # Verificar Git
    try {
        $gitRemote = git remote get-url origin
        Write-Success "✅ Repositorio: $gitRemote"
    } catch {
        Write-Error "❌ No se encontró repositorio Git"
        exit 1
    }
    
    # Verificar branch actual
    $currentBranch = git branch --show-current
    Write-Info "Branch actual: $currentBranch"
    
    # Crear branches si no existen
    Write-Info "`nVerificando branches..."
    
    $branches = @("dev", "test")
    foreach ($branch in $branches) {
        $exists = git branch --list $branch
        if (-not $exists) {
            if (-not $AutoMode) {
                $create = Read-Host "Branch '$branch' no existe. ¿Crear? (y/n)"
                if ($create -eq "y") {
                    git checkout -b $branch
                    git push -u origin $branch
                    Write-Success "   ✅ Branch '$branch' creado"
                }
            }
        } else {
            Write-Success "   ✅ Branch '$branch' existe"
        }
    }
    
    # Volver a branch original
    git checkout $currentBranch
    
    # Información de GitHub Secrets
    Write-Info "`n📝 Configurar GitHub Secrets:"
    Write-Info "   1. Ve a: https://github.com/MidatoPay/midatopay/settings/secrets/actions"
    Write-Info "   2. Agrega los siguientes secrets:"
    Write-Info ""
    Write-Info "   Globales:"
    Write-Info "   - AWS_ACCOUNT_ID=$awsAccountId"
    Write-Info "   - AWS_REGION=us-east-1"
    Write-Info "   - AWS_ACCESS_KEY_ID=(del IAM user)"
    Write-Info "   - AWS_SECRET_ACCESS_KEY=(del IAM user)"
    Write-Info ""
    Write-Info "   TEST Environment:"
    Write-Info "   - DATABASE_URL_TEST=(RDS endpoint)"
    Write-Info "   - STARKNET_PRIVATE_KEY_TEST=(tu clave)"
    Write-Info "   - FRONTEND_BUCKET_TEST=midatopay-frontend-test"
    Write-Info "   - SUBNET_IDS_TEST=(subnet-xxx,subnet-yyy)"
    Write-Info "   - SECURITY_GROUP_ID_TEST=(sg-xxx)"
    Write-Info ""
    
    if (-not $AutoMode) {
        Read-Host "Presiona Enter cuando hayas configurado los secrets..."
    }
}

# ============================================
# PASO 3: Validación
# ============================================
Write-Step "✅ PASO 3: Validación"

Write-Info "Ejecutando validación de setup..."

if (Test-Path "scripts\validate-setup.ps1") {
    & ".\scripts\validate-setup.ps1" -Environment test
} else {
    Write-Warning "⚠️  Script de validación no encontrado"
}

# ============================================
# PASO 4: Commit y Push
# ============================================
Write-Step "📤 PASO 4: Commit de archivos"

$hasChanges = git status --porcelain
if ($hasChanges) {
    Write-Info "Cambios detectados en el repositorio"
    
    if (-not $AutoMode) {
        $commit = Read-Host "¿Hacer commit y push de los cambios? (y/n)"
        if ($commit -eq "y") {
            git add .
            git commit -m "feat: configurar CI/CD para ambientes test, dev, prod"
            git push
            Write-Success "✅ Cambios enviados al repositorio"
        }
    }
} else {
    Write-Info "No hay cambios pendientes"
}

# ============================================
# PASO 5: Primer Deploy
# ============================================
Write-Step "🚀 PASO 5: Primer Deploy"

if (-not $AutoMode) {
    Write-Info "`n¿Deseas iniciar el primer deploy al ambiente TEST?"
    Write-Info "Esto hará push al branch 'test' y activará el workflow"
    $deploy = Read-Host "(y/n)"
    
    if ($deploy -eq "y") {
        Write-Info "`nCambiando a branch test..."
        git checkout test
        git pull origin test
        
        # Hacer un pequeño cambio para trigger
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "# Last deployed: $timestamp" | Out-File -FilePath ".deploy-timestamp" -Append
        
        git add .
        git commit -m "deploy: trigger primer despliegue a TEST"
        git push origin test
        
        Write-Success "`n✅ Deploy iniciado!"
        Write-Info "Ver progreso en: https://github.com/MidatoPay/midatopay/actions"
        
        # Volver a branch original
        git checkout $currentBranch
    }
}

# ============================================
# Resumen Final
# ============================================
Write-Info "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "   ✅ Configuración Completada!"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Info "📚 Documentación:"
Write-Info "   - Guía Completa: SETUP_TEST_ENVIRONMENT.md"
Write-Info "   - Quick Start: QUICK_START.md"
Write-Info "   - Archivos Creados: FILES_CREATED.md"
Write-Info ""
Write-Info "🔗 Links Útiles:"
Write-Info "   - GitHub Actions: https://github.com/MidatoPay/midatopay/actions"
Write-Info "   - AWS Console: https://console.aws.amazon.com"
Write-Info "   - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch"
Write-Info ""
Write-Info "📋 Próximos Pasos:"
Write-Info "   1. Verificar despliegue en GitHub Actions"
Write-Info "   2. Verificar salud de servicios en AWS"
Write-Info "   3. Probar endpoints: curl https://api-test.midatopay.com/health"
Write-Info "   4. Replicar para ambientes DEV y PROD"
Write-Info ""

Write-Success "🎉 ¡Todo listo para comenzar a desplegar!`n"
