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

class StarkliRealDeployer {
  constructor() {
    this.starkliPath = path.join(__dirname, 'starkli/starkli.exe');
    this.deployedContracts = {
      oracle: null,
      paymentGateway: null,
      arsToken: null,        // PausableERC20 para ARS
      usdtToken: null        // PausableERC20 para USDT
    };
    
    this.testingData = {
      merchantAddress: '0x01deadbeefcafebabefeedfacec0ffee123456789abcdef123456789abcdef12',
      paymentAmount: '5000000', // 5 ARS
      paymentId: '0x1'
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

  // Invocar función de contrato usando starkli
  async invokeContract(contractAddress, functionName, args = []) {
    console.log(`🔧 Invocando ${functionName} en ${contractAddress.substring(0, 10)}...`);
    
    let command = `"${this.starkliPath}" invoke ${contractAddress} ${functionName}`;
    
    if (args.length > 0) {
      command += ` ${args.join(' ')}`;
    }
    
    command += ` --account existing_account.json --keystore keystore.json --rpc ${SEPOLIA_CONFIG.rpcUrl}`;
    
    const output = await this.runStarkli(command);
    
    // Extraer transaction hash del output
    const txHashMatch = output.match(/Transaction hash: (0x[a-fA-F0-9]+)/);
    if (txHashMatch) {
      const txHash = txHashMatch[1];
      console.log(`✅ ${functionName} ejecutado: ${txHash}`);
      console.log(`🔗 Explorer: ${SEPOLIA_CONFIG.explorerUrl}/tx/${txHash}`);
      return txHash;
    } else {
      console.log(`✅ ${functionName} ejecutado (sin hash visible)`);
      return null;
    }
  }

  // Desplegar todo según el flujo del programador
  async deployAll() {
    try {
      console.log('🚀 Iniciando despliegue REAL con starkli según flujo del programador...\n');

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

      // 5. Desplegar ARS Token (PausableERC20)
      const arsTokenAddress = await this.deployContract('ARS Token', tokenClassHash, [adminAddress]);
      this.deployedContracts.arsToken = arsTokenAddress;

      // 6. Desplegar USDT Token (PausableERC20)
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

      console.log('\n🎉 ¡Despliegue REAL completado exitosamente!');
      console.log('\n📋 Resumen:');
      console.log(`   StaticFxOracle: ${oracleAddress}`);
      console.log(`   PaymentGateway: ${gatewayAddress}`);
      console.log(`   ARS Token: ${arsTokenAddress}`);
      console.log(`   USDT Token: ${usdtTokenAddress}`);
      console.log(`   Network: Starknet Sepolia`);

      return this.deployedContracts;
    } catch (error) {
      console.error('\n❌ Error en despliegue:', error);
      throw error;
    }
  }

  // Ejecutar flujo de testing completo
  async executeTestingFlow() {
    try {
      console.log('\n🧪 Iniciando flujo de testing REAL...\n');

      // 1. Mint ARS tokens para el owner (vendedor)
      console.log('🪙 1. Mint ARS tokens para el owner (vendedor)...');
      await this.invokeContract(
        this.deployedContracts.arsToken,
        'mint',
        [process.env.STARKNET_ACCOUNT_ADDRESS, '10000000']
      );

      // 2. Mint USDT tokens para PaymentGateway (tesorería)
      console.log('\n🪙 2. Mint USDT tokens para PaymentGateway (tesorería)...');
      await this.invokeContract(
        this.deployedContracts.usdtToken,
        'mint',
        [this.deployedContracts.paymentGateway, '10000000']
      );

      // 3. Approve ARS tokens al PaymentGateway
      console.log('\n✅ 3. Approve ARS tokens al PaymentGateway...');
      await this.invokeContract(
        this.deployedContracts.arsToken,
        'approve',
        [this.deployedContracts.paymentGateway, '10000000']
      );

      // 4. Ejecutar pay() con parámetros de testing
      console.log('\n💸 4. Ejecutar pay() con parámetros de testing...');
      await this.invokeContract(
        this.deployedContracts.paymentGateway,
        'pay',
        [
          this.testingData.merchantAddress,
          this.testingData.paymentAmount,
          this.deployedContracts.arsToken,
          this.testingData.paymentId
        ]
      );

      console.log('\n🎉 ¡Flujo de testing REAL completado exitosamente!');
      console.log('\n📝 Parámetros utilizados:');
      console.log(`   merchant_address: ${this.testingData.merchantAddress}`);
      console.log(`   amount: ${this.testingData.paymentAmount} (5 ARS)`);
      console.log(`   token_address: ${this.deployedContracts.arsToken}`);
      console.log(`   payment_id: ${this.testingData.paymentId}`);

      return true;
    } catch (error) {
      console.error('\n❌ Error en flujo de testing:', error);
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
      testingData: this.testingData,
      timestamp: new Date().toISOString()
    };

    const configPath = path.join(__dirname, '../../real-deployment-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📁 Configuración guardada: ${configPath}`);

    return config;
  }

  // Generar archivo .env.example
  generateEnvExample() {
    const envExample = `# Starknet Configuration - REAL DEPLOYMENT
# Private Key (sin 0x prefix)
STARKNET_PRIVATE_KEY=06daedc71dfddfe4bf48be5f540960965e46b37ffa6ef90e0f0a69581b5da083

# Wallet Address
STARKNET_ACCOUNT_ADDRESS=0x0636cc3c9c85d98a40ae01bbf5af59d0462a6509ec4a30fcd0e99870efcbdd66

# Contract Addresses (REAL - Desplegados con starkli)
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

# Testing Parameters
TESTING_MERCHANT_ADDRESS=${this.testingData.merchantAddress}
TESTING_PAYMENT_AMOUNT=${this.testingData.paymentAmount}
TESTING_PAYMENT_ID=${this.testingData.paymentId}
`;

    const envPath = path.join(__dirname, '../../.env.real.example');
    fs.writeFileSync(envPath, envExample);
    console.log(`📁 Archivo .env.real.example generado: ${envPath}`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    const deployer = new StarkliRealDeployer();
    
    console.log('¿Quieres ejecutar el despliegue completo o solo el testing?');
    console.log('1. Despliegue completo + Testing');
    console.log('2. Solo Testing (contratos ya desplegados)');
    
    // Por defecto ejecutar despliegue completo
    try {
      const contracts = await deployer.deployAll();
      await deployer.executeTestingFlow();
      console.log('\n✅ Proceso completo finalizado:', contracts);
    } catch (error) {
      console.error('\n❌ Proceso falló:', error);
      process.exitCode = 1;
    }
  })();
}

module.exports = StarkliRealDeployer;
