'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth, useAuthActions } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  DollarSign, 
  CheckCircle,
  LogOut,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTransactions } from '@/hooks/useTransactions'
import { useUSDTBalance } from '@/hooks/useUSDTBalance'
import { useWalletManager } from '@/hooks/useWalletManager'
import { WalletSetup } from '@/components/WalletSetup'

// Componente interno que usa WalletManager
function DashboardContent() {
  const { user, token, isAuthenticated, isLoading } = useAuth()
  const { logout, setUser } = useAuthActions()
  const router = useRouter()
  const { wallet, account, isConnected, isLoading: walletLoading, error: walletError } = useWalletManager()
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions()
  const { balance: usdtBalance, isLoading: usdtBalanceLoading, error: usdtBalanceError } = useUSDTBalance(wallet?.address)
  
  const [stats, setStats] = useState({
    totalPayments: 5,
    pendingPayments: 1,
    completedPayments: 4,
    totalAmount: 207000, // ARS
    totalUSDT: 150,
    totalBTC: 0,
    totalETH: 0,
    // Nuevas métricas profesionales
    dailyVolume: 89500, // ARS del día
    weeklyGrowth: 23.5, // %
    monthlyRevenue: 850000, // ARS
    totalCommissions: 12.8, // USDT
    averageTransaction: 41400, // ARS
    conversionRate: 98.2, // %
    totalCustomers: 47,
    activeProducts: 12
  })

  // Estado para wallet Cavos (usando estado real de Cavos)
  const [merchantWallet, setMerchantWallet] = useState({
    isConnected: isConnected,
    address: wallet?.address || null,
    balance: null as string | null,
    isLoading: false
  })

  // Inicializar estado de wallet si ya existe una guardada
  useEffect(() => {
    if (wallet?.address && !merchantWallet.isConnected) {
      console.log('🔄 Inicializando wallet existente:', wallet.address)
      setMerchantWallet({
        isConnected: true,
        address: wallet.address,
        balance: '0.0 USDT',
        isLoading: false
      })
    }
  }, [wallet?.address])

  // Actualizar estado cuando cambie la wallet
  useEffect(() => {
    if (isConnected && wallet?.address) {
      setMerchantWallet(prev => ({
        ...prev,
        isConnected: true,
        address: wallet.address
      }))
    }
  }, [isConnected, wallet?.address])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    router.push('/')
  }

  // Funciones para manejar WalletManager
  const connectMerchantWallet = async () => {
    setMerchantWallet(prev => ({ ...prev, isLoading: true }))
    try {
      if (wallet?.address) {
        console.log('✅ Wallet ya configurada:', wallet.address)
        
        setMerchantWallet({
          isConnected: true,
          address: wallet.address,
          balance: '0.0 USDT',
          isLoading: false
        })
        
        toast.success('Wallet conectada exitosamente')
      } else {
        toast.error('No hay wallet configurada. Usa el componente WalletSetup.')
        setMerchantWallet(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Error conectando wallet')
      setMerchantWallet(prev => ({ ...prev, isLoading: false }))
    }
  }

  const disconnectMerchantWallet = async () => {
    try {
      // El WalletManager maneja la desconexión
      setMerchantWallet({
        isConnected: false,
        address: null,
        balance: null,
        isLoading: false
      })
      toast.success('Wallet desconectada')
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      toast.error('Error desconectando wallet')
    }
  }

  // Early returns después de todos los hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Mostrar WalletSetup si no hay wallet conectada
  if (!isConnected && !walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 flex items-center justify-center p-4">
        <WalletSetup />
      </div>
    );
  }

  return (
      <div className="min-h-screen" style={{ backgroundColor: '#FFF4EC' }}>
      {/* Header */}
        <header className="shadow-sm border-b" style={{ backgroundColor: '#FFF4EC', borderColor: 'rgba(44,44,44,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF8A33 100%)' }}>
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Kufam, sans-serif', color: '#2C2C2C', fontWeight: 700 }}>MidatoPay</h1>
                <p className="text-sm" style={{ color: '#B4B4B4', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Wallet Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full" style={{ 
                backgroundColor: merchantWallet.isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${merchantWallet.isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                <div className="w-2 h-2 rounded-full" style={{ 
                  backgroundColor: merchantWallet.isConnected ? '#10b981' : '#ef4444' 
                }}></div>
                <span className="text-xs font-medium" style={{ 
                  color: merchantWallet.isConnected ? '#10b981' : '#ef4444' 
                }}>
                  {merchantWallet.isConnected ? 'Wallet Conectada' : 'Wallet Desconectada'}
                </span>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{user.name}</p>
                <p className="text-xs" style={{ color: '#5d5d5d' }}>{user.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: '#1a1a1a' }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - Welcome and Total Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-end justify-between">
            {/* Welcome Section */}
                     <div style={{ marginTop: '48px' }}>
                       <h2 className="mb-0" style={{ fontFamily: 'Kufam, sans-serif', color: '#2C2C2C', fontWeight: 500, fontSize: '24px', marginBottom: '-10px' }}>
                         ¡Bienvenido,
                       </h2>
                       <h2 className="mb-0" style={{ fontFamily: 'Kufam, sans-serif', color: '#FF6A00', fontWeight: 600, fontSize: '62px' }}>
                         Café Meka!
          </h2>
                     </div>
            
            {/* Total Balance Card */}
            <Card style={{ backgroundColor: '#FFFFFF', border: '3px solid transparent', background: 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, #FF6A00, #FF8A33) border-box', boxShadow: '0px 6px 20px rgba(255,106,0,0.25)', borderRadius: '16px' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#E3F2FD' }}>
                    <img src="/logo-arg.png" alt="Argentina" className="w-8 h-8" />
                  </div>
                           <div className="flex-1">
                             <p className="text-base font-medium" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Saldo Total:</p>
                             <p className="text-3xl font-bold" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>
                               $ 0
                             </p>
                           </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" style={{ color: '#8B8B8B' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 500 }}>--</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Saldos en Criptomonedas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div style={{ backgroundColor: '#2C2C2C', borderRadius: '20px', padding: '32px' }}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold" style={{ color: '#FFFFFF', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Saldo en Criptomonedas:</h4>
              <button className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FF6A00', color: '#FFFFFF', fontFamily: 'Kufam, sans-serif', fontWeight: 500, borderRadius: '8px', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filtrar</span>
                </div>
              </button>
            </div>
            
            <div style={{ backgroundColor: '#FFF9F5', border: '1.8px solid #FF6A00', borderRadius: '14px', boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.08)', padding: '24px' }}>
              {/* USDT Card */}
              <div className="flex items-center justify-between" style={{ padding: '16px 0' }}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009393' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <g clipPath="url(#USDT_real)">
                            <path fill="#009393" d="M24 0H0v24h24z"/>
                            <path fill="#fff" d="m12 18.4-8-7.892L7.052 5.6h9.896L20 10.508zm.8-7.2v-.976c1.44.072 2.784.352 3.2.716-.484.424-2.216.732-4 .732s-3.516-.308-4-.732c.412-.364 1.76-.64 3.2-.72v.98zM8 10.936v.588c.412.364 1.756.64 3.2.72V14.4h1.6v-2.16c1.44-.072 2.788-.352 3.2-.716v-1.172c-.412-.364-1.76-.644-3.2-.72V8.8h2.4V7.6H8.8v1.2h2.4v.832c-1.444.076-2.788.356-3.2.72z"/>
                          </g>
                          <defs>
                            <clipPath id="USDT_real">
                              <path fill="#fff" d="M0 0h24v24H0z"/>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-bold" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>USDT</h5>
                        <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Tether</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-16">
                      <div className="text-left">
                        <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Saldo</p>
                        <p className="font-bold text-lg" style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif', fontWeight: 500 }}>
                          {usdtBalanceLoading ? '...' : usdtBalanceError ? '--' : `${usdtBalance.toFixed(6)}`}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Tipo de cambio</p>
                        <p className="font-bold text-lg" style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif', fontWeight: 500 }}>--</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Pesos Argentinos</p>
                        <p className="font-bold text-lg" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif', fontWeight: 500 }}>--</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" style={{ color: '#8B8B8B' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 500 }}>--</span>
                    </div>
              </div>
                </div>
          </div>
          </motion.div>

        {/* Sección de Información de Wallet - Solo mostrar cuando esté conectada */}
        {merchantWallet.isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card style={{ 
              backgroundColor: 'rgba(16,185,129,0.05)', 
              borderColor: 'rgba(16,185,129,0.2)', 
              boxShadow: '0 10px 30px rgba(16,185,129,0.1)', 
              backdropFilter: 'blur(10px)' 
            }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <span style={{ color: '#1a1a1a', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Información de Wallet</span>
                </CardTitle>
                <CardDescription style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                  Detalles de tu wallet Cavos Aegis conectada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dirección */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2" style={{ fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Dirección</h4>
                    <p className="text-sm font-mono text-green-800 break-all" style={{ fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                      {merchantWallet.address}
                    </p>
                    <p className="text-xs text-green-600 mt-1" style={{ fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Dirección de tu wallet</p>
                  </div>
                  
                  {/* Red */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2" style={{ fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Red</h4>
                    <p className="text-lg font-bold text-purple-900" style={{ fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Starknet Sepolia</p>
                    <p className="text-sm text-purple-700" style={{ fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Testnet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold" style={{ color: '#1a1a1a', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Centro de Control</h3>
            <p className="text-sm" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Gestiona tu negocio desde aquí</p>
          </div>
          
          {/* Acciones Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group cursor-pointer hover:scale-105 transition-all duration-200" style={{ 
              background: 'linear-gradient(135deg, rgba(254,108,28,0.15) 0%, rgba(254,108,28,0.08) 100%)', 
              border: '1px solid #fe6c1c',
              boxShadow: '0 4px 12px rgba(254,108,28,0.2)'
            }}>
              <Link href="/dashboard/create-payment">
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg,#fe6c1c,#fe9c42)' }}>
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#1a1a1a', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Crear Pago</p>
                  <p className="text-xs mt-1" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>QR Instantáneo</p>
                </CardContent>
              </Link>
            </Card>

            {/* Wallet Cavos */}
            <Card className="group cursor-pointer hover:scale-105 transition-all duration-200" style={{ 
              backgroundColor: '#fff5f0', 
              borderColor: merchantWallet.isConnected ? '#fe6c1c' : '#5d5d5d', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
              backdropFilter: 'blur(10px)' 
            }}>
              <CardContent className="p-4 text-center" onClick={merchantWallet.isConnected ? disconnectMerchantWallet : connectMerchantWallet}>
                <div className="flex justify-center mb-3">
                  <div className="p-2 rounded-lg" style={{ 
                    background: merchantWallet.isConnected 
                      ? 'linear-gradient(135deg,#fe6c1c,#fe9c42)' 
                      : 'linear-gradient(135deg,#5d5d5d,#5d5d5d)' 
                  }}>
                    <Wallet className="w-5 h-5 text-white" />
          </div>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>
                  {merchantWallet.isConnected ? 'Wallet Conectada' : 'Conectar Wallet'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                  {merchantWallet.isConnected ? 'Cavos Aegis' : 'Cavos Aegis'}
                </p>
                {merchantWallet.isLoading && (
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-xs mt-1" style={{ color: '#5d5d5d' }}>
                      {merchantWallet.isConnected ? 'Desconectando...' : 'Conectando...'}
                    </p>
              </div>
                )}
                {!merchantWallet.isLoading && !merchantWallet.isConnected && (
                  <p className="text-xs mt-2" style={{ color: '#5d5d5d' }}>
                    Click para conectar
                  </p>
                )}
                {!merchantWallet.isLoading && merchantWallet.isConnected && (
                  <p className="text-xs mt-2" style={{ color: '#fe6c1c' }}>
                    Click para desconectar
                  </p>
                )}
            </CardContent>
          </Card>
          </div>
        </motion.div>

        {/* Movimientos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Movimientos</h3>
            <p className="text-sm" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>Historial de transacciones</p>
                </div>

            <Card style={{ 
              backgroundColor: '#fff5f0', 
              borderColor: '#fec665', 
              boxShadow: '0 10px 30px rgba(254,108,28,0.08)', 
              backdropFilter: 'blur(10px)' 
            }}>
            <CardContent className="p-6">
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-sm" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                    Cargando movimientos...
                  </p>
                </div>
              ) : transactionsError ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium mb-2" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Error al cargar</h4>
                  <p className="text-sm" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                    {transactionsError}
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(254,108,28,0.1)' }}>
                    <svg className="w-8 h-8" style={{ color: '#fe6c1c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium mb-2" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 700 }}>Sin movimientos aún</h4>
                  <p className="text-sm" style={{ color: '#5d5d5d', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                    Las transferencias exitosas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-white rounded-lg border" style={{ borderColor: 'rgba(254,108,28,0.2)' }}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: transaction.status === 'CONFIRMED' ? '#10B981' : '#F59E0B' }}>
                          {transaction.status === 'CONFIRMED' ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif', fontWeight: 600 }}>
                            {transaction.payment.concept}
                          </h5>
                          <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                            {new Date(transaction.createdAt).toLocaleDateString('es-AR')} {new Date(transaction.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif', fontWeight: 600 }}>
                          ${transaction.amount.toLocaleString('es-AR')} ARS
                        </p>
                        <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontWeight: 400 }}>
                          → {transaction.finalAmount.toFixed(6)} {transaction.finalCurrency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}

// Componente principal que envuelve todo con AegisProvider
export default function DashboardPage() {
  return <DashboardContent />
}