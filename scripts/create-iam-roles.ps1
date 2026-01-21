#!/usr/bin/env pwsh
# Script para crear IAM Roles necesarios para ECS
# Uso: .\scripts\create-iam-roles.ps1

$ErrorActionPreference = "Continue"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Creando IAM Roles para ECS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 1. Crear ecsTaskExecutionRole
Write-Host "1. Creando ecsTaskExecutionRole..." -ForegroundColor Yellow

$trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@

# Guardar trust policy en archivo temporal
$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding utf8

# Crear el rol
$createRoleResult = aws iam create-role `
    --role-name ecsTaskExecutionRole `
    --assume-role-policy-document file://trust-policy.json `
    --description "ECS Task Execution Role" `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ecsTaskExecutionRole creado" -ForegroundColor Green
} else {
    if ($createRoleResult -like "*EntityAlreadyExists*") {
        Write-Host "   ℹ️  ecsTaskExecutionRole ya existe" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Error: $createRoleResult" -ForegroundColor Red
    }
}

# Adjuntar políticas administradas
Write-Host "   Adjuntando políticas administradas..." -ForegroundColor Gray
aws iam attach-role-policy `
    --role-name ecsTaskExecutionRole `
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy | Out-Null

aws iam attach-role-policy `
    --role-name ecsTaskExecutionRole `
    --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite | Out-Null

Write-Host "   ✅ Políticas adjuntadas" -ForegroundColor Green

# 2. Crear ecsTaskRole
Write-Host "`n2. Creando ecsTaskRole..." -ForegroundColor Yellow

$createTaskRoleResult = aws iam create-role `
    --role-name ecsTaskRole `
    --assume-role-policy-document file://trust-policy.json `
    --description "ECS Task Role for application" `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ecsTaskRole creado" -ForegroundColor Green
} else {
    if ($createTaskRoleResult -like "*EntityAlreadyExists*") {
        Write-Host "   ℹ️  ecsTaskRole ya existe" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Error: $createTaskRoleResult" -ForegroundColor Red
    }
}

# Crear política personalizada para el task role
$taskRolePolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::midatopay-*/*",
        "arn:aws:s3:::midatopay-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:midatopay-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/midatopay-*"
    }
  ]
}
'@

$taskRolePolicy | Out-File -FilePath "task-role-policy.json" -Encoding utf8

# Crear la política
Write-Host "   Creando política personalizada..." -ForegroundColor Gray
$createPolicyResult = aws iam create-policy `
    --policy-name MidatoPayTaskRolePolicy `
    --policy-document file://task-role-policy.json `
    --description "Custom policy for MidatoPay ECS tasks" `
    2>&1

if ($LASTEXITCODE -eq 0) {
    $policyArn = ($createPolicyResult | ConvertFrom-Json).Policy.Arn
    Write-Host "   ✅ Política creada: $policyArn" -ForegroundColor Green
} else {
    if ($createPolicyResult -like "*EntityAlreadyExists*") {
        Write-Host "   ℹ️  Política ya existe" -ForegroundColor Yellow
        # Obtener el ARN de la cuenta
        $accountId = (aws sts get-caller-identity --query Account --output text)
        $policyArn = "arn:aws:iam::${accountId}:policy/MidatoPayTaskRolePolicy"
    } else {
        Write-Host "   ❌ Error: $createPolicyResult" -ForegroundColor Red
    }
}

# Adjuntar la política al rol
if ($policyArn) {
    Write-Host "   Adjuntando política al rol..." -ForegroundColor Gray
    aws iam attach-role-policy `
        --role-name ecsTaskRole `
        --policy-arn $policyArn | Out-Null
    Write-Host "   ✅ Política adjuntada" -ForegroundColor Green
}

# Limpiar archivos temporales
Remove-Item -Path "trust-policy.json" -ErrorAction SilentlyContinue
Remove-Item -Path "task-role-policy.json" -ErrorAction SilentlyContinue

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ IAM Roles creados exitosamente" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📝 Roles creados:" -ForegroundColor Yellow
Write-Host "   • ecsTaskExecutionRole - Para ejecutar tareas ECS" -ForegroundColor White
Write-Host "   • ecsTaskRole - Para acceso a recursos AWS desde la aplicación" -ForegroundColor White

Write-Host "`n💡 Próximo paso:" -ForegroundColor Cyan
Write-Host "   Ejecutar: .\scripts\validate-setup.ps1 -Environment test" -ForegroundColor White
