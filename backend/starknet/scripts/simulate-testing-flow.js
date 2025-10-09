const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });
const fs = require('fs');

// Configuración para Starknet Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_9',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA en hexadecimal
  explorerUrl: 'https://sepolia.starkscan.co'
};

class TestingFlowSimulator {
  constructor() {
    this.deployedContracts = {
      oracle: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      paymentGateway: '0x023456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      arsToken: '0x03456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      usdtToken: '0x0456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    };
    
    this.testingData = {
      merchantAddress: '0x01deadbeefcafebabefeedfacec0ffee123456789abcdef123456789abcdef12',
      paymentAmount: '5000000', // 5 ARS en formato u256
      paymentId: '0x1',
      testTransactions: []
    };
  }

  // Simular mint de tokens ARS para el owner (vendedor)
  simulateMintARSTokens() {
    console.log('🪙 Simulando mint de tokens ARS para el owner...');
    
    const transaction = {
      type: 'mint',
      contract: 'ARS Token',
      recipient: process.env.STARKNET_ACCOUNT_ADDRESS,
      amount: '10000000', // 10 ARS
      transactionHash: this.generateTransactionHash('mint_ars'),
      explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('mint_ars')}`
    };
    
    this.testingData.testTransactions.push(transaction);
    console.log(`✅ Mint ARS simulado: ${transaction.transactionHash}`);
    console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
    
    return transaction;
  }

  // Simular mint de tokens USDT para el PaymentGateway (tesorería)
  simulateMintUSDTTokens() {
    console.log('🪙 Simulando mint de tokens USDT para PaymentGateway...');
    
    const transaction = {
      type: 'mint',
      contract: 'USDT Token',
      recipient: this.deployedContracts.paymentGateway,
      amount: '10000000', // 10 USDT
      transactionHash: this.generateTransactionHash('mint_usdt'),
      explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('mint_usdt')}`
    };
    
    this.testingData.testTransactions.push(transaction);
    console.log(`✅ Mint USDT simulado: ${transaction.transactionHash}`);
    console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
    
    return transaction;
  }

  // Simular approve de tokens ARS al PaymentGateway
  simulateApproveARSTokens() {
    console.log('✅ Simulando approve de tokens ARS al PaymentGateway...');
    
    const transaction = {
      type: 'approve',
      contract: 'ARS Token',
      spender: this.deployedContracts.paymentGateway,
      amount: '10000000', // 10 ARS
      transactionHash: this.generateTransactionHash('approve_ars'),
      explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('approve_ars')}`
    };
    
    this.testingData.testTransactions.push(transaction);
    console.log(`✅ Approve ARS simulado: ${transaction.transactionHash}`);
    console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
    
    return transaction;
  }

  // Simular ejecución de pay() con parámetros de testing
  simulatePaymentExecution() {
    console.log('💸 Simulando ejecución de pay() con parámetros de testing...');
    
    const transaction = {
      type: 'pay',
      contract: 'PaymentGateway',
      merchantAddress: this.testingData.merchantAddress,
      amount: this.testingData.paymentAmount,
      tokenAddress: this.deployedContracts.arsToken,
      paymentId: this.testingData.paymentId,
      transactionHash: this.generateTransactionHash('pay'),
      explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('pay')}`
    };
    
    this.testingData.testTransactions.push(transaction);
    console.log(`✅ Payment simulado: ${transaction.transactionHash}`);
    console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
    
    return transaction;
  }

  // Generar hash de transacción único
  generateTransactionHash(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = `0x${Buffer.from(`${type}_${timestamp}_${random}`).toString('hex').padStart(64, '0')}`;
    return hash;
  }

  // Ejecutar flujo completo de testing
  async executeTestingFlow() {
    try {
      console.log('🚀 Iniciando flujo de testing simulado según README del programador...\n');

      // 1. Mint ARS tokens para el owner (vendedor)
      this.simulateMintARSTokens();
      console.log('');

      // 2. Mint USDT tokens para el PaymentGateway (tesorería)
      this.simulateMintUSDTTokens();
      console.log('');

      // 3. Approve ARS tokens al PaymentGateway
      this.simulateApproveARSTokens();
      console.log('');

      // 4. Ejecutar pay() con parámetros de testing
      this.simulatePaymentExecution();
      console.log('');

      // 5. Guardar configuración
      this.saveTestingConfig();

      // 6. Generar .env.example
      this.generateEnvExample();

      console.log('\n🎉 ¡Flujo de testing simulado completado exitosamente!');
      console.log('\n📋 Resumen del flujo:');
      console.log('   1. ✅ Mint ARS tokens para el owner (vendedor)');
      console.log('   2. ✅ Mint USDT tokens para el PaymentGateway (tesorería)');
      console.log('   3. ✅ Approve ARS tokens al PaymentGateway');
      console.log('   4. ✅ Ejecutar pay() con parámetros de testing');
      console.log('\n📝 Parámetros de testing utilizados:');
      console.log(`   merchant_address: ${this.testingData.merchantAddress}`);
      console.log(`   amount: ${this.testingData.paymentAmount} (5 ARS)`);
      console.log(`   token_address: ${this.deployedContracts.arsToken}`);
      console.log(`   payment_id: ${this.testingData.paymentId}`);
      console.log('\n🔗 Todas las transacciones tienen hashes únicos y enlaces a Starkscan');
      console.log('\n💡 Para implementar transacciones reales, usar starkli con los mismos parámetros');

      return this.testingData;
    } catch (error) {
      console.error('\n❌ Error en flujo de testing:', error);
      throw error;
    }
  }

  // Guardar configuración de testing
  saveTestingConfig() {
    const config = {
      network: 'Starknet Sepolia',
      rpcUrl: SEPOLIA_CONFIG.rpcUrl,
      chainId: SEPOLIA_CONFIG.chainId,
      explorerUrl: SEPOLIA_CONFIG.explorerUrl,
      deployedContracts: this.deployedContracts,
      testingData: this.testingData,
      timestamp: new Date().toISOString()
    };

    const configPath = path.join(__dirname, '../../testing-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📁 Configuración de testing guardada: ${configPath}`);

    return config;
  }

  // Generar archivo .env.example
  generateEnvExample() {
    const envExample = `# Starknet Configuration
# Private Key (sin 0x prefix)
STARKNET_PRIVATE_KEY=06daedc71dfddfe4bf48be5f540960965e46b37ffa6ef90e0f0a69581b5da083

# Wallet Address
STARKNET_ACCOUNT_ADDRESS=0x0636cc3c9c85d98a40ae01bbf5af59d0462a6509ec4a30fcd0e99870efcbdd66

# Contract Addresses (Simuladas para testing)
STARKNET_ORACLE_ADDRESS=${this.deployedContracts.oracle}
STARKNET_PAYMENT_GATEWAY_ADDRESS=${this.deployedContracts.paymentGateway}
STARKNET_ARS_TOKEN_ADDRESS=${this.deployedContracts.arsToken}
STARKNET_USDT_TOKEN_ADDRESS=${this.deployedContracts.usdtToken}

# Network Configuration
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9
STARKNET_CHAIN_ID=SN_SEPOLIA

# Frontend Environment Variables (add NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_STARKNET_ORACLE_ADDRESS=${this.deployedContracts.oracle}
NEXT_PUBLIC_STARKNET_GATEWAY_ADDRESS=${this.deployedContracts.paymentGateway}
NEXT_PUBLIC_STARKNET_ARS_TOKEN_ADDRESS=${this.deployedContracts.arsToken}
NEXT_PUBLIC_STARKNET_USDT_TOKEN_ADDRESS=${this.deployedContracts.usdtToken}
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9

# Testing Parameters
TESTING_MERCHANT_ADDRESS=${this.testingData.merchantAddress}
TESTING_PAYMENT_AMOUNT=${this.testingData.paymentAmount}
TESTING_PAYMENT_ID=${this.testingData.paymentId}
`;

    const envPath = path.join(__dirname, '../../.env.testing.example');
    fs.writeFileSync(envPath, envExample);
    console.log(`📁 Archivo .env.testing.example generado: ${envPath}`);
  }

  // Mostrar comandos starkli para implementación real
  showStarkliCommands() {
    console.log('\n🔧 Comandos starkli para implementación real:');
    console.log('\n# 1. Mint ARS tokens para el owner');
    console.log(`starkli invoke ${this.deployedContracts.arsToken} mint ${process.env.STARKNET_ACCOUNT_ADDRESS} 10000000 --account existing_account.json --keystore keystore.json`);
    
    console.log('\n# 2. Mint USDT tokens para PaymentGateway');
    console.log(`starkli invoke ${this.deployedContracts.usdtToken} mint ${this.deployedContracts.paymentGateway} 10000000 --account existing_account.json --keystore keystore.json`);
    
    console.log('\n# 3. Approve ARS tokens al PaymentGateway');
    console.log(`starkli invoke ${this.deployedContracts.arsToken} approve ${this.deployedContracts.paymentGateway} 10000000 --account existing_account.json --keystore keystore.json`);
    
    console.log('\n# 4. Ejecutar pay()');
    console.log(`starkli invoke ${this.deployedContracts.paymentGateway} pay ${this.testingData.merchantAddress} ${this.testingData.paymentAmount} ${this.deployedContracts.arsToken} ${this.testingData.paymentId} --account existing_account.json --keystore keystore.json`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    const simulator = new TestingFlowSimulator();
    const result = await simulator.executeTestingFlow();
    simulator.showStarkliCommands();
    console.log('\n✅ Flujo de testing simulado finalizado:', result);
  })().catch(error => {
    console.error('\n❌ Flujo de testing falló:', error);
    process.exitCode = 1;
  });
}

module.exports = TestingFlowSimulator;
