const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });
const { Account, RpcProvider, Contract, CallData } = require('starknet');
const fs = require('fs');

// Configuración para Starknet Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_9',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA en hexadecimal
  explorerUrl: 'https://sepolia.starkscan.co'
};

class StarknetDeployer {
  constructor() {
    this.provider = new RpcProvider({ 
      nodeUrl: SEPOLIA_CONFIG.rpcUrl,
      chainId: SEPOLIA_CONFIG.chainId,
      blockIdentifier: 'latest'
    });
    
    this.account = null;
    this.deployedContracts = {
      oracle: null,
      paymentGateway: null,
      arsToken: null,        // PausableERC20 para ARS
      usdtToken: null        // PausableERC20 para USDT
    };
  }

  // Configurar cuenta desde variables de entorno
  setupAccount() {
    const privateKey = process.env.STARKNET_PRIVATE_KEY;
    const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

    if (!privateKey || !accountAddress) {
      throw new Error('STARKNET_PRIVATE_KEY y STARKNET_ACCOUNT_ADDRESS son requeridos');
    }

    this.account = new Account(this.provider, accountAddress, privateKey);
    console.log(`✅ Cuenta configurada: ${accountAddress}`);
  }

  // Detectar ruta de Scarb automáticamente
  getScarbPath() {
    // 1. Verificar variable de entorno SCARB_PATH
    if (process.env.SCARB_PATH) {
      console.log(`🔧 Usando SCARB_PATH: ${process.env.SCARB_PATH}`);
      return process.env.SCARB_PATH;
    }

    // 2. Detectar sistema operativo y usar ruta por defecto
    const os = require('os');
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows: usar ruta por defecto
      const defaultPath = 'C:\\Users\\monst\\Downloads\\scarb-v2.12.2-x86_64-pc-windows-msvc\\scarb-v2.12.2-x86_64-pc-windows-msvc\\bin\\scarb.exe';
      console.log(`🔧 Windows detectado, usando: ${defaultPath}`);
      return defaultPath;
    } else if (platform === 'darwin') {
      // macOS: buscar en ubicaciones comunes
      console.log(`🔧 macOS detectado, usando: scarb`);
      return 'scarb';
    } else if (platform === 'linux') {
      // Linux: buscar en PATH
      console.log(`🔧 Linux detectado, usando: scarb`);
      return 'scarb';
    } else {
      // Sistema desconocido: intentar con 'scarb'
      console.log(`🔧 Sistema desconocido (${platform}), usando: scarb`);
      return 'scarb';
    }
  }

  // Compilar Oracle desde midatopay/oracle
  async compileOracle() {
    console.log(`🔨 Compilando StaticFxOracle desde midatopay/oracle`);
    
    const { exec } = require('child_process');
    const scarbPath = this.getScarbPath();
    
    return new Promise((resolve, reject) => {
      exec(`"${scarbPath}" build`, { cwd: path.join(__dirname, '../../../starknet-token/midatopay/oracle') }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error compilando Oracle:', stderr);
          reject(error);
        } else {
          console.log('✅ Compilación Oracle exitosa');
          resolve(stdout);
        }
      });
    });
  }

  // Compilar PaymentGateway desde midatopay/starknet-paymentoracle
  async compilePaymentGateway() {
    console.log(`🔨 Compilando PaymentGateway desde midatopay/starknet-paymentoracle`);
    
    const { exec } = require('child_process');
    const scarbPath = this.getScarbPath();
    
    return new Promise((resolve, reject) => {
      exec(`"${scarbPath}" build`, { cwd: path.join(__dirname, '../../../starknet-token/midatopay/starknet-paymentoracle') }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error compilando PaymentGateway:', stderr);
          reject(error);
        } else {
          console.log('✅ Compilación PaymentGateway exitosa');
          resolve(stdout);
        }
      });
    });
  }

  // Compilar PausableERC20 desde midatopay/starknet-token
  async compilePausableERC20() {
    console.log(`🔨 Compilando PausableERC20 desde midatopay/starknet-token`);
    
    const { exec } = require('child_process');
    const scarbPath = this.getScarbPath();
    
    return new Promise((resolve, reject) => {
      exec(`"${scarbPath}" build`, { cwd: path.join(__dirname, '../../../starknet-token/midatopay/starknet-token') }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error compilando PausableERC20:', stderr);
          reject(error);
        } else {
          console.log('✅ Compilación PausableERC20 exitosa');
          resolve(stdout);
        }
      });
    });
  }

  // Leer artefactos compilados para Oracle
  readCompiledOracle() {
    const targetDir = path.join(__dirname, '../../../starknet-token/midatopay/oracle/target/dev');
    
    const sierraPath = path.join(targetDir, `oracle_starknet_StaticFxOracle.contract_class.json`);
    const casmPath = path.join(targetDir, `oracle_starknet_StaticFxOracle.compiled_contract_class.json`);

    if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
      throw new Error(`Archivos compilados no encontrados para StaticFxOracle`);
    }

    const sierra = JSON.parse(fs.readFileSync(sierraPath, 'utf8'));
    const casm = JSON.parse(fs.readFileSync(casmPath, 'utf8'));

    console.log(`📁 Leyendo artefactos: Sierra + CASM para StaticFxOracle`);
    return { sierra, casm };
  }

  // Leer artefactos compilados para PaymentGateway
  readCompiledPaymentGateway() {
    const targetDir = path.join(__dirname, '../../../starknet-token/midatopay/starknet-paymentoracle/target/dev');
    
    const sierraPath = path.join(targetDir, `midatopay_starknet_PaymentGateway.contract_class.json`);
    const casmPath = path.join(targetDir, `midatopay_starknet_PaymentGateway.compiled_contract_class.json`);

    if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
      throw new Error(`Archivos compilados no encontrados para PaymentGateway`);
    }

    const sierra = JSON.parse(fs.readFileSync(sierraPath, 'utf8'));
    const casm = JSON.parse(fs.readFileSync(casmPath, 'utf8'));

    console.log(`📁 Leyendo artefactos: Sierra + CASM para PaymentGateway`);
    return { sierra, casm };
  }

  // Leer artefactos compilados para PausableERC20
  readCompiledPausableERC20() {
    const targetDir = path.join(__dirname, '../../../starknet-token/midatopay/starknet-token/target/dev');
    
    const sierraPath = path.join(targetDir, `pausable_erc20_PausableERC20.contract_class.json`);
    const casmPath = path.join(targetDir, `pausable_erc20_PausableERC20.compiled_contract_class.json`);

    if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
      throw new Error(`Archivos compilados no encontrados para PausableERC20`);
    }

    const sierra = JSON.parse(fs.readFileSync(sierraPath, 'utf8'));
    const casm = JSON.parse(fs.readFileSync(casmPath, 'utf8'));

    console.log(`📁 Leyendo artefactos: Sierra + CASM para PausableERC20`);
    return { sierra, casm };
  }

  // Declarar Oracle
  async declareOracle() {
    console.log(`📋 Declarando StaticFxOracle`);

    const { sierra, casm } = this.readCompiledOracle();

    try {
      const declareResponse = await this.account.declare({
        contract: sierra,
        casm: casm
      }, {
        maxFee: '1000000000000000000', // 1 ETH en wei
        skipValidate: true,
        version: '0x0' // Usar versión básica
      });

      await this.provider.waitForTransaction(declareResponse.transaction_hash);
      
      console.log(`✅ StaticFxOracle declarado: ${declareResponse.class_hash}`);
      console.log(`🔗 TX: ${SEPOLIA_CONFIG.explorerUrl}/tx/${declareResponse.transaction_hash}`);

      return declareResponse.class_hash;
    } catch (error) {
      console.error('❌ Error declarando StaticFxOracle:', error);
      throw error;
    }
  }

  // Declarar PaymentGateway
  async declarePaymentGateway() {
    console.log(`📋 Declarando PaymentGateway`);

    const { sierra, casm } = this.readCompiledPaymentGateway();

    try {
      const declareResponse = await this.account.declare({
        contract: sierra,
        casm: casm
      }, {
        maxFee: '1000000000000000000', // 1 ETH en wei
        skipValidate: true,
        version: '0x0' // Usar versión básica
      });

      await this.provider.waitForTransaction(declareResponse.transaction_hash);
      
      console.log(`✅ PaymentGateway declarado: ${declareResponse.class_hash}`);
      console.log(`🔗 TX: ${SEPOLIA_CONFIG.explorerUrl}/tx/${declareResponse.transaction_hash}`);

      return declareResponse.class_hash;
    } catch (error) {
      console.error('❌ Error declarando PaymentGateway:', error);
      throw error;
    }
  }

  // Declarar PausableERC20
  async declarePausableERC20() {
    console.log(`📋 Declarando PausableERC20`);

    const { sierra, casm } = this.readCompiledPausableERC20();

    try {
      const declareResponse = await this.account.declare({
        contract: sierra,
        casm: casm
      }, {
        maxFee: '1000000000000000000', // 1 ETH en wei
        skipValidate: true,
        version: '0x0' // Usar versión básica
      });

      await this.provider.waitForTransaction(declareResponse.transaction_hash);
      
      console.log(`✅ PausableERC20 declarado: ${declareResponse.class_hash}`);
      console.log(`🔗 TX: ${SEPOLIA_CONFIG.explorerUrl}/tx/${declareResponse.transaction_hash}`);

      return declareResponse.class_hash;
    } catch (error) {
      console.error('❌ Error declarando PausableERC20:', error);
      throw error;
    }
  }

  // Desplegar Oracle
  async deployOracle(classHash) {
    console.log('🚀 Desplegando StaticFxOracle...');

    const adminAddress = this.account.address;
    const initialRatePpm = '1000000'; // 1:1 ARS/USDT para testing
    const constructorCalldata = CallData.compile([adminAddress, initialRatePpm]);

    try {
      const deployResponse = await this.account.deployContract({
        classHash,
        constructorCalldata
      });

      await this.provider.waitForTransaction(deployResponse.transaction_hash);

      const contractAddress = deployResponse.contract_address;
      
      console.log(`✅ StaticFxOracle desplegado: ${contractAddress}`);
      console.log(`🔗 TX: ${SEPOLIA_CONFIG.explorerUrl}/tx/${deployResponse.transaction_hash}`);
      console.log(`🔗 Contrato: ${SEPOLIA_CONFIG.explorerUrl}/contract/${contractAddress}`);

      this.deployedContracts.oracle = contractAddress;
      return contractAddress;
    } catch (error) {
      console.error('❌ Error desplegando StaticFxOracle:', error);
      throw error;
    }
  }

  // Desplegar PaymentGateway
  async deployPaymentGateway(classHash) {
    console.log('🚀 Desplegando PaymentGateway...');

    const adminAddress = this.account.address;
    const oracleAddress = this.deployedContracts.oracle;
    const arsTokenAddress = this.deployedContracts.arsToken;
    const usdtTokenAddress = this.deployedContracts.usdtToken;
    
    const constructorCalldata = CallData.compile([
      adminAddress,
      oracleAddress,
      arsTokenAddress,
      usdtTokenAddress
    ]);

    try {
      const deployResponse = await this.account.deployContract({
        classHash,
        constructorCalldata
      });

      await this.provider.waitForTransaction(deployResponse.transaction_hash);

      const contractAddress = deployResponse.contract_address;
      
      console.log(`✅ PaymentGateway desplegado: ${contractAddress}`);
      console.log(`🔗 TX: ${SEPOLIA_CONFIG.explorerUrl}/tx/${deployResponse.transaction_hash}`);
      console.log(`🔗 Contrato: ${SEPOLIA_CONFIG.explorerUrl}/contract/${contractAddress}`);

      this.deployedContracts.paymentGateway = contractAddress;
      return contractAddress;
    } catch (error) {
      console.error('❌ Error desplegando PaymentGateway:', error);
      throw error;
    }
  }

  // Desplegar PausableERC20
  async deployPausableERC20(classHash) {
    console.log('🚀 Desplegando PausableERC20...');

    const adminAddress = this.account.address;
    const constructorCalldata = CallData.compile([adminAddress]);

    try {
      const deployResponse = await this.account.deployContract({
        classHash,
        constructorCalldata
      });

      await this.provider.waitForTransaction(deployResponse.transaction_hash);

      const contractAddress = deployResponse.contract_address;
      
      console.log(`✅ PausableERC20 desplegado: ${contractAddress}`);
      console.log(`🔗 TX: ${SEPOLIA_CONFIG.explorerUrl}/tx/${deployResponse.transaction_hash}`);
      console.log(`🔗 Contrato: ${SEPOLIA_CONFIG.explorerUrl}/contract/${contractAddress}`);

      return contractAddress;
    } catch (error) {
      console.error('❌ Error desplegando PausableERC20:', error);
      throw error;
    }
  }

  // Verificar despliegue de Oracle
  async verifyOracleDeployment(contractAddress) {
    console.log('🔍 Verificando despliegue StaticFxOracle...');

    try {
      const { sierra } = this.readCompiledOracle();
      const contract = new Contract(sierra.abi, contractAddress, this.provider);
      contract.connect(this.account);

      const admin = await contract.get_admin();
      
      if (BigInt(admin) === BigInt(this.account.address)) {
        console.log('✅ Verificación Oracle exitosa - Admin correcto');
        return contract;
      } else {
        console.error('❌ Verificación Oracle fallida - Admin incorrecto');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando despliegue Oracle:', error);
      return false;
    }
  }

  // Verificar despliegue de PaymentGateway
  async verifyPaymentGatewayDeployment(contractAddress) {
    console.log('🔍 Verificando despliegue PaymentGateway...');

    try {
      const { sierra } = this.readCompiledPaymentGateway();
      const contract = new Contract(sierra.abi, contractAddress, this.provider);
      contract.connect(this.account);

      const admin = await contract.get_admin();
      
      if (BigInt(admin) === BigInt(this.account.address)) {
        console.log('✅ Verificación PaymentGateway exitosa - Admin correcto');
        return contract;
      } else {
        console.error('❌ Verificación PaymentGateway fallida - Admin incorrecto');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando despliegue PaymentGateway:', error);
      return false;
    }
  }

  // Verificar despliegue de PausableERC20
  async verifyPausableERC20Deployment(contractAddress) {
    console.log('🔍 Verificando despliegue PausableERC20...');

    try {
      const { sierra } = this.readCompiledPausableERC20();
      const contract = new Contract(sierra.abi, contractAddress, this.provider);
      contract.connect(this.account);

      const admin = await contract.get_admin();
      
      if (BigInt(admin) === BigInt(this.account.address)) {
        console.log('✅ Verificación PausableERC20 exitosa - Admin correcto');
        return contract;
      } else {
        console.error('❌ Verificación PausableERC20 fallida - Admin incorrecto');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando despliegue PausableERC20:', error);
      return false;
    }
  }

  // Desplegar todo según el flujo del programador
  async deployAll() {
    try {
      console.log('🚀 Iniciando despliegue completo según flujo del programador...\n');

      // 1. Configurar cuenta
      this.setupAccount();

      // 2. Compilar todos los contratos
      await this.compileOracle();
      await this.compilePaymentGateway();
      await this.compilePausableERC20();

      // 3. Declarar todos los contratos
      const oracleClassHash = await this.declareOracle();
      const gatewayClassHash = await this.declarePaymentGateway();
      const tokenClassHash = await this.declarePausableERC20();

      // 4. Desplegar Oracle primero
      const oracleAddress = await this.deployOracle(oracleClassHash);
      const oracleContract = await this.verifyOracleDeployment(oracleAddress);

      // 5. Desplegar ARS Token (PausableERC20)
      const arsTokenAddress = await this.deployPausableERC20(tokenClassHash);
      const arsTokenContract = await this.verifyPausableERC20Deployment(arsTokenAddress);
      this.deployedContracts.arsToken = arsTokenAddress;

      // 6. Desplegar USDT Token (PausableERC20)
      const usdtTokenAddress = await this.deployPausableERC20(tokenClassHash);
      const usdtTokenContract = await this.verifyPausableERC20Deployment(usdtTokenAddress);
      this.deployedContracts.usdtToken = usdtTokenAddress;

      // 7. Desplegar PaymentGateway con todas las direcciones
      const gatewayAddress = await this.deployPaymentGateway(gatewayClassHash);
      const gatewayContract = await this.verifyPaymentGatewayDeployment(gatewayAddress);
      
      if (!oracleContract || !arsTokenContract || !usdtTokenContract || !gatewayContract) {
        throw new Error('Verificación de despliegue falló');
      }

      // 8. Guardar configuración
      const config = this.saveDeploymentConfig();

      // 9. Generar .env.example
      this.generateEnvExample();

      console.log('\n🎉 ¡Despliegue completado exitosamente!');
      console.log('\n📋 Resumen:');
      console.log(`   StaticFxOracle: ${oracleAddress}`);
      console.log(`   PaymentGateway: ${gatewayAddress}`);
      console.log(`   ARS Token: ${arsTokenAddress}`);
      console.log(`   USDT Token: ${usdtTokenAddress}`);
      console.log(`   Network: Starknet Sepolia`);
      console.log('\n📝 Próximos pasos para testing:');
      console.log('   1. Copiar las variables de entorno desde .env.starknet.example');
      console.log('   2. Obtener tokens de prueba del faucet de Sepolia');
      console.log('   3. Ejecutar el flujo de testing completo:');
      console.log('      a) Mint ARS tokens para el owner (vendedor)');
      console.log('      b) Mint USDT tokens para el PaymentGateway (tesorería)');
      console.log('      c) Approve ARS tokens al PaymentGateway');
      console.log('      d) Ejecutar pay() con parámetros de testing');

      return config;
    } catch (error) {
      console.error('\n❌ Error en despliegue:', error);
      throw error;
    }
  }

  // Guardar configuración de despliegue
  saveDeploymentConfig() {
    const config = {
      network: 'Starknet Sepolia',
      rpcUrl: SEPOLIA_CONFIG.rpcUrl,
      chainId: SEPOLIA_CONFIG.chainId,
      explorerUrl: SEPOLIA_CONFIG.explorerUrl,
      deployedContracts: this.deployedContracts,
      timestamp: new Date().toISOString()
    };

    const configPath = path.join(__dirname, '../../deployment-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📁 Configuración guardada: ${configPath}`);

    return config;
  }

  // Generar archivo .env.example
  generateEnvExample() {
    const envExample = `# Starknet Configuration
# Private Key (sin 0x prefix)
STARKNET_PRIVATE_KEY=06daedc71dfddfe4bf48be5f540960965e46b37ffa6ef90e0f0a69581b5da083

# Wallet Address
STARKNET_ACCOUNT_ADDRESS=0x0636cc3c9c85d98a40ae01bbf5af59d0462a6509ec4a30fcd0e99870efcbdd66

# Contract Addresses (Nueva estructura del programador)
STARKNET_ORACLE_ADDRESS=${this.deployedContracts.oracle || 'oracle_address_after_deployment'}
STARKNET_PAYMENT_GATEWAY_ADDRESS=${this.deployedContracts.paymentGateway || 'gateway_address_after_deployment'}
STARKNET_ARS_TOKEN_ADDRESS=${this.deployedContracts.arsToken || 'ars_token_address_after_deployment'}
STARKNET_USDT_TOKEN_ADDRESS=${this.deployedContracts.usdtToken || 'usdt_token_address_after_deployment'}

# Network Configuration
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9
STARKNET_CHAIN_ID=SN_SEPOLIA

# Frontend Environment Variables (add NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_STARKNET_ORACLE_ADDRESS=${this.deployedContracts.oracle || 'oracle_address_after_deployment'}
NEXT_PUBLIC_STARKNET_GATEWAY_ADDRESS=${this.deployedContracts.paymentGateway || 'gateway_address_after_deployment'}
NEXT_PUBLIC_STARKNET_ARS_TOKEN_ADDRESS=${this.deployedContracts.arsToken || 'ars_token_address_after_deployment'}
NEXT_PUBLIC_STARKNET_USDT_TOKEN_ADDRESS=${this.deployedContracts.usdtToken || 'usdt_token_address_after_deployment'}
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9

# Scarb Configuration (optional - auto-detected if not set)
# SCARB_PATH=C:\\path\\to\\scarb.exe  # Windows
# SCARB_PATH=/usr/local/bin/scarb     # macOS/Linux
`;

    const envPath = path.join(__dirname, '../../.env.starknet.example');
    fs.writeFileSync(envPath, envExample);
    console.log(`📁 Archivo .env.example generado: ${envPath}`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    const deployer = new StarknetDeployer();
    const config = await deployer.deployAll();
    console.log('\n✅ Despliegue finalizado:', config);
  })().catch(error => {
    console.error('\n❌ Despliegue falló:', error);
    process.exitCode = 1; // en lugar de exit(1) para evitar cortar stdout bruscamente
  });
}

module.exports = StarknetDeployer;