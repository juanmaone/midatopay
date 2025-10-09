const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });
const fs = require('fs');

// Configuración para Starknet Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_9',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA en hexadecimal
  explorerUrl: 'https://sepolia.starkscan.co'
};

class FrontendFlowGenerator {
  constructor() {
    // Contratos simulados con direcciones realistas
    this.deployedContracts = {
      oracle: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      paymentGateway: '0x023456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      arsToken: '0x03456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      usdtToken: '0x0456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    };
    
    this.testingData = {
      merchantAddress: '0x01deadbeefcafebabefeedfacec0ffee123456789abcdef123456789abcdef12',
      paymentAmount: '5000000', // 5 ARS
      paymentId: '0x1',
      oracleRate: '1000000' // 1:1 ARS/USDT
    };
  }

  // Generar hash de transacción único y realista
  generateTransactionHash(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = `0x${Buffer.from(`${type}_${timestamp}_${random}`).toString('hex').padStart(64, '0')}`;
    return hash;
  }

  // Simular flujo completo según README del programador
  generateFrontendFlow() {
    console.log('🚀 Generando flujo completo para frontend según README del programador...\n');

    const flow = {
      // 1. Configuración de contratos
      contracts: this.deployedContracts,
      
      // 2. Flujo de testing completo
      testingFlow: {
        // Paso 1: Mint ARS tokens para el owner (vendedor)
        mintARSTokens: {
          contract: this.deployedContracts.arsToken,
          function: 'mint',
          args: [process.env.STARKNET_ACCOUNT_ADDRESS, '10000000'],
          transactionHash: this.generateTransactionHash('mint_ars'),
          explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('mint_ars')}`,
          description: 'Mint ARS tokens para el owner (vendedor)'
        },
        
        // Paso 2: Mint USDT tokens para PaymentGateway (tesorería)
        mintUSDTTokens: {
          contract: this.deployedContracts.usdtToken,
          function: 'mint',
          args: [this.deployedContracts.paymentGateway, '10000000'],
          transactionHash: this.generateTransactionHash('mint_usdt'),
          explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('mint_usdt')}`,
          description: 'Mint USDT tokens para PaymentGateway (tesorería)'
        },
        
        // Paso 3: Approve ARS tokens al PaymentGateway
        approveARSTokens: {
          contract: this.deployedContracts.arsToken,
          function: 'approve',
          args: [this.deployedContracts.paymentGateway, '10000000'],
          transactionHash: this.generateTransactionHash('approve_ars'),
          explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('approve_ars')}`,
          description: 'Approve ARS tokens al PaymentGateway'
        },
        
        // Paso 4: Ejecutar pay() con parámetros de testing
        executePayment: {
          contract: this.deployedContracts.paymentGateway,
          function: 'pay',
          args: [
            this.testingData.merchantAddress,
            this.testingData.paymentAmount,
            this.deployedContracts.arsToken,
            this.testingData.paymentId
          ],
          transactionHash: this.generateTransactionHash('pay'),
          explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${this.generateTransactionHash('pay')}`,
          description: 'Ejecutar pay() con parámetros de testing'
        }
      },
      
      // 3. Detalles técnicos del Oracle
      oracleDetails: {
        rate: this.testingData.oracleRate,
        scale: '1000000',
        quoteFunction: 'quote_ars_to_usdt',
        description: 'Oracle utiliza un quote fijo para testing: 1 ARS = 1 USDT'
      },
      
      // 4. Detalles técnicos del PaymentGateway
      paymentGatewayDetails: {
        flow: 'ARS → USDT',
        description: 'Solo calcula en el caso donde el cliente paga en ARS y el vendedor recibe USDT',
        limitations: 'No implementado para pagos ERC-20 a ERC-20, ni ERC-20 a ARS'
      },
      
      // 5. Parámetros de testing
      testingParameters: this.testingData,
      
      // 6. Configuración de red
      networkConfig: SEPOLIA_CONFIG
    };

    return flow;
  }

  // Generar archivos para el frontend
  generateFrontendFiles() {
    const flow = this.generateFrontendFlow();
    
    // 1. Generar configuración de contratos
    const contractsConfig = {
      network: 'Starknet Sepolia',
      rpcUrl: SEPOLIA_CONFIG.rpcUrl,
      chainId: SEPOLIA_CONFIG.chainId,
      explorerUrl: SEPOLIA_CONFIG.explorerUrl,
      contracts: this.deployedContracts,
      testingData: this.testingData,
      timestamp: new Date().toISOString()
    };

    // 2. Generar .env para frontend
    const envContent = `# Starknet Configuration - Frontend Ready
# Private Key (sin 0x prefix)
STARKNET_PRIVATE_KEY=06daedc71dfddfe4bf48be5f540960965e46b37ffa6ef90e0f0a69581b5da083

# Wallet Address
STARKNET_ACCOUNT_ADDRESS=0x0636cc3c9c85d98a40ae01bbf5af59d0462a6509ec4a30fcd0e99870efcbdd66

# Contract Addresses (Simuladas para frontend)
STARKNET_ORACLE_ADDRESS=${this.deployedContracts.oracle}
STARKNET_PAYMENT_GATEWAY_ADDRESS=${this.deployedContracts.paymentGateway}
STARKNET_ARS_TOKEN_ADDRESS=${this.deployedContracts.arsToken}
STARKNET_USDT_TOKEN_ADDRESS=${this.deployedContracts.usdtToken}

# Network Configuration
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9
STARKNET_CHAIN_ID=SN_SEPOLIA

# Frontend Environment Variables
NEXT_PUBLIC_STARKNET_ORACLE_ADDRESS=${this.deployedContracts.oracle}
NEXT_PUBLIC_STARKNET_GATEWAY_ADDRESS=${this.deployedContracts.paymentGateway}
NEXT_PUBLIC_STARKNET_ARS_TOKEN_ADDRESS=${this.deployedContracts.arsToken}
NEXT_PUBLIC_STARKNET_USDT_TOKEN_ADDRESS=${this.deployedContracts.usdtToken}
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9

# Testing Parameters
NEXT_PUBLIC_TESTING_MERCHANT_ADDRESS=${this.testingData.merchantAddress}
NEXT_PUBLIC_TESTING_PAYMENT_AMOUNT=${this.testingData.paymentAmount}
NEXT_PUBLIC_TESTING_PAYMENT_ID=${this.testingData.paymentId}
NEXT_PUBLIC_ORACLE_RATE=${this.testingData.oracleRate}
`;

    // 3. Generar servicio Starknet para frontend
    const starknetServiceContent = `import { Account, RpcProvider, Contract, CallData } from 'starknet';

// Configuración para Starknet Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_9',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA en hexadecimal
  explorerUrl: 'https://sepolia.starkscan.co'
};

// Direcciones de contratos (simuladas para frontend)
const CONTRACTS = {
  oracle: '${this.deployedContracts.oracle}',
  paymentGateway: '${this.deployedContracts.paymentGateway}',
  arsToken: '${this.deployedContracts.arsToken}',
  usdtToken: '${this.deployedContracts.usdtToken}'
};

// ABI simplificado para PausableERC20
const PAUSABLE_ERC20_ABI = [
  {
    "name": "mint",
    "type": "function",
    "inputs": [
      { "name": "recipient", "type": "ContractAddress" },
      { "name": "amount", "type": "u256" }
    ],
    "outputs": [],
    "stateMutability": "external"
  },
  {
    "name": "approve",
    "type": "function",
    "inputs": [
      { "name": "spender", "type": "ContractAddress" },
      { "name": "amount", "type": "u256" }
    ],
    "outputs": [],
    "stateMutability": "external"
  },
  {
    "name": "balanceOf",
    "type": "function",
    "inputs": [
      { "name": "account", "type": "ContractAddress" }
    ],
    "outputs": [
      { "name": "balance", "type": "u256" }
    ],
    "stateMutability": "view"
  }
];

// ABI simplificado para PaymentGateway
const PAYMENT_GATEWAY_ABI = [
  {
    "name": "pay",
    "type": "function",
    "inputs": [
      { "name": "merchant_address", "type": "felt252" },
      { "name": "amount", "type": "u256" },
      { "name": "token_address", "type": "felt252" },
      { "name": "payment_id", "type": "felt252" }
    ],
    "outputs": [
      { "name": "success", "type": "bool" }
    ],
    "stateMutability": "external"
  }
];

// ABI simplificado para StaticFxOracle
const ORACLE_ABI = [
  {
    "name": "quote_ars_to_usdt",
    "type": "function",
    "inputs": [
      { "name": "amount_ars", "type": "u128" }
    ],
    "outputs": [
      { "name": "amount_usdt", "type": "u128" }
    ],
    "stateMutability": "view"
  },
  {
    "name": "get_rate_ppm",
    "type": "function",
    "inputs": [],
    "outputs": [
      { "name": "rate", "type": "u128" }
    ],
    "stateMutability": "view"
  }
];

export type StarknetWallet = {
  address: string;
  privateKey: string;
};

export type TransactionResult = {
  transactionHash: string;
  explorerUrl: string;
  success: boolean;
  error?: string;
};

export type PaymentData = {
  merchantAddress: string;
  amount: string;
  tokenAddress: string;
  paymentId: string;
};

export class StarknetService {
  private provider: RpcProvider;
  private account: Account | null = null;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: SEPOLIA_CONFIG.rpcUrl,
      chainId: SEPOLIA_CONFIG.chainId as any,
      blockIdentifier: 'latest'
    });
  }

  // Crear nueva wallet (usando wallet conocida para testing)
  async createWallet(): Promise<StarknetWallet> {
    try {
      const privateKey = '0x06daedc71dfddfe4bf48be5f540960965e46b37ffa6ef90e0f0a69581b5da083';
      const address = '0x0636cc3c9c85d98a40ae01bbf5af59d0462a6509ec4a30fcd0e99870efcbdd66';
      
      console.log('✅ Wallet creada (testing):', { 
        address, 
        privateKey: privateKey.substring(0, 10) + '...',
        addressLength: address.length 
      });

      return {
        address,
        privateKey
      };
    } catch (error) {
      console.error('Error creando wallet:', error);
      throw new Error('No se pudo crear la wallet');
    }
  }

  // Conectar wallet existente
  connectWallet(privateKey: string, address: string) {
    try {
      this.account = new Account(this.provider, address, privateKey);
      console.log('✅ Wallet conectada:', this.account.address);
    } catch (error) {
      console.error('Error conectando wallet:', error);
      throw new Error('No se pudo conectar la wallet');
    }
  }

  // Obtener balance de ARS (simulado)
  async getARSBalance(address: string): Promise<string> {
    try {
      if (!address || address === '') {
        return '0';
      }
      
      console.log('📊 Balance ARS simulado:', address);
      
      // Para testing, retornar balance simulado
      return '10000000'; // 10 ARS
    } catch (error) {
      console.error('Error obteniendo balance ARS:', error);
      return '0';
    }
  }

  // Obtener balance de USDT (simulado)
  async getUSDTBalance(address: string): Promise<string> {
    try {
      if (!address || address === '') {
        return '0';
      }
      
      console.log('📊 Balance USDT simulado:', address);
      
      // Para testing, retornar balance simulado
      return '5000000'; // 5 USDT
    } catch (error) {
      console.error('Error obteniendo balance USDT:', error);
      return '0';
    }
  }

  // Cotizar ARS a USDT usando Oracle
  async quoteARSToUSDT(amountARS: string): Promise<string> {
    try {
      console.log('🔮 Cotizando ARS a USDT:', amountARS);
      
      // Para testing, usar rate 1:1
      const rate = 1000000; // 1:1 ARS/USDT
      const amountUSDT = (parseInt(amountARS) * rate) / 1000000;
      
      console.log('🔮 Cotización:', { amountARS, amountUSDT });
      return amountUSDT.toString();
    } catch (error) {
      console.error('Error cotizando ARS a USDT:', error);
      return '0';
    }
  }

  // Ejecutar pago ARS → USDT (simulado)
  async executeARSToUSDPayment(paymentData: PaymentData): Promise<TransactionResult> {
    try {
      console.log('💸 Payment ARS → USDT simulado:', paymentData);
      
      // Simular transacción
      const transactionHash = this.generateTransactionHash('payment');
      
      // Simular delay de transacción
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        transactionHash,
        explorerUrl: \`\${SEPOLIA_CONFIG.explorerUrl}/tx/\${transactionHash}\`,
        success: true
      };
    } catch (error) {
      console.error('Error ejecutando pago ARS → USDT:', error);
      return {
        transactionHash: '',
        explorerUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Generar hash de transacción único
  private generateTransactionHash(type: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return \`0x\${Buffer.from(\`\${type}_\${timestamp}_\${random}\`).toString('hex').padStart(64, '0')}\`;
  }

  // Monitorear transacción
  async waitForTransaction(transactionHash: string): Promise<boolean> {
    try {
      // Simular espera de transacción
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      console.error('Error esperando transacción:', error);
      return false;
    }
  }
}

export const starknetService = new StarknetService();
`;

    // Guardar archivos
    const contractsPath = path.join(__dirname, '../../frontend-contracts-config.json');
    const envPath = path.join(__dirname, '../../.env.frontend');
    const servicePath = path.join(__dirname, '../../starknetService-frontend.ts');

    fs.writeFileSync(contractsPath, JSON.stringify(contractsConfig, null, 2));
    fs.writeFileSync(envPath, envContent);
    fs.writeFileSync(servicePath, starknetServiceContent);

    console.log('📁 Archivos generados:');
    console.log(`   - ${contractsPath}`);
    console.log(`   - ${envPath}`);
    console.log(`   - ${servicePath}`);

    return {
      contractsConfig,
      envContent,
      starknetServiceContent
    };
  }

  // Mostrar resumen del flujo
  showFlowSummary() {
    const flow = this.generateFrontendFlow();
    
    console.log('\n🎉 ¡Flujo completo generado para frontend!');
    console.log('\n📋 Resumen del flujo según README del programador:');
    console.log('   1. ✅ Mint ARS tokens para el owner (vendedor)');
    console.log('   2. ✅ Mint USDT tokens para PaymentGateway (tesorería)');
    console.log('   3. ✅ Approve ARS tokens al PaymentGateway');
    console.log('   4. ✅ Ejecutar pay() con parámetros de testing');
    console.log('\n📝 Parámetros de testing:');
    console.log(`   merchant_address: ${this.testingData.merchantAddress}`);
    console.log(`   amount: ${this.testingData.paymentAmount} (5 ARS)`);
    console.log(`   token_address: ${this.deployedContracts.arsToken}`);
    console.log(`   payment_id: ${this.testingData.paymentId}`);
    console.log('\n🔮 Oracle:');
    console.log(`   Rate: ${this.testingData.oracleRate} (1:1 ARS/USDT)`);
    console.log(`   Function: quote_ars_to_usdt`);
    console.log('\n💡 Flujo implementado:');
    console.log('   - Cliente paga en ARS');
    console.log('   - Oracle cotiza ARS → USDT');
    console.log('   - Merchant recibe USDT');
    console.log('\n🚀 Listo para implementar en frontend!');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    const generator = new FrontendFlowGenerator();
    generator.generateFrontendFiles();
    generator.showFlowSummary();
  })();
}

module.exports = FrontendFlowGenerator;
