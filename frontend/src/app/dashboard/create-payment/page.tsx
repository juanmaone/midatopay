'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
// import { useAegis } from '@cavos/aegis'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/store/auth'
import { ArrowLeft, QrCode, DollarSign, FileText, Hash, X, Copy, Download } from 'lucide-react'
import Link from 'next/link'

const createPaymentSchema = z.object({
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  concept: z.string().min(1, 'El concepto es requerido'),
  orderId: z.string().optional(),
  receiveCurrency: z.enum(['USDT', 'BTC', 'ETH', 'STRK']).default('STRK'),
})

type CreatePaymentForm = z.infer<typeof createPaymentSchema>

export default function CreatePaymentPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [createdPayment, setCreatedPayment] = useState<any>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCountdown, setQrCountdown] = useState(0)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreatePaymentForm>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: undefined,
      concept: '',
      orderId: '',
      receiveCurrency: 'STRK',
    },
  })

  const watchedAmount = watch('amount')
  const watchedConcept = watch('concept')
  const watchedReceiveCurrency = watch('receiveCurrency')

  // Función para calcular la conversión de ARS a criptomoneda
  const getConversionRate = (currency: string) => {
    const rates: { [key: string]: number } = {
      'USDT': 1380, // 1 USDT = 1380 ARS
      'BTC': 0.000023, // 1 BTC = ~58,000,000 ARS (aproximado)
      'ETH': 0.00036, // 1 ETH = ~3,800,000 ARS (aproximado)
      'STRK': 122, // 1 STRK = ~122 ARS (aproximado)
    }
    return rates[currency] || 1380
  }

  const getConvertedAmount = (amount: any, currency: string) => {
    // Validar que amount sea un número válido y positivo
    const numAmount = Number(amount)
    if (!amount || amount === '' || isNaN(numAmount) || numAmount <= 0) {
      return null
    }
    
    const rate = getConversionRate(currency)
    if (currency === 'BTC' || currency === 'ETH') {
      return (numAmount / rate).toFixed(8)
    } else if (currency === 'STRK') {
      return (numAmount / rate).toFixed(6)
    }
    return (numAmount / rate).toFixed(2)
  }

  // Función para iniciar el countdown del QR
  const startQRCountdown = () => {
    setQrCountdown(30)
    setIsGeneratingQR(true)
    
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsGeneratingQR(false)
          generateNewQR()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Función para generar nuevo QR
  const generateNewQR = async () => {
    if (!createdPayment) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/regenerate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`,
        },
        body: JSON.stringify({ paymentId: createdPayment.id }),
      })

      const result = await response.json()
      if (response.ok) {
        setCreatedPayment(result.payment)
        // Reiniciar el countdown después de mostrar el nuevo QR
        setTimeout(() => {
          startQRCountdown()
        }, 1000)
      }
    } catch (error) {
      console.error('Error regenerating QR:', error)
    }
  }

  const onSubmit = async (data: CreatePaymentForm) => {
    if (!isAuthenticated) {
      toast.error('Debes estar autenticado para crear pagos')
      return
    }

    setIsCreating(true)
    try {
      // Preparar datos con información de conversión
      const paymentData = {
        ...data,
        amountARS: data.amount, // Monto original en ARS
        receiveAmount: getConvertedAmount(data.amount, data.receiveCurrency), // Monto convertido
        receiveCurrency: data.receiveCurrency,
        conversionRate: getConversionRate(data.receiveCurrency)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`,
        },
        body: JSON.stringify(paymentData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear el pago')
      }

      setCreatedPayment(result.payment)
      setShowQRModal(true)
      // Iniciar countdown después de mostrar el QR
      setTimeout(() => {
        startQRCountdown()
      }, 1000)
      toast.success('¡Pago creado exitosamente!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el pago')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f6' }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ backgroundColor: '#f7f7f6', borderColor: 'rgba(26,26,26,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="sm" style={{ color: '#1a1a1a' }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fe6c1c 0%, #fe9c42 100%)' }}>
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Gromm, sans-serif', color: '#1a1a1a' }}>Crear Pago</h1>
                <p className="text-sm" style={{ color: '#5d5d5d' }}>Genera códigos QR para tus ventas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card style={{ backgroundColor: 'rgba(247, 247, 246, 0.15)', borderColor: 'rgba(254,108,28,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backdropFilter: 'blur(10px)' }}>
              <CardHeader>
                <CardTitle style={{ color: '#1a1a1a', fontFamily: 'Gromm, sans-serif' }}>Detalles del Pago</CardTitle>
                <CardDescription style={{ color: '#5d5d5d' }}>
                  Completa la información para generar el código QR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Monto */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" style={{ color: '#1a1a1a', fontWeight: '500' }}>Monto</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#fe6c1c' }} />
                      <img 
                        src="/logo-arg.png" 
                        alt="ARS" 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6"
                      />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register('amount', { valueAsNumber: true })}
                        className={`pl-12 pr-12 h-12 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${errors.amount ? 'border-red-500' : ''}`}
                        style={{ 
                          backgroundColor: 'rgba(247, 247, 246, 0.8)', 
                          border: '1px solid rgba(254,108,28,0.2)',
                          color: '#1a1a1a'
                        }}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-500">{errors.amount.message}</p>
                    )}
                  </div>

                  {/* Concepto */}
                  <div className="space-y-2">
                    <Label htmlFor="concept" style={{ color: '#1a1a1a', fontWeight: '500' }}>Concepto</Label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#fe6c1c' }} />
                      <Input
                        id="concept"
                        type="text"
                        placeholder="Ej: Café, Almuerzo, Producto..."
                        {...register('concept')}
                        className={`pl-12 h-12 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${errors.concept ? 'border-red-500' : ''}`}
                        style={{ 
                          backgroundColor: 'rgba(247, 247, 246, 0.8)', 
                          border: '1px solid rgba(254,108,28,0.2)',
                          color: '#1a1a1a'
                        }}
                      />
                    </div>
                    {errors.concept && (
                      <p className="text-sm text-red-500">{errors.concept.message}</p>
                    )}
                  </div>

                  {/* ID de Orden */}
                  <div className="space-y-2">
                    <Label htmlFor="orderId" style={{ color: '#1a1a1a', fontWeight: '500' }}>ID de Orden (opcional)</Label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#fe6c1c' }} />
                      <Input
                        id="orderId"
                        type="text"
                        placeholder="ORD-001, MESA-5..."
                        {...register('orderId')}
                        className="pl-12 h-12 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                        style={{ 
                          backgroundColor: 'rgba(247, 247, 246, 0.8)', 
                          border: '1px solid rgba(254,108,28,0.2)',
                          color: '#1a1a1a'
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: '#5d5d5d' }}>
                      Identificador interno para tu referencia
                    </p>
                  </div>

                  {/* Cripto a Recibir */}
                  <div className="space-y-2">
                    <Label htmlFor="receiveCurrency" style={{ color: '#1a1a1a', fontWeight: '500' }}>Cripto a Recibir</Label>
                    <div className="relative">
                      <select
                        {...register('receiveCurrency')}
                        className="w-full h-12 px-4 py-3 pr-12 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none cursor-pointer"
                        style={{ 
                          backgroundColor: 'rgba(247, 247, 246, 0.8)', 
                          border: '1px solid rgba(254,108,28,0.2)',
                          color: '#1a1a1a'
                        }}
                      >
                        <option value="USDT">USDT (Tether)</option>
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="STRK">Starknet (STRK)</option>
                      </select>
                      {/* Logo de la criptomoneda seleccionada */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {watchedReceiveCurrency === 'USDT' && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009393' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path fill="#fff" d="m12 18.4-8-7.892L7.052 5.6h9.896L20 10.508zm.8-7.2v-.976c1.44.072 2.784.352 3.2.716-.484.424-2.216.732-4 .732s-3.516-.308-4-.732c.412-.364 1.76-.64 3.2-.72v.98zM8 10.936v.588c.412.364 1.756.64 3.2.72V14.4h1.6v-2.16c1.44-.072 2.788-.352 3.2-.716v-1.172c-.412-.364-1.76-.644-3.2-.72V8.8h2.4V7.6H8.8v1.2h2.4v.832c-1.444.076-2.788.356-3.2.72z"/>
                            </svg>
                          </div>
                        )}
                        {watchedReceiveCurrency === 'BTC' && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F7931A' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path fill="#fff" d="M18.763 10.236c.28-1.895-1.155-2.905-3.131-3.591l.64-2.553-1.56-.389-.623 2.49-1.245-.297.631-2.508L11.915 3l-.641 2.562-.992-.234v-.01l-2.157-.54-.415 1.668s1.155.272 1.137.28c.631.163.74.578.722.903l-.722 2.923.162.054-.171-.036-1.02 4.087c-.072.19-.27.478-.712.36.018.028-1.128-.27-1.128-.27l-.776 1.778 2.03.505 1.11.289-.65 2.59 1.56.387.633-2.562 1.253.324-.64 2.554 1.56.388.641-2.59c2.662.505 4.665.308 5.505-2.102.676-1.94-.037-3.05-1.435-3.79 1.02-.225 1.786-.902 1.985-2.282zm-3.564 4.999c-.479 1.94-3.745.884-4.8.63l.857-3.436c1.055.27 4.448.784 3.943 2.796zm.478-5.026c-.433 1.76-3.158.866-4.033.65l.775-3.113c.885.217 3.718.632 3.258 2.463"/>
                            </svg>
                          </div>
                        )}
                        {watchedReceiveCurrency === 'ETH' && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#627eea' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <g clipPath="url(#ETH_a_dropdown)">
                                <path fill="#627eea" d="M24 0H0v24h24z"/>
                                <path fill="#fff" d="M12 4v5.912l5 2.236z"/>
                                <path fill="#fff" d="m12 4-5 8.148 5-2.236z"/>
                                <path fill="#fff" d="M12 15.98V20l5-6.92z"/>
                                <path fill="#fff" d="M12 20v-4.02l-5-2.9z"/>
                                <path fill="#fff" d="m12 15.048 5-2.9-5-2.236z"/>
                                <path fill="#fff" d="m7 12.148 5 2.9V9.912z"/>
                              </g>
                              <defs>
                                <clipPath id="ETH_a_dropdown">
                                  <path fill="#fff" d="M0 0h24v24H0z"/>
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        )}
                        {watchedReceiveCurrency === 'STRK' && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#EC796B' }}>
                            <img 
                              src="/starknet-logo.png" 
                              alt="Starknet" 
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                        )}
                      </div>
                      {/* Flecha del dropdown */}
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4" style={{ color: '#fe6c1c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {getConvertedAmount(watchedAmount, watchedReceiveCurrency) && (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <p className="text-sm" style={{ color: '#10b981' }}>
                          <span className="font-semibold">Recibirás:</span> {getConvertedAmount(watchedAmount, watchedReceiveCurrency)} {watchedReceiveCurrency}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#5d5d5d' }}>
                          Tipo de cambio: 1 {watchedReceiveCurrency} = {getConversionRate(watchedReceiveCurrency).toLocaleString()} ARS
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botón de envío */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-200"
                    disabled={isCreating}
                    style={{ 
                      backgroundColor: '#fe6c1c', 
                      color: '#ffffff', 
                      border: 'none',
                      fontFamily: 'Gromm, sans-serif'
                    }}
                  >
                    {isCreating ? 'Creando pago...' : 'Crear Pago'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview y QR */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Preview del pago */}
            <Card style={{ backgroundColor: 'rgba(247, 247, 246, 0.15)', borderColor: 'rgba(254,108,28,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backdropFilter: 'blur(10px)' }}>
              <CardHeader>
                <CardTitle style={{ color: '#1a1a1a', fontFamily: 'Gromm, sans-serif' }}>Vista Previa</CardTitle>
                <CardDescription style={{ color: '#5d5d5d' }}>
                  Así se verá el pago para tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #fe6c1c 0%, #fe9c42 100%)' }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {watchedConcept || 'Concepto del pago'}
                    </h3>
                    <p className="text-3xl font-bold mb-4">
                      ${watchedAmount || '0'} ARS
                    </p>
                    <p className="text-sm opacity-90">
                      Escanea el QR para pagar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Información adicional */}
            <Card style={{ backgroundColor: 'rgba(247, 247, 246, 0.15)', borderColor: 'rgba(254,108,28,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backdropFilter: 'blur(10px)' }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: '#1a1a1a', fontFamily: 'Gromm, sans-serif' }}>Informacion del Pago</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3" style={{ color: '#5d5d5d' }}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fe6c1c' }}></div>
                  <p>El código QR expira en 30 minutos</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fe6c1c' }}></div>
                  <p>Los clientes siempre pagan en ARS</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fe6c1c' }}></div>
                  <p>La conversión se hace automáticamente al mejor precio</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fe6c1c' }}></div>
                  <p>El QR se renueva automáticamente cada 30 segundos</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fe6c1c' }}></div>
                  <p>Recibirás la notificación cuando se complete el pago</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal QR Code */}
      {showQRModal && createdPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#1a1a1a', fontFamily: 'Gromm, sans-serif' }}>¡Pago Creado!</h2>
                  <p className="text-sm" style={{ color: '#5d5d5d' }}>Comparte este código QR</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQRModal(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Contenido del QR */}
            <div className="text-center space-y-6">
              {/* QR Code */}
              <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
                <img
                  src={createdPayment.qrCode}
                  alt="QR Code del pago"
                  className="w-64 h-64 mx-auto"
                />
                {qrCountdown > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(254, 108, 28, 0.1)', border: '1px solid rgba(254, 108, 28, 0.2)' }}>
                    <p className="text-sm" style={{ color: '#fe6c1c' }}>
                      <span className="font-semibold">QR se renovará en:</span> {qrCountdown} segundos
                    </p>
                  </div>
                )}
                {isGeneratingQR && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(254, 108, 28, 0.1)', border: '1px solid rgba(254, 108, 28, 0.2)' }}>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin"></div>
                      <p className="text-sm" style={{ color: '#fe6c1c' }}>
                        Generando nuevo QR...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Información del pago (lo que ve el cliente) */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold" style={{ color: '#1a1a1a' }}>
                  {createdPayment.concept}
                </h3>
                <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                  ${createdPayment.amountARS || createdPayment.amount} ARS
                </p>
                {createdPayment.orderId && (
                  <p className="text-sm" style={{ color: '#5d5d5d' }}>
                    Orden: {createdPayment.orderId}
                  </p>
                )}
              </div>


              {/* Botones de acción */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => {
                    navigator.clipboard.writeText(createdPayment.qrCode)
                    toast.success('QR copiado al portapapeles')
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar QR
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl"
                  style={{ backgroundColor: '#fe6c1c', color: '#ffffff' }}
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = createdPayment.qrCode
                    link.download = `pago-${createdPayment.id}.png`
                    link.click()
                    toast.success('QR descargado')
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>

              {/* Información adicional */}
              <div className="text-xs space-y-1" style={{ color: '#5d5d5d' }}>
                <p>Expira: {new Date(createdPayment.expiresAt).toLocaleString('es-AR')}</p>
                <p>ID: {createdPayment.id}</p>
              </div>

              {/* Botón cerrar */}
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => setShowQRModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
