import { Account, RpcProvider, Contract, CallData } from 'starknet';

// Configuración para Starknet Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_9',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA en hexadecimal
  explorerUrl: 'https://sepolia.starkscan.co'
};

// Direcciones de contratos (simuladas para frontend)
const CONTRACTS = {
  oracle: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  paymentGateway: '0x023456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  arsToken: '0x03456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  usdtToken: '0x0456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
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
        explorerUrl: `${SEPOLIA_CONFIG.explorerUrl}/tx/${transactionHash}`,
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
    return `0x${Buffer.from(`${type}_${timestamp}_${random}`).toString('hex').padStart(64, '0')}`;
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
