'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/store/auth'
import { ArrowLeft, QrCode, DollarSign } from 'lucide-react'
import Link from 'next/link'

// Importar nuestros nuevos componentes y hooks
import { midatoPayAPI } from '@/lib/midatopay-api'
import { OracleConversionPreview } from '@/components/OracleConversionPreview'
import { QRModal } from '@/components/QRModal'

const createPaymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
})

type CreatePaymentForm = z.infer<typeof createPaymentSchema>

export default function CreatePaymentPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [refreshingQR, setRefreshingQR] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreatePaymentForm>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: undefined,
    },
  })

  const watchedAmount = watch('amount')


  const onSubmit = async (data: CreatePaymentForm) => {
    if (!isAuthenticated) {
      toast.error('You must be authenticated to create payments')
      return
    }

    setIsCreating(true)
    try {
      // Generar QR usando nuestro nuevo API
      const result = await midatoPayAPI.generatePaymentQR({
        amountARS: data.amount,
        targetCrypto: 'USDT'
      })

      if (result.success) {
        setQrData(result)
        setShowQRModal(true)
        toast.success('QR generated successfully!')
      } else {
        throw new Error(result.error || 'Error generating QR')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error generating QR')
    } finally {
      setIsCreating(false)
    }
  }

  // Evitar render en servidor si no está autenticado
  if (typeof window === 'undefined' || !isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/auth/login')
    }
    return null
  }

  return (
    <div className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #fff5f0 0%, #f7f7f6 100%)',
        fontFamily: 'Kufam, sans-serif'
      }}
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <QrCode className="w-6 h-6" style={{ color: '#fe6c1c' }} />
              <h1 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>Create Payment</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg border-0"
              style={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(254, 108, 28, 0.1)'
              }}
            >
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                  Payment Details
                </CardTitle>
                <CardDescription className="text-base" style={{ color: '#5d5d5d' }}>
                  Complete the details to generate the payment QR
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Monto */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" style={{ color: '#1a1a1a', fontWeight: '500' }}>Amount in ARS</Label>
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

                  {/* Cripto a Recibir */}
                  <div className="space-y-2">
                    <Label htmlFor="receiveCurrency" style={{ color: '#1a1a1a', fontWeight: '500' }}>Crypto to Receive</Label>
                    <div className="relative">
                      <div className="w-full h-12 px-4 py-3 rounded-xl flex items-center justify-between"
                        style={{ 
                          backgroundColor: 'rgba(247, 247, 246, 0.8)', 
                          border: '1px solid rgba(254,108,28,0.2)',
                          color: '#1a1a1a'
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#009393' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <g clipPath="url(#USDT_create)">
                                <path fill="#009393" d="M24 0H0v24h24z"/>
                                <path fill="#fff" d="m12 18.4-8-7.892L7.052 5.6h9.896L20 10.508zm.8-7.2v-.976c1.44.072 2.784.352 3.2.716-.484.424-2.216.732-4 .732s-3.516-.308-4-.732c.412-.364 1.76-.64 3.2-.72v.98zM8 10.936v.588c.412.364 1.756.64 3.2.72V14.4h1.6v-2.16c1.44-.072 2.788-.352 3.2-.716v-1.172c-.412-.364-1.76-.644-3.2-.72V8.8h2.4V7.6H8.8v1.2h2.4v.832c-1.444.076-2.788.356-3.2.72z"/>
                              </g>
                              <defs>
                                <clipPath id="USDT_create">
                                  <path fill="#fff" d="M0 0h24v24H0z"/>
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                          <span className="font-medium">USDT (Tether)</span>
                        </div>
                        <span className="text-sm" style={{ color: '#5d5d5d' }}>Fixed</span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: '#5d5d5d' }}>
                      You will automatically receive USDT according to the Oracle rate
                    </p>
                  </div>

                  {/* Botón Generar QR */}
                  <Button
                    type="submit"
                    disabled={isCreating || !watchedAmount}
                    className="w-full h-14 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ 
                      backgroundColor: '#fe6c1c', 
                      color: '#ffffff',
                      fontFamily: 'Kufam, sans-serif'
                    }}
                  >
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating QR...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-5 h-5" />
                        <span>Generate Payment QR</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview de Conversión usando Oracle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <OracleConversionPreview 
              amountARS={watchedAmount} 
              targetCrypto="USDT"
            />
          </motion.div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={qrData}
        onRefreshQR={async () => {
          if (!qrData?.paymentData?.amountARS) return
          
          setRefreshingQR(true)
          try {
            const result = await midatoPayAPI.generatePaymentQR({
              amountARS: qrData.paymentData.amountARS,
              targetCrypto: 'USDT'
            })
            
            if (result.success) {
              setQrData(result)
              toast.success('QR updated')
            }
          } catch (error) {
            toast.error('Error updating QR')
          } finally {
            setRefreshingQR(false)
          }
        }}
        refreshing={refreshingQR}
      />
    </div>
  )
}