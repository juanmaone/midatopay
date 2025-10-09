const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });
const { exec } = require('child_process');
const fs = require('fs');

// Configuración para Starknet Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_9',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA en hexadecimal
  explorerUrl: 'https://sepolia.starkscan.co'
};

class StarkliDeployer {
  constructor() {
    this.starkliPath = path.join(__dirname, 'starkli/starkli.exe');
    this.deployedContracts = {
      oracle: null,
      paymentGateway: null,
      arsToken: null,
      usdtToken: null
    };
  }

  // Ejecutar comando starkli
  async runStarkli(command) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Ejecutando: ${command}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error:', stderr);
          reject(error);
        } else {
          console.log('✅ Éxito:', stdout.trim());
          resolve(stdout.trim());
        }
      });
    });
  }

  // Declarar contrato usando starkli
  async declareContract(contractName, sierraPath) {
    console.log(`📋 Declarando ${contractName} con starkli...`);
    
    const command = `"${this.starkliPath}" declare "${sierraPath}" --account existing_account.json --keystore keystore.json --rpc ${SEPOLIA_CONFIG.rpcUrl}`;
    const output = await this.runStarkli(command);
    
    // Extraer class hash del output
    const classHashMatch = output.match(/class hash: (0x[a-fA-F0-9]+)/);
    if (classHashMatch) {
      const classHash = classHashMatch[1];
      console.log(`✅ ${contractName} declarado: ${classHash}`);
      return classHash;
    } else {
      throw new Error(`No se pudo extraer class hash de: ${output}`);
    }
  }

  // Desplegar contrato usando starkli
  async deployContract(contractName, classHash, constructorArgs = []) {
    console.log(`🚀 Desplegando ${contractName} con starkli...`);
    
    let command = `"${this.starkliPath}" deploy ${classHash}`;
    
    if (constructorArgs.length > 0) {
      command += ` --inputs ${constructorArgs.join(' ')}`;
    }
    
    command += ` --account existing_account.json --keystore keystore.json --rpc ${SEPOLIA_CONFIG.rpcUrl}`;
    
    const output = await this.runStarkli(command);
    
    // Extraer contract address del output
    const addressMatch = output.match(/Contract address: (0x[a-fA-F0-9]+)/);
    if (addressMatch) {
      const contractAddress = addressMatch[1];
      console.log(`✅ ${contractName} desplegado: ${contractAddress}`);
      return contractAddress;
    } else {
      throw new Error(`No se pudo extraer contract address de: ${output}`);
    }
  }

  // Desplegar todo usando starkli
  async deployAll() {
    try {
      console.log('🚀 Iniciando despliegue con starkli según flujo del programador...\n');

      // 1. Declarar Oracle
      const oracleSierraPath = path.join(__dirname, '../../../starknet-token/midatopay/oracle/target/dev/oracle_starknet_StaticFxOracle.contract_class.json');
      const oracleClassHash = await this.declareContract('StaticFxOracle', oracleSierraPath);

      // 2. Declarar PaymentGateway
      const gatewaySierraPath = path.join(__dirname, '../../../starknet-token/midatopay/starknet-paymentoracle/target/dev/midatopay_starknet_PaymentGateway.contract_class.json');
      const gatewayClassHash = await this.declareContract('PaymentGateway', gatewaySierraPath);

      // 3. Declarar PausableERC20
      const tokenSierraPath = path.join(__dirname, '../../../starknet-token/midatopay/starknet-token/target/dev/pausable_erc20_PausableERC20.contract_class.json');
      const tokenClassHash = await this.declareContract('PausableERC20', tokenSierraPath);

      // 4. Desplegar Oracle
      const adminAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
      const initialRatePpm = '1000000'; // 1:1 ARS/USDT para testing
      const oracleAddress = await this.deployContract('StaticFxOracle', oracleClassHash, [adminAddress, initialRatePpm]);
      this.deployedContracts.oracle = oracleAddress;

      // 5. Desplegar ARS Token
      const arsTokenAddress = await this.deployContract('ARS Token', tokenClassHash, [adminAddress]);
      this.deployedContracts.arsToken = arsTokenAddress;

      // 6. Desplegar USDT Token
      const usdtTokenAddress = await this.deployContract('USDT Token', tokenClassHash, [adminAddress]);
      this.deployedContracts.usdtToken = usdtTokenAddress;

      // 7. Desplegar PaymentGateway
      const gatewayAddress = await this.deployContract('PaymentGateway', gatewayClassHash, [
        adminAddress,
        oracleAddress,
        arsTokenAddress,
        usdtTokenAddress
      ]);
      this.deployedContracts.paymentGateway = gatewayAddress;

      // 8. Guardar configuración
      this.saveDeploymentConfig();

      // 9. Generar .env.example
      this.generateEnvExample();

      console.log('\n🎉 ¡Despliegue completado exitosamente con starkli!');
      console.log('\n📋 Resumen:');
      console.log(`   StaticFxOracle: ${oracleAddress}`);
      console.log(`   PaymentGateway: ${gatewayAddress}`);
      console.log(`   ARS Token: ${arsTokenAddress}`);
      console.log(`   USDT Token: ${usdtTokenAddress}`);
      console.log(`   Network: Starknet Sepolia`);
      console.log('\n📝 Próximos pasos para testing:');
      console.log('   1. Copiar las variables de entorno desde .env.starknet.example');
      console.log('   2. Ejecutar el flujo de testing completo con starkli:');
      console.log('      a) Mint ARS tokens para el owner (vendedor)');
      console.log('      b) Mint USDT tokens para el PaymentGateway (tesorería)');
      console.log('      c) Approve ARS tokens al PaymentGateway');
      console.log('      d) Ejecutar pay() con parámetros de testing');

      return this.deployedContracts;
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
    const deployer = new StarkliDeployer();
    const config = await deployer.deployAll();
    console.log('\n✅ Despliegue finalizado:', config);
  })().catch(error => {
    console.error('\n❌ Despliegue falló:', error);
    process.exitCode = 1;
  });
}

module.exports = StarkliDeployer;
