'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Camera, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
// Usar API nativa del navegador + jsQR para detectar QR codes
import jsQR from 'jsqr'

export default function QRScannerPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrScanner, setQrScanner] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScannerReady, setIsScannerReady] = useState(false)
  const [scanInterval, setScanInterval] = useState<NodeJS.Timeout | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Inicializar cámara usando API nativa
  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitialized) return
    
    const initCamera = async () => {
      try {
        console.log('Iniciando cámara...')
        setIsInitialized(true)
        
        // Verificar si el navegador soporta getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Tu navegador no soporta acceso a la cámara')
          return
        }

        // Solicitar acceso a la cámara
        console.log('Solicitando acceso a la cámara...')
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Usar cámara trasera si está disponible
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
        
        console.log('Stream obtenido:', stream)
        console.log('Tracks activos:', stream.getTracks().length)
        console.log('Video track:', stream.getVideoTracks()[0])
        
        setHasPermission(true)
        setIsScannerReady(true)
        
        // Conectar stream al video
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Esperar a que el video esté completamente cargado
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback...')
            videoRef.current?.play().then(() => {
              console.log('Video playback started successfully')
              setIsScanning(true)
              // Iniciar detección de QR después de un pequeño delay
              setTimeout(() => {
                startQRDetection()
              }, 1000)
            }).catch((err) => {
              console.error('Error starting video playback:', err)
              setError('Error iniciando la cámara')
            })
          }
          
          videoRef.current.onerror = (err) => {
            console.error('Video error:', err)
            setError('Error con el video de la cámara')
          }
        }
        
      } catch (err) {
        console.error('Error accediendo a la cámara:', err)
        const error = err as any
        if (error.name === 'NotAllowedError') {
          setError('Se requieren permisos de cámara para escanear QR codes')
        } else if (error.name === 'NotFoundError') {
          setError('No se encontró una cámara disponible')
        } else {
          setError('Error al acceder a la cámara: ' + (err as Error).message)
        }
        setHasPermission(false)
      }
    }

    initCamera()

    return () => {
      // Limpiar stream al desmontar
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      // Limpiar intervalo de detección
      if (scanInterval) {
        clearInterval(scanInterval)
      }
    }
  }, [isInitialized]) // Solo ejecutar cuando cambie isInitialized

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const video = videoRef.current
        const context = canvas.getContext('2d')

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          // Configurar canvas con las dimensiones del video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Optimizar canvas para lectura frecuente
          context.imageSmoothingEnabled = false

          // Dibujar frame del video en el canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Obtener datos de imagen
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Detectar QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code) {
            console.log('QR Code detectado:', code.data)
            setScannedData(code.data)
            setIsScanning(false)
            clearInterval(interval)
            processScannedQR(code.data)
          }
        }
      }
    }, 300) // Detectar cada 300ms para reducir parpadeo

    setScanInterval(interval)
  }

  const startScanning = () => {
    // La cámara ya está iniciada en el useEffect
    setIsScanning(true)
    setError(null)
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const processScannedQR = async (qrData: string) => {
    try {
      console.log('🔍 Procesando QR:', qrData)
      
      // Parsear el QR EMVCo TLV
      const paymentData = parseEMVQR(qrData)
      
      if (!paymentData) {
        toast.error('QR Code no válido')
        return
      }

      console.log('📱 Datos parseados:', paymentData)

      // Llamar al backend para verificar el pago
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/midatopay/scan-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData })
      })

      const result = await response.json()
      
      if (!result.success) {
        toast.error(result.error || 'Error al procesar el QR')
        return
      }

      console.log('✅ Pago verificado:', result.data)

      // Mostrar los datos de la transacción blockchain
      if (result.data.paymentData.blockchainTransaction) {
        const tx = result.data.paymentData.blockchainTransaction
        toast.success(`¡Transacción ejecutada! Hash: ${tx.hash}`)
        
        // Redirigir a la página de resultados detallados
        const params = new URLSearchParams({
          paymentId: result.data.paymentData.paymentId,
          merchantAddress: result.data.paymentData.merchantAddress,
          amountARS: result.data.paymentData.amountARS.toString(),
          merchantName: result.data.paymentData.merchantName,
          concept: result.data.paymentData.concept,
          status: result.data.paymentData.status,
          txHash: tx.hash,
          explorerUrl: tx.explorerUrl
        })
        
        router.push(`/transaction-result?${params.toString()}`)
      } else {
        toast.success('QR escaneado exitosamente')
        
        // Redirigir sin datos de blockchain (transacción pendiente)
        const params = new URLSearchParams({
          paymentId: result.data.paymentData.paymentId,
          merchantAddress: result.data.paymentData.merchantAddress,
          amountARS: result.data.paymentData.amountARS.toString(),
          merchantName: result.data.paymentData.merchantName,
          concept: result.data.paymentData.concept,
          status: result.data.paymentData.status
        })
        
        router.push(`/transaction-result?${params.toString()}`)
      }
      
    } catch (err) {
      console.error('Error procesando QR:', err)
      toast.error('Error al procesar el QR Code')
    }
  }

  const parseEMVQR = (qrData: string) => {
    try {
      console.log('🔍 Parseando QR:', qrData)
      
      // Parsear TLV data del QR EMVCo
      // El QR contiene: 01650x[merchant_address]0205[amount]0326[payment_id]17C1
      // Ejemplo: 01650x263314aecfb546ead2569e4793128c9337d9906e3eecdc42c4cbd2f68d6ccd30205100000326pay_1760486804327_8c33d6ca7B74
      
      // Extraer merchant address (65 caracteres después de 01650x)
      const merchantMatch = qrData.match(/01650x([a-f0-9]{65})/)
      if (!merchantMatch) {
        console.warn('⚠️ No se encontró merchant address válido')
        return null
      }
      
      // Extraer amount (buscar 0205 seguido de números)
      const amountMatch = qrData.match(/0205(\d+)/)
      if (!amountMatch) {
        console.warn('⚠️ No se encontró amount válido')
        return null
      }
      
      // Extraer paymentId (después del amount, buscar patrón pay_)
      const afterAmount = qrData.substring(qrData.indexOf(amountMatch[1]) + amountMatch[1].length)
      const paymentIdMatch = afterAmount.match(/pay_[a-zA-Z0-9_]+/)
      if (!paymentIdMatch) {
        console.warn('⚠️ No se encontró paymentId válido')
        return null
      }
      
      const merchantAddress = '0x' + merchantMatch[1]
      const amount = parseInt(amountMatch[1])
      const paymentId = paymentIdMatch[0] // Usar el match completo que incluye 'pay_'
      
      console.log('📱 QR parseado:', { merchantAddress, amount, paymentId })
      
      return {
        merchantAddress,
        amount,
        paymentId,
        qrData: qrData
      }
      
    } catch (err) {
      console.error('Error parseando EMV QR:', err)
      return null
    }
  }

  const simulateQRScan = () => {
    // Simular escaneo de QR para testing con formato TLV correcto
    const mockQRData = '01650x263314aecfb546ead2569e4793128c9337d9906e3eecdc42c4cbd2f68d6ccd30205100000326pay_test_1234517C1'
    setScannedData(mockQRData)
    setIsScanning(false)
    processScannedQR(mockQRData)
  }

  const retryScanning = () => {
    setScannedData(null)
    setError(null)
    startScanning()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f6' }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ backgroundColor: '#f7f7f6', borderColor: 'rgba(26,26,26,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="mr-4">
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
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Gromm, sans-serif', color: '#1a1a1a' }}>Escanear QR</h1>
                <p className="text-sm" style={{ color: '#5d5d5d' }}>Escanea el código QR para pagar</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" style={{ color: '#fe6c1c' }} />
                  <span>Cámara</span>
                </CardTitle>
                <CardDescription>
                  Apunta la cámara al código QR del comercio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {hasPermission === false ? (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Se requieren permisos de cámara</p>
                        <Button onClick={retryScanning} variant="outline">
                          Permitir Cámara
                        </Button>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={retryScanning} variant="outline">
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  ) : scannedData ? (
                    <div className="aspect-video bg-green-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-green-700 mb-4">¡QR escaneado exitosamente!</p>
                        <Button onClick={retryScanning} variant="outline">
                          Escanear Otro
                        </Button>
                      </div>
                    </div>
                  ) : !isScannerReady ? (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando scanner...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full aspect-video rounded-lg bg-black"
                        playsInline
                      />
                      {/* Canvas oculto para detección de QR */}
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-4 border-orange-500 border-dashed rounded-lg animate-pulse"></div>
                        </div>
                      )}
                      {/* Botones de control */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        <Button 
                          onClick={simulateQRScan}
                          variant="outline"
                          size="sm"
                          className="bg-white/90 hover:bg-white"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Simular QR (Test)
                        </Button>
                        <Button 
                          onClick={() => window.location.reload()}
                          variant="outline"
                          size="sm"
                          className="bg-white/90 hover:bg-white"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Reiniciar Cámara
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Instrucciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" style={{ color: '#fe6c1c' }} />
                  <span>Instrucciones</span>
                </CardTitle>
                <CardDescription>
                  Cómo usar el escáner de QR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-orange-600">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Permite el acceso a la cámara</h3>
                      <p className="text-sm text-gray-600">Tu navegador te pedirá permisos para usar la cámara</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-orange-600">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Apunta al código QR</h3>
                      <p className="text-sm text-gray-600">Coloca el código QR del comercio dentro del marco</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-orange-600">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Confirma el pago</h3>
                      <p className="text-sm text-gray-600">Revisa los detalles y confirma tu pago en ARS</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Consejos</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Asegúrate de tener buena iluminación</li>
                    <li>• Mantén el QR estable dentro del marco</li>
                    <li>• El QR debe estar completo y visible</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
