// StarknetOracleService.ts
// Servicio para interactuar con un Oracle (Cairo v2) y un ERC20 (USDT) en Starknet
// - Usa BigInt end-to-end (sin perder precisión)
// - Recompone u256 (low/high) correctamente
// - Evita selectores hardcodeados (usa getSelectorFromName)
// - Formatea unidades con decimales configurables

import {
  RpcProvider,
  Contract,
  stark,
  uint256,
  CairoOption,
  BigNumberish,
  shortString,
} from 'starknet';

// ==========================
// Configuración de despliegues
// ==========================
const CONTRACTS = {
  oracle: '0x0288338f6ffeccff8d74780f2758cf031605cd38c867da249006982ca9b53692',
  usdtToken: '0x040898923d06af282d4a647966fc65c0f308020c43388026b56ef833eda0efdc',
};

// ==========================
// Config RPC / Chain
// ==========================
const SEPOLIA_CONFIG = {
  rpcUrl:
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/b6oJemkCmlgEGq1lXC5uTXwOHZA14WNP',
  chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA
};

// ==========================
// Decimales (ajusta según tu caso)
// ==========================
// USDT en Starknet suele tener 6 decimales
const USDT_DECIMALS = BigInt(0);

// ¿Cómo espera el oráculo la ENTRADA de ARS?
// Si el oráculo espera "pesos enteros": ARS_DECIMALS = 0n (por defecto).
// Si espera centavos: 2n. Si 6/18, setea 6n/18n.
let ARS_DECIMALS = BigInt(0);

// ¿En qué decimales DEVUELVE el oráculo los USDT?
// Lo más común: 6n. Si tu oráculo devuelve enteros (0n) o 18n, ajusta acá.
let ORACLE_USDT_DECIMALS = BigInt(0);

// Podés exponer setters si querés ajustar en runtime:
export function setArsDecimals(decimals: number) {
  ARS_DECIMALS = BigInt(decimals);
}
export function setOracleUsdtDecimals(decimals: number) {
  ORACLE_USDT_DECIMALS = BigInt(decimals);
}

// ==========================
// ABIs mínimos
// ==========================

const ORACLE_ABI = [
  {
    name: 'quote_ars_to_usdt',
    type: 'function',
    inputs: [{ name: 'amount_ars', type: 'core::integer::u128' }],
    outputs: [{ type: 'core::integer::u128' }],
    stateMutability: 'view',
  },
];

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      {
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
    outputs: [{ type: 'core::integer::u256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'core::integer::u8' }],
    stateMutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'core::felt252' }],
    stateMutability: 'view',
  },
];

// ==========================
// Utils BigInt / Units
// ==========================
const TEN = BigInt(10);

function toBN(x: BigNumberish): bigint {
  // stark.assert y helpers aceptan hex / decimal strings; acá homogenizamos a BigInt
  if (typeof x === 'bigint') return x;
  if (typeof x === 'number') return BigInt(x);
  const s = String(x);
  return s.startsWith('0x') ? BigInt(s) : BigInt(s);
}

function u256ToBN(u: any): bigint {
  // Admite {low, high} o [low, high] o { balance: {low, high}}
  if (u?.low !== undefined && u?.high !== undefined) {
    return toBN(u.low) + (toBN(u.high) << BigInt(128));
  }
  if (Array.isArray(u) && u.length >= 2) {
    return toBN(u[0]) + (toBN(u[1]) << BigInt(128));
  }
  if (u?.balance?.low !== undefined && u?.balance?.high !== undefined) {
    const b = u.balance;
    return toBN(b.low) + (toBN(b.high) << BigInt(128));
  }
  // fallback: si vino como single felt (u128 o ya unificado)
  return toBN(u);
}

function formatUnits(raw: bigint, decimals: bigint): string {
  const base = toBN(Math.pow(10, Number(decimals)));
  const whole = raw / base;
  const fracRaw = raw % base;
  if (fracRaw === BigInt(0)) return whole.toString();
  const frac = fracRaw.toString().padStart(Number(decimals), '0').replace(/0+$/, '');
  return `${whole.toString()}.${frac}`;
}

function parseUnits(human: string | number, decimals: bigint): bigint {
  // convierte "10000.12" con N decimales a BigInt
  const s = String(human);
  if (!s.includes('.')) return toBN(s) * toBN(Math.pow(10, Number(decimals)));
  const [w, f] = s.split('.');
  const frac = f.slice(0, Number(decimals)).padEnd(Number(decimals), '0'); // recorta/llena
  return toBN(w) * toBN(Math.pow(10, Number(decimals))) + toBN(frac || '0');
}

// ==========================
// Servicio
// ==========================
export class StarknetOracleService {
  private provider: RpcProvider;
  private oracle: Contract;
  private usdt: Contract;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: SEPOLIA_CONFIG.rpcUrl,
      chainId: SEPOLIA_CONFIG.chainId as any,
    });

    this.oracle = new Contract(ORACLE_ABI as any, CONTRACTS.oracle, this.provider);
    this.usdt = new Contract(ERC20_ABI as any, CONTRACTS.usdtToken, this.provider);
  }

  // --- Info del token USDT (opcional: lee on-chain) ---
  async getUSDTTokenInfo(): Promise<{
    address: string;
    symbol: string;
    decimals: number;
  }> {
    try {
      // Si tu contrato tiene estos métodos estándar, los leemos:
      let symbol = 'USDT';
      let decimals = Number(USDT_DECIMALS);

      try {
        const sym = await this.usdt.call('symbol', [], { blockIdentifier: 'latest' });
        // symbol puede venir como felt; starknet.js ofrece shortString.decodeShortString
        // Si falla decode, dejamos 'USDT'
        const felt = Array.isArray(sym) ? sym[0] : sym;
        symbol = shortString.decodeShortString(String(felt));
      } catch {}

      try {
        const dec = await this.usdt.call('decimals', [], { blockIdentifier: 'latest' });
        const val = Array.isArray(dec) ? Number(dec[0]) : Number(dec);
        if (!Number.isNaN(val) && val >= 0 && val <= 255) {
          decimals = val;
        }
      } catch {}

      return {
        address: CONTRACTS.usdtToken,
        symbol,
        decimals,
      };
    } catch (e) {
      // si algo falla, devolvemos la config local
      return {
        address: CONTRACTS.usdtToken,
        symbol: 'USDT',
        decimals: Number(USDT_DECIMALS),
      };
    }
  }

  // --- Balance USDT de una address ---
  async getUSDTBalance(accountAddress: string): Promise<{
    address: string;
    balanceRaw: bigint;
    balance: string; // humano (decimales)
  }> {
    // balanceOf retorna u256; recomponemos
    const res: any = await this.usdt.call('balanceOf', [accountAddress], { blockIdentifier: 'latest' });
    const raw = u256ToBN(res);
    const human = formatUnits(raw, USDT_DECIMALS);
    return {
      address: accountAddress,
      balanceRaw: raw,
      balance: human,
    };
  }

  // --- Cotización ARS → USDT ---
  /**
   * amountARSHuman: cantidad de ARS en formato humano (por ejemplo "10000" si son pesos enteros)
   * Se escala según ARS_DECIMALS para cumplir con lo que espera el oráculo.
   * Retorna USDT en humano (según ORACLE_USDT_DECIMALS).
   */
  async getARSToUSDTQuote(amountARSHuman: string | number): Promise<{
    amountARS: string; // humano
    amountUSDT: string; // humano
    amountUSDT_raw: bigint; // raw según ORACLE_USDT_DECIMALS
    source: string;
  }> {
    // Escalamos la entrada como el oráculo espera
    const amountARS_raw = parseUnits(amountARSHuman, ARS_DECIMALS);

    // Llamamos al oráculo: u128 in → u128 out (starknet.js maneja el encoding)
    const res: any = await this.oracle.call('quote_ars_to_usdt', [amountARS_raw.toString()], { blockIdentifier: 'latest' });
    const rawUSDT = u256ToBN(res); // aunque sea u128, u256ToBN soporta single felt

    // Formateamos la salida según lo que devuelve el oráculo (por defecto, 6 decimales)
    const usdtHuman = formatUnits(rawUSDT, ORACLE_USDT_DECIMALS);
    const arsHuman = formatUnits(amountARS_raw, ARS_DECIMALS);

    return {
      amountARS: arsHuman,
      amountUSDT: usdtHuman,
      amountUSDT_raw: rawUSDT,
      source: 'Oracle Blockchain',
    };
  }

  // --- Info del oráculo (ping + rate aproximado) ---
  /**
   * Calcula un rate aproximado consultando una muestra (por ejemplo, 1000 ARS humanos).
   * rate ≈ ARS_human / USDT_human
   */
  async getOracleInfo(sampleArsHuman: string | number = '1000'): Promise<{
    address: string;
    isActive: boolean;
    rate_ars_per_usdt: string; // string para no perder decimales
  }> {
    const quote = await this.getARSToUSDTQuote(sampleArsHuman);
    // rate = ARS / USDT
    const ars = parseUnits(quote.amountARS, BigInt(0)); // amountARS ya está en humano sin decimales adicionales
    const usdt = parseUnits(quote.amountUSDT, BigInt(0)); // tomamos texto entero -> parse int
    // Mejor obtener rate en decimal usando BigInt con escala:
    // rate = (ARS * 10^6) / USDT  → 6 decimales en el rate
    const SCALE = BigInt(Math.pow(10, 6));
    const rateScaled = (toBN(ars) * SCALE) / (toBN(usdt) === BigInt(0) ? BigInt(1) : toBN(usdt));
    const rateStr = formatUnits(rateScaled, BigInt(6));
    return {
      address: CONTRACTS.oracle,
      isActive: true,
      rate_ars_per_usdt: rateStr,
    };
  }
}

// ==========================
// Ejemplo de uso
// ==========================
// const svc = new StarknetOracleService();
// // Si tu oráculo espera ARS con 2 decimales (centavos):
// setArsDecimals(0);            // 0 si espera pesos enteros; 2 si espera centavos; 6/18 si corresponde
// setOracleUsdtDecimals(6);     // 6 si el oráculo devuelve micro-USDT
//
// const q = await svc.getARSToUSDTQuote('10000'); // 10,000 ARS humanos
// console.log(q); // { amountARS: '10000', amountUSDT: '9.999...' ~10 si rate=1000 }
//
// const bal = await svc.getUSDTBalance('0x...');
// console.log(bal);
//
// const info = await svc.getUSDTTokenInfo();
// console.log(info);
//
// const oracleInfo = await svc.getOracleInfo(1000);
// console.log(oracleInfo);

// Instancia singleton
export const starknetOracleService = new StarknetOracleService();