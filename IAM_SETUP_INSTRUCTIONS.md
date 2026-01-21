# Instrucciones para Administrador AWS

## ⚠️ Permisos Requeridos

El usuario `martinf` (arn:aws:iam::566287346792:user/martinf) necesita permisos adicionales para completar el setup de CI/CD.

## Opción 1: Ejecutar Script con Usuario Administrador

El administrador puede ejecutar este script para crear los roles necesarios:

```powershell
.\scripts\create-iam-roles.ps1
```

## Opción 2: Crear Roles Manualmente en AWS Console

### 1. Crear ecsTaskExecutionRole

1. Ir a IAM Console → Roles → Create Role
2. **Trusted entity type**: AWS service
3. **Use case**: Elastic Container Service → Elastic Container Service Task
4. **Permissions policies**:
   - `AmazonECSTaskExecutionRolePolicy` (AWS managed)
   - `SecretsManagerReadWrite` (AWS managed)
5. **Role name**: `ecsTaskExecutionRole`
6. **Description**: ECS Task Execution Role
7. Click "Create role"

### 2. Crear ecsTaskRole

1. Ir a IAM Console → Roles → Create Role
2. **Trusted entity type**: AWS service
3. **Use case**: Elastic Container Service → Elastic Container Service Task
4. En la página de permisos, click "Create policy" (se abre en nueva pestaña):
   - Click en tab "JSON"
   - Pegar esta política:

```json
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
```

   - **Policy name**: `MidatoPayTaskRolePolicy`
   - Click "Create policy"

5. Volver a la pestaña de crear rol y refrescar las políticas
6. Buscar y seleccionar `MidatoPayTaskRolePolicy`
7. **Role name**: `ecsTaskRole`
8. **Description**: ECS Task Role for application
9. Click "Create role"

## Opción 3: Otorgar Permisos IAM al Usuario

Adjuntar esta política al usuario `martinf` para permitirle crear roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PutRolePolicy",
        "iam:CreatePolicy",
        "iam:GetRole",
        "iam:GetPolicy",
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::566287346792:role/ecsTaskExecutionRole",
        "arn:aws:iam::566287346792:role/ecsTaskRole",
        "arn:aws:iam::566287346792:policy/MidatoPayTaskRolePolicy"
      ]
    }
  ]
}
```

## Verificación

Una vez creados los roles, verificar ejecutando:

```powershell
.\scripts\validate-setup.ps1 -Environment test
```

Debería mostrar ✅ para "Verificando IAM Roles"

## Roles Necesarios - Resumen

| Role | ARN | Propósito |
|------|-----|-----------|
| ecsTaskExecutionRole | arn:aws:iam::566287346792:role/ecsTaskExecutionRole | Permite a ECS ejecutar tareas, obtener imágenes de ECR y leer secrets |
| ecsTaskRole | arn:aws:iam::566287346792:role/ecsTaskRole | Permite a la aplicación acceder a S3, Secrets Manager y RDS |

## Siguiente Paso

Una vez creados los roles, continuar con:

```powershell
# 1. Validar setup
.\scripts\validate-setup.ps1 -Environment test

# 2. Configurar GitHub Secrets
# Ver: SETUP_TEST_ENVIRONMENT.md - Fase 2

# 3. Crear branch test y hacer push
git checkout -b test
git push -u origin test
```
