# AWS Infrastructure Setup Script
# Este script ayuda a configurar la infraestructura base en AWS

# Variables de configuración
$AWS_REGION = "us-east-1"
$PROJECT_NAME = "midatopay"
$ENVIRONMENT = "test"  # Cambiar según ambiente: test, dev, prod

# Colores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "🚀 Configurando infraestructura AWS para $PROJECT_NAME-$ENVIRONMENT"

# 1. Crear VPC
Write-Info "`n📡 Creando VPC..."
$VPC_ID = (aws ec2 create-vpc `
    --cidr-block "10.0.0.0/16" `
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$PROJECT_NAME-$ENVIRONMENT-vpc},{Key=Environment,Value=$ENVIRONMENT}]" `
    --query 'Vpc.VpcId' `
    --output text)

if ($VPC_ID) {
    Write-Success "✅ VPC creada: $VPC_ID"
} else {
    Write-Error "❌ Error creando VPC"
    exit 1
}

# 2. Crear Internet Gateway
Write-Info "`n🌐 Creando Internet Gateway..."
$IGW_ID = (aws ec2 create-internet-gateway `
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$PROJECT_NAME-$ENVIRONMENT-igw}]" `
    --query 'InternetGateway.InternetGatewayId' `
    --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
Write-Success "✅ Internet Gateway creado: $IGW_ID"

# 3. Crear Subnets
Write-Info "`n🏗️ Creando Subnets..."
$SUBNET_1_ID = (aws ec2 create-subnet `
    --vpc-id $VPC_ID `
    --cidr-block "10.0.1.0/24" `
    --availability-zone "${AWS_REGION}a" `
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-$ENVIRONMENT-subnet-1a}]" `
    --query 'Subnet.SubnetId' `
    --output text)

$SUBNET_2_ID = (aws ec2 create-subnet `
    --vpc-id $VPC_ID `
    --cidr-block "10.0.2.0/24" `
    --availability-zone "${AWS_REGION}b" `
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-$ENVIRONMENT-subnet-1b}]" `
    --query 'Subnet.SubnetId' `
    --output text)

Write-Success "✅ Subnets creadas: $SUBNET_1_ID, $SUBNET_2_ID"

# 4. Crear Security Groups
Write-Info "`n🔒 Creando Security Groups..."
$BACKEND_SG_ID = (aws ec2 create-security-group `
    --group-name "$PROJECT_NAME-$ENVIRONMENT-backend-sg" `
    --description "Security group for backend" `
    --vpc-id $VPC_ID `
    --query 'GroupId' `
    --output text)

$DB_SG_ID = (aws ec2 create-security-group `
    --group-name "$PROJECT_NAME-$ENVIRONMENT-db-sg" `
    --description "Security group for database" `
    --vpc-id $VPC_ID `
    --query 'GroupId' `
    --output text)

# Configurar reglas de seguridad
aws ec2 authorize-security-group-ingress `
    --group-id $BACKEND_SG_ID `
    --protocol tcp `
    --port 3001 `
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress `
    --group-id $DB_SG_ID `
    --protocol tcp `
    --port 5432 `
    --source-group $BACKEND_SG_ID

Write-Success "✅ Security Groups creados: Backend=$BACKEND_SG_ID, DB=$DB_SG_ID"

# 5. Crear ECR Repositories
Write-Info "`n📦 Creando ECR Repositories..."
aws ecr create-repository `
    --repository-name "$PROJECT_NAME/backend" `
    --image-scanning-configuration scanOnPush=true `
    --tags Key=Environment,Value=all 2>$null

aws ecr create-repository `
    --repository-name "$PROJECT_NAME/frontend" `
    --image-scanning-configuration scanOnPush=true `
    --tags Key=Environment,Value=all 2>$null

Write-Success "✅ ECR Repositories creados"

# 6. Crear S3 Bucket para Frontend
Write-Info "`n🪣 Creando S3 Bucket..."
$BUCKET_NAME = "$PROJECT_NAME-frontend-$ENVIRONMENT"
aws s3api create-bucket `
    --bucket $BUCKET_NAME `
    --region $AWS_REGION 2>$null

aws s3api put-public-access-block `
    --bucket $BUCKET_NAME `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

Write-Success "✅ S3 Bucket creado: $BUCKET_NAME"

# 7. Crear ECS Cluster
Write-Info "`n🐳 Creando ECS Cluster..."
aws ecs create-cluster `
    --cluster-name "$PROJECT_NAME-$ENVIRONMENT-cluster" `
    --tags key=Environment,value=$ENVIRONMENT

Write-Success "✅ ECS Cluster creado: $PROJECT_NAME-$ENVIRONMENT-cluster"

# 8. Crear RDS Subnet Group
Write-Info "`n🗄️ Creando RDS Subnet Group..."
aws rds create-db-subnet-group `
    --db-subnet-group-name "$PROJECT_NAME-$ENVIRONMENT-db-subnet-group" `
    --db-subnet-group-description "Subnet group for $ENVIRONMENT database" `
    --subnet-ids $SUBNET_1_ID $SUBNET_2_ID `
    --tags Key=Environment,Value=$ENVIRONMENT

Write-Success "✅ RDS Subnet Group creado"

# Resumen
Write-Info "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "✅ Infraestructura AWS creada exitosamente"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "`n📝 Información para GitHub Secrets:"
Write-Info ""
Write-Info "VPC_ID=$VPC_ID"
Write-Info "SUBNET_IDS_${ENVIRONMENT.ToUpper()}=$SUBNET_1_ID,$SUBNET_2_ID"
Write-Info "SECURITY_GROUP_ID_${ENVIRONMENT.ToUpper()}=$BACKEND_SG_ID"
Write-Info "DB_SECURITY_GROUP_ID_${ENVIRONMENT.ToUpper()}=$DB_SG_ID"
Write-Info "FRONTEND_BUCKET_${ENVIRONMENT.ToUpper()}=$BUCKET_NAME"
Write-Info ""
Write-Warning "⚠️  Guarda esta información para configurar GitHub Secrets"
Write-Info ""
Write-Info "Siguiente paso: Crear RDS instance con:"
Write-Info "aws rds create-db-instance --db-instance-identifier $PROJECT_NAME-$ENVIRONMENT-db ..."
