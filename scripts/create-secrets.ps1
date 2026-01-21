#!/usr/bin/env pwsh
# Script para crear secrets en AWS Secrets Manager
# Uso: .\scripts\create-secrets.ps1 -Environment test

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment
)

$ErrorActionPreference = "Continue"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Creando AWS Secrets para ambiente: $Environment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Función para crear o actualizar secret
function Set-AWSSecret {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Description
    )
    
    $secretName = "midatopay-$Environment-$Name"
    
    Write-Host "Creando secret: $secretName..." -ForegroundColor Yellow
    
    # Intentar crear el secret
    $createResult = aws secretsmanager create-secret `
        --name $secretName `
        --description $Description `
        --secret-string $Value `
        2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Secret creado exitosamente" -ForegroundColor Green
    } else {
        # Si ya existe, actualizarlo
        if ($createResult -like "*ResourceExistsException*") {
            Write-Host "   ℹ️  Secret ya existe, actualizando..." -ForegroundColor Yellow
            aws secretsmanager put-secret-value `
                --secret-id $secretName `
                --secret-string $Value | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Secret actualizado exitosamente" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Error actualizando secret" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Error: $createResult" -ForegroundColor Red
        }
    }
}

# Leer variables del archivo .env si existe
$envFile = "backend\.env"
if (Test-Path $envFile) {
    Write-Host "📄 Leyendo configuración de $envFile...`n" -ForegroundColor Cyan
}

# Solicitar información al usuario
Write-Host "Por favor proporciona los valores para los secrets:" -ForegroundColor Yellow
Write-Host "(Presiona Enter para usar valores por defecto cuando aplique)`n" -ForegroundColor Gray

# Database URL
Write-Host "DATABASE_URL (ejemplo: postgresql://user:pass@host:5432/db)" -ForegroundColor Cyan
$dbUrl = Read-Host "Valor"
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    $dbUrl = "postgresql://midatopay:CHANGE_ME@midatopay-$Environment-db.cmnqeqc6yw6o.us-east-1.rds.amazonaws.com:5432/midatopay"
}

# JWT Secret
Write-Host "`nJWT_SECRET (dejar vacío para generar automáticamente)" -ForegroundColor Cyan
$jwtSecret = Read-Host "Valor"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    # Generar JWT secret aleatorio
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "   ℹ️  JWT Secret generado automáticamente" -ForegroundColor Yellow
}

# Starknet Private Key
Write-Host "`nSTARKNET_PRIVATE_KEY (sin prefijo 0x)" -ForegroundColor Cyan
$starknetKey = Read-Host "Valor"
if ([string]::IsNullOrWhiteSpace($starknetKey)) {
    $starknetKey = "CHANGE_ME_STARKNET_PRIVATE_KEY"
    Write-Host "   ⚠️  Usando placeholder - DEBES cambiarlo después" -ForegroundColor Yellow
}

# Cavos API Secret
Write-Host "`nCAVOS_API_SECRET" -ForegroundColor Cyan
$cavosSecret = Read-Host "Valor"
if ([string]::IsNullOrWhiteSpace($cavosSecret)) {
    $cavosSecret = "CHANGE_ME_CAVOS_API_SECRET"
    Write-Host "   ⚠️  Usando placeholder - DEBES cambiarlo después" -ForegroundColor Yellow
}

# Clerk Secret Key
Write-Host "`nCLERK_SECRET_KEY" -ForegroundColor Cyan
$clerkSecret = Read-Host "Valor"
if ([string]::IsNullOrWhiteSpace($clerkSecret)) {
    $clerkSecret = "CHANGE_ME_CLERK_SECRET_KEY"
    Write-Host "   ⚠️  Usando placeholder - DEBES cambiarlo después" -ForegroundColor Yellow
}

# Crear JSON con todos los secrets para el backend
$backendSecrets = @{
    DATABASE_URL = $dbUrl
    JWT_SECRET = $jwtSecret
    JWT_EXPIRES_IN = "7d"
    NODE_ENV = if ($Environment -eq "prod") { "production" } else { "development" }
    PORT = "3001"
    FRONTEND_URL = if ($Environment -eq "prod") { "https://midatopay.com" } else { "https://$Environment.midatopay.com" }
    STARKNET_PRIVATE_KEY = $starknetKey
    STARKNET_RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/YOUR_ALCHEMY_KEY"
    CAVOS_APP_ID = "app-a5b17a105d604090e051a297a8fad33d"
    CAVOS_API_SECRET = $cavosSecret
    CLERK_SECRET_KEY = $clerkSecret
    CLERK_JWKS_URL = "https://teaching-oryx-11.clerk.accounts.dev/.well-known/jwks.json"
    USDT_DECIMALS = "6"
    WS_PORT = "3002"
    RATE_LIMIT_WINDOW_MS = "900000"
    RATE_LIMIT_MAX_REQUESTS = "100"
} | ConvertTo-Json -Compress

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Creando secrets en AWS Secrets Manager..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Crear el secret principal con todas las variables
$secretName = "midatopay-$Environment-backend"
Write-Host "Creando secret: $secretName..." -ForegroundColor Yellow

$createResult = aws secretsmanager create-secret `
    --name $secretName `
    --description "Backend environment variables for MidatoPay $Environment" `
    --secret-string $backendSecrets `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Secret creado exitosamente" -ForegroundColor Green
    $secretArn = ($createResult | ConvertFrom-Json).ARN
    Write-Host "   ARN: $secretArn" -ForegroundColor Gray
} else {
    if ($createResult -like "*ResourceExistsException*") {
        Write-Host "   ℹ️  Secret ya existe, actualizando..." -ForegroundColor Yellow
        aws secretsmanager put-secret-value `
            --secret-id $secretName `
            --secret-string $backendSecrets | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Secret actualizado exitosamente" -ForegroundColor Green
            $describeResult = aws secretsmanager describe-secret --secret-id $secretName | ConvertFrom-Json
            $secretArn = $describeResult.ARN
            Write-Host "   ARN: $secretArn" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Error: $createResult" -ForegroundColor Red
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📝 Información para GitHub Secrets:`n" -ForegroundColor Yellow
Write-Host "   AWS_SECRETS_ARN_$($Environment.ToUpper())=$secretArn" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "   1. Actualiza los placeholders (CHANGE_ME_*) en AWS Secrets Manager" -ForegroundColor Yellow
Write-Host "   2. Agrega el ARN a GitHub Secrets" -ForegroundColor Yellow
Write-Host "   3. Actualiza el Task Definition con el ARN correcto" -ForegroundColor Yellow

Write-Host "`n💡 Para actualizar un secret:" -ForegroundColor Cyan
Write-Host "   aws secretsmanager put-secret-value --secret-id $secretName --secret-string '{""KEY"":""VALUE""}'" -ForegroundColor White

Write-Host "`n💡 Para ver el secret:" -ForegroundColor Cyan
Write-Host "   aws secretsmanager get-secret-value --secret-id $secretName --query SecretString --output text" -ForegroundColor White
