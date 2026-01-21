# GitHub Secrets - Configuración para MidatoPay

## 🔗 URL de Configuración
https://github.com/juanmaone/midatopay/settings/secrets/actions

---

## 🔑 Secrets Requeridos para Ambiente TEST

### AWS Credentials (Obligatorios)
```
AWS_ACCOUNT_ID
566287346792

AWS_REGION
us-east-1

AWS_ACCESS_KEY_ID
[Tu Access Key ID de AWS]

AWS_SECRET_ACCESS_KEY
[Tu Secret Access Key de AWS]
```

### Network Configuration (TEST)
```
SUBNET_IDS_TEST
subnet-0afee9660fcd83ff7,subnet-0654ffa73756fffd3

SECURITY_GROUP_ID_TEST
sg-0d91217331e4c3af8

FRONTEND_BUCKET_TEST
midatopay-frontend-test
```

### Starknet Configuration (Opcional - ya está en AWS Secrets Manager)
```
STARKNET_PRIVATE_KEY_TEST
[Si quieres usar un valor diferente al del Secret]
```

---

## ✅ Verificación Rápida

Después de configurar los secrets, ejecuta:
```powershell
.\scripts\validate-setup.ps1 -Environment test
```

---

## 🚀 Activar Primer Deployment

Una vez configurados los secrets, cualquier push al branch `test` activará automáticamente el workflow de deployment:

```bash
git checkout test
git commit --allow-empty -m "Trigger first deployment"
git push origin test
```

---

## 📝 Notas Importantes

1. **AWS Secrets Manager**: La configuración de la aplicación (DATABASE_URL, JWT_SECRET, etc.) ya está almacenada en:
   - Secret Name: `midatopay-test-backend`
   - ARN: `arn:aws:secretsmanager:us-east-1:566287346792:secret:midatopay-test-backend-BocomI`

2. **RDS Database**: 
   - Endpoint: `midatopay-test-db.cmnqeqc6yw6o.us-east-1.rds.amazonaws.com`
   - Usuario: `midatoadmin`
   - Password: Ya configurada en Secrets Manager ✓

3. **Task Definitions**: Ya actualizados con el Account ID y Secret ARN correcto.

4. **IAM Roles**: `ecsTaskExecutionRole` y `ecsTaskRole` ya creados.

---

## 🔄 Para Ambientes DEV y PROD

Cuando quieras configurar DEV o PROD, ejecuta:
```powershell
# Para DEV
.\infrastructure\aws\setup-infrastructure.ps1  # Cambiar ENVIRONMENT a "dev"
.\scripts\create-secrets.ps1 -Environment dev

# Para PROD  
.\infrastructure\aws\setup-infrastructure.ps1  # Cambiar ENVIRONMENT a "prod"
.\scripts\create-secrets.ps1 -Environment prod
```

Y agrega los secrets correspondientes:
- `SUBNET_IDS_DEV`, `SUBNET_IDS_PROD`
- `SECURITY_GROUP_ID_DEV`, `SECURITY_GROUP_ID_PROD`
- `FRONTEND_BUCKET_DEV`, `FRONTEND_BUCKET_PROD`
