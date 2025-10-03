// Configuración de Cavos Aegis para MidatoPay

export const CAVOS_CONFIG = {
  // Network: 'sepolia' para testing, 'mainnet' para producción
  network: 'sepolia' as const,
  
  // ✅ App ID obtenido de aegis.cavos.xyz
  appId: 'app-a5b17a105d604090e051a297a8fad33d',
  
  // Para gasless transactions (opcional)
  paymasterApiKey: process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_KEY,
  
  // Logging en desarrollo
  enableLogging: process.env.NODE_ENV === 'development',
} as const

// Direcciones de contratos en Sepolia Testnet
export const CONTRACT_ADDRESSES = {
  // Payment Gateway (tu contrato)
  PAYMENT_GATEWAY: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  
  // Tokens en Sepolia
  TOKENS: {
    USDT: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH nativo
  }
} as const

// Tasas de conversión (en producción vendrían de una API de precios)
export const CONVERSION_RATES = {
  USDT: 1380, // 1 USDT = 1380 ARS
  BTC: 0.000023, // 1 BTC = ~58,000,000 ARS
  ETH: 0.00036, // 1 ETH = ~3,800,000 ARS
  STRK: 122, // 1 STRK = ~122 ARS
} as const

export type SupportedToken = keyof typeof CONVERSION_RATES
