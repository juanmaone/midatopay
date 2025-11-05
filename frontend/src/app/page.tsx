'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  ArrowRight,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import PixelBlast from '@/components/PixelBlast'
import CustomHeader from '@/components/CustomHeader'
import ScrollVelocity from '@/components/ScrollVelocity'

export default function HomePage() {
  const [typewriterText, setTypewriterText] = useState('')
  
  const words = ['inflation', 'devaluation', 'crisis']
  const typewriterRef = useRef({
    currentWordIndex: 0,
    charIndex: 0,
    isDeleting: false,
    waitCount: 0
  })

  // Typewriter effect
  useEffect(() => {
    const typeInterval = setInterval(() => {
      const currentWord = words[typewriterRef.current.currentWordIndex]
      
      if (!typewriterRef.current.isDeleting) {
        // Typing
        if (typewriterRef.current.charIndex < currentWord.length) {
          setTypewriterText(currentWord.substring(0, typewriterRef.current.charIndex + 1))
          typewriterRef.current.charIndex++
        } else {
          // Wait before deleting (20 iterations of 100ms = 2 seconds)
          typewriterRef.current.waitCount++
          if (typewriterRef.current.waitCount >= 20) {
            typewriterRef.current.isDeleting = true
            typewriterRef.current.waitCount = 0
          }
        }
      } else {
        // Deleting
        if (typewriterRef.current.charIndex > 0) {
          setTypewriterText(currentWord.substring(0, typewriterRef.current.charIndex - 1))
          typewriterRef.current.charIndex--
        } else {
          // Move to next word
          typewriterRef.current.isDeleting = false
          typewriterRef.current.currentWordIndex = (typewriterRef.current.currentWordIndex + 1) % words.length
          typewriterRef.current.charIndex = 0
        }
      }
    }, 100)
    
    return () => clearInterval(typeInterval)
  }, [])

  // Datos del proceso estático
  const processSteps = [
    {
      id: 0,
      title: "Generar QR",
      description: "El comerciante crea un QR con el monto en pesos argentinos y la criptomoneda deseada",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      id: 1,
      title: "Cliente Escanea",
      description: "El cliente escanea el QR con su celular y ve los detalles del pago",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 2,
      title: "Pago en ARS",
      description: "El cliente paga en pesos argentinos usando su método preferido",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 3,
      title: "Conversión Automática",
      description: "MidatoPay convierte automáticamente los pesos a criptomonedas",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#f7f7f6' }}>
      {/* PixelBlast Background */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#fe6c1c"
          patternScale={2.5}
          patternDensity={0.8}
          pixelSizeJitter={0.3}
          enableRipples
          rippleSpeed={0.3}
          rippleThickness={0.15}
          rippleIntensityScale={1.2}
          liquid
          liquidStrength={0.08}
          liquidRadius={1.0}
          liquidWobbleSpeed={4}
          speed={0.4}
          edgeFade={0.3}
          transparent
          className=""
          style={{}}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 pt-24">
      {/* Custom Header */}
      <CustomHeader />

      {/* Info Bar */}
      <div className="absolute top-16 left-0 right-0 z-50 bg-black border-b border-gray-700 py-2 overflow-hidden">
        <ScrollVelocity
          velocity={3}
          className="flex items-center text-sm font-medium"
          numCopies={4}
          parallaxClassName="parallax"
          scrollerClassName="scroller"
          scrollerStyle={{ display: 'inline-flex', alignItems: 'center', color: '#fff5f0' }}
        >
          {/* Secuencia completa con espacios incluidos */}
          <div className="flex items-center" style={{ color: '#fff5f0' }}>
            <span style={{ color: '#fff5f0' }}>Exclusive benefits</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fff5f0' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <div style={{ width: '6rem' }}></div>
            <span style={{ color: '#fff5f0' }}>Instant conversion</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fff5f0' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div style={{ width: '6rem' }}></div>
            <span style={{ color: '#fff5f0' }}>Merchant support</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fff5f0' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
            <div style={{ width: '6rem' }}></div>
          </div>
        </ScrollVelocity>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-6" style={{ 
        background: 'linear-gradient(180deg, rgba(255, 106, 0, 0.4) 0%, rgba(255, 106, 0, 0.1) 40%, rgba(255, 255, 255, 1) 50%)' 
      }}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-left">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex justify-start mb-6">
                </div>
                
                <h1 
                  className="text-4xl md:text-[75px] font-bold mb-4 leading-[0.95]" 
                  style={{ 
                    fontFamily: 'Kufam, sans-serif', 
                    color: '#2C2C2C'
                  }}
                >
                  Your business,
                  <br />
                  immune to <br />
                  <span style={{ color: '#FF6A00' }}>
                    {typewriterText}
                    <span className="animate-pulse">|</span>
                  </span>
                </h1>
                
                  <p 
                  className="text-2xl md:text-3xl mb-14 leading-[1.2]" 
                    style={{ 
                    fontFamily: 'Kufam, sans-serif', 
                    color: '#FF6A00',
                    fontWeight: 500
                  }}
                >
                  Protect the value of your sales <br />without changing how you collect.
                </p>
                
                {/* Crypto Badges */}
                <div className="flex items-center gap-4 flex-wrap mb-10">
                  <span className="text-lg font-semibold" style={{ fontFamily: 'Kufam, sans-serif', color: '#2C2C2C' }}>Collect:</span>
                  <div className="flex items-center gap-3">
                    {/* ARS Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ 
                      background: 'linear-gradient(135deg, rgba(74,144,226,0.12) 0%, rgba(74,144,226,0.06) 100%)', 
                      border: '1px solid rgba(74,144,226,0.25)',
                      boxShadow: '0 4px 12px rgba(74,144,226,0.15)'
                    }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4A90E2' }}>
                        <Image 
                          src="/logo-arg.png" 
                          alt="Argentina Flag" 
                          width={14} 
                          height={14}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#4A90E2', fontFamily: 'Kufam, sans-serif' }}>ARS</span>
                    </div>
                  </div>
                  
                  <span className="text-lg font-semibold ml-4" style={{ fontFamily: 'Kufam, sans-serif', color: '#2C2C2C' }}>Receive:</span>
                  <div className="flex items-center gap-3">
                    {/* USDT Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ 
                      background: 'linear-gradient(135deg, rgba(0,147,147,0.12) 0%, rgba(0,147,147,0.06) 100%)', 
                      border: '1px solid rgba(0,147,147,0.25)',
                      boxShadow: '0 4px 12px rgba(0,147,147,0.15)'
                    }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009393' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <g clipPath="url(#USDT_home_1)">
                          <path fill="#009393" d="M24 0H0v24h24z"/>
                          <path fill="#fff" d="m12 18.4-8-7.892L7.052 5.6h9.896L20 10.508zm.8-7.2v-.976c1.44.072 2.784.352 3.2.716-.484.424-2.216.732-4 .732s-3.516-.308-4-.732c.412-.364 1.76-.64 3.2-.72v.98zM8 10.936v.588c.412.364 1.756.64 3.2.72V14.4h1.6v-2.16c1.44-.072 2.788-.352 3.2-.716v-1.172c-.412-.364-1.76-.644-3.2-.72V8.8h2.4V7.6H8.8v1.2h2.4v.832c-1.444.076-2.788.356-3.2.72z"/>
                        </g>
                        <defs>
                            <clipPath id="USDT_home_1">
                            <path fill="#fff" d="M0 0h24v24H0z"/>
                          </clipPath>
                        </defs>
                      </svg>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#009393', fontFamily: 'Kufam, sans-serif' }}>USDT</span>
                    </div>

                    {/* BTC Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ 
                      background: 'linear-gradient(135deg, rgba(247,147,26,0.12) 0%, rgba(247,147,26,0.06) 100%)', 
                      border: '1px solid rgba(247,147,26,0.25)',
                      boxShadow: '0 4px 12px rgba(247,147,26,0.15)'
                    }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F7931A' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path fill="#fff" d="M18.763 10.236c.28-1.895-1.155-2.905-3.131-3.591l.64-2.553-1.56-.389-.623 2.49-1.245-.297.631-2.508L11.915 3l-.641 2.562-.992-.234v-.01l-2.157-.54-.415 1.668s1.155.272 1.137.28c.631.163.74.578.722.903l-.722 2.923.162.054-.171-.036-1.02 4.087c-.072.19-.27.478-.712.36.018.028-1.128-.27-1.128-.27l-.776 1.778 2.03.505 1.11.289-.65 2.59 1.56.387.633-2.562 1.253.324-.64 2.554 1.56.388.641-2.59c2.662.505 4.665.308 5.505-2.102.676-1.94-.037-3.05-1.435-3.79 1.02-.225 1.786-.902 1.985-2.282zm-3.564 4.999c-.479 1.94-3.745.884-4.8.63l.857-3.436c1.055.27 4.448.784 3.943 2.796zm.478-5.026c-.433 1.76-3.158.866-4.033.65l.775-3.113c.885.217 3.718.632 3.258 2.463"/>
                      </svg>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#F7931A', fontFamily: 'Kufam, sans-serif' }}>BTC</span>
                    </div>

                    {/* ETH Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ 
                      background: 'linear-gradient(135deg, rgba(98,126,234,0.12) 0%, rgba(98,126,234,0.06) 100%)', 
                      border: '1px solid rgba(98,126,234,0.25)',
                      boxShadow: '0 4px 12px rgba(98,126,234,0.15)'
                    }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#627eea' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <g clipPath="url(#ETH_home_1)">
                            <path fill="#627eea" d="M24 0H0v24h24z"/>
                            <path fill="#fff" d="M12 4v5.912l5 2.236z"/>
                            <path fill="#fff" d="m12 4-5 8.148 5-2.236z"/>
                            <path fill="#fff" d="M12 15.98V20l5-6.92z"/>
                            <path fill="#fff" d="M12 20v-4.02l-5-2.9z"/>
                            <path fill="#fff" d="m12 15.048 5-2.9-5-2.236z"/>
                            <path fill="#fff" d="m7 12.148 5 2.9V9.912z"/>
                        </g>
                        <defs>
                            <clipPath id="ETH_home_1">
                            <path fill="#fff" d="M0 0h24v24H0z"/>
                          </clipPath>
                        </defs>
                      </svg>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#627eea', fontFamily: 'Kufam, sans-serif' }}>ETH</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start mb-6">
                  <Button size="lg" className="text-lg px-8 py-5 text-white mb-2 rounded-xl" style={{ backgroundColor: '#FF6A00', fontFamily: 'Kufam, sans-serif' }} asChild>
                    <Link href="/auth/register">
                      Get Started
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
                </div>

            {/* Right Side - Character */}
            <div className="flex justify-center items-start pt-2">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative flex items-start justify-center"
              >
                <Image 
                  src="/gato.svg" 
                  alt="MidatoPay Cat" 
                  width={300} 
                  height={100} 
                  className="drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))' }}
                />
              </motion.div>
            </div>
                      </div>
                    </div>
      </section>

      {/* Promotional Cards Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Empezá a ganarle a la inflación */}
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: '#FF6A00' }}
            >
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  Start beating
                </h3>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  inflation
                </h3>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Kufam, sans-serif' }}>
                </h3>
                
                <button className="bg-white text-orange-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm">
                  Start
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {/* Graphics */}
              <div className="absolute top-2 right-2">
                <Image src="/par-logos.png" alt="Argentina y USDT" width={135} height={80} className="rounded-lg" />
                </div>
            </motion.div>

            {/* Card 2: QR interoperable */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: '#2C2C2C' }}
            >
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  Interoperable QR:
                </h3>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  accept any
                </h3>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  wallet
                </h3>
                
                <button className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors text-sm">
                  Learn more
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {/* Graphics */}
              <div className="absolute top-2 right-0">
                <Image src="/scan-qr.png" alt="QR Scanner" width={140} height={100} className="rounded-lg" />
                </div>
              </motion.div>

            {/* Card 3: +50 Comercios */}
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative rounded-2xl p-6 shadow-xl border-2"
              style={{ 
                backgroundColor: '#FFF9F5',
                borderColor: '#FF6A00'
              }}
            >
              <div className="text-orange-600">
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  +50 Merchants
                </h3>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  choose
                </h3>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Kufam, sans-serif' }}>
                  MidatoPay
                </h3>
                
                <button className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:from-orange-600 hover:to-orange-500 transition-colors text-sm">
                  Join us
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {/* Graphics */}
              <div className="absolute top-2 right-2">
                <Image src="/logo3d.png" alt="MidatoPay 3D Logo" width={125} height={30} className="rounded-lg" />
                    </div>
              </motion.div>
            </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
              <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#2C2C2C' }}
          >
            <video
              className="w-full h-auto"
              autoPlay
              loop
              muted
              playsInline
              style={{ borderRadius: '16px' }}
            >
              <source src="/video-midatopay.mp4" type="video/mp4" />
              Tu navegador no soporta el elemento de video.
            </video>
            
            {/* Overlay con información */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-white text-xl font-bold mb-2" style={{ fontFamily: 'Kufam, sans-serif' }}>
              Descubrí cómo funciona MidatoPay
              </h3>
              <p className="text-white/80 text-sm" style={{ fontFamily: 'Kufam, sans-serif' }}>
              Mirá cómo los comercios protegen el valor de sus ventas frente a la inflación
              </p>
            </div>
          </motion.div>
        </div>
      </section>

        {/* Sección de Proceso con Glassmorphism */}
        <section className="py-20 px-4" style={{ backgroundColor: '#fff5f0' }}>
        <div className="container mx-auto max-w-7xl">
          {/* Título */}
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
            >
              Cómo funciona MidatoPay
            </h2>
            <p 
              className="text-xl max-w-3xl mx-auto"
              style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
            >
              Un proceso simple y seguro para proteger tus ventas de la inflación
            </p>
          </div>

          {/* Proceso paso a paso con diseño glassmorphism EXACTO */}
          <div className="max-w-7xl mx-auto">
            {/* Fila superior: Tarjetas 1 y 2 + Texto descriptivo */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              {/* Tarjeta 1 */}
              <div
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{ 
                  fontFamily: 'Kufam, sans-serif',
                  background: 'transparent',
                  border: '1.8px solid #FF6A00'
                }}
              >
                
                {/* Número grande ARRIBA */}
                <div 
                  className="absolute top-2 left-4 text-8xl font-bold opacity-30"
                  style={{ color: '#FF6A00' }}
                >
                  1
                </div>

                {/* Contenido MUCHO MÁS ABAJO - ALINEADO A LA IZQUIERDA */}
                <div className="relative z-10 mt-16 ml-4">
                  <h3 
                    className="text-2xl font-bold mb-4 text-left"
                    style={{ color: '#2C2C2C' }}
                  >
                    {processSteps[0].title}
                  </h3>
                  <p 
                    className="text-base leading-relaxed text-left"
                    style={{ color: '#8B8B8B' }}
                  >
                    {processSteps[0].description}
                  </p>
                </div>
              </div>

              {/* Tarjeta 2 */}
              <div
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{ 
                  fontFamily: 'Kufam, sans-serif',
                  background: 'transparent',
                  border: '1.8px solid #FF6A00'
                }}
              >
                
                {/* Número grande ARRIBA */}
                <div 
                  className="absolute top-2 left-4 text-8xl font-bold opacity-30"
                  style={{ color: '#FF6A00' }}
                >
                  2
                </div>

                {/* Contenido MUCHO MÁS ABAJO - ALINEADO A LA IZQUIERDA */}
                <div className="relative z-10 mt-16 ml-4">
                  <h3 
                    className="text-2xl font-bold mb-4 text-left"
                    style={{ color: '#2C2C2C' }}
                  >
                    {processSteps[1].title}
                  </h3>
                  <p 
                    className="text-base leading-relaxed text-left"
                    style={{ color: '#8B8B8B' }}
                  >
                    {processSteps[1].description}
                  </p>
                </div>
              </div>

              {/* Texto descriptivo SIN CUADRADO */}
              <div className="flex items-start justify-start h-full">
                <div className="text-left">
                  <p 
                    className="text-2xl font-medium leading-relaxed mb-2"
                    style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Un ciclo dinámico
                  </p>
                  <p 
                    className="text-2xl font-medium leading-relaxed mb-2"
                    style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
                  >
                    iterativo enfocado en
                  </p>
                  <p 
                    className="text-2xl font-bold leading-relaxed mb-2"
                    style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
                  >
                    simplicidad,
                  </p>
                  <p 
                    className="text-2xl font-bold leading-relaxed mb-2"
                    style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
                  >
                    personalización
                  </p>
                  <p 
                    className="text-2xl font-bold leading-relaxed"
                    style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
                  >
                    y confianza del usuario.
                  </p>
                </div>
              </div>
            </div>

            {/* Fila inferior: Paso 3 debajo del Paso 2, Paso 4 debajo del texto */}
            <div className="grid grid-cols-3 gap-8">
              {/* Espacio vacío para alinear con Tarjeta 1 */}
              <div></div>
              
              {/* Tarjeta 3 - DEBAJO del Paso 2 */}
              <div
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{ 
                  fontFamily: 'Kufam, sans-serif',
                  background: 'transparent',
                  border: '1.8px solid #FF6A00'
                }}
              >
                
                {/* Número grande ARRIBA */}
                <div 
                  className="absolute top-2 left-4 text-8xl font-bold opacity-30"
                  style={{ color: '#FF6A00' }}
                >
                  3
                </div>

                {/* Contenido MUCHO MÁS ABAJO - ALINEADO A LA IZQUIERDA */}
                <div className="relative z-10 mt-16 ml-4">
                  <h3 
                    className="text-2xl font-bold mb-4 text-left"
                    style={{ color: '#2C2C2C' }}
                  >
                    {processSteps[2].title}
                </h3>
                  <p 
                    className="text-base leading-relaxed text-left"
                    style={{ color: '#8B8B8B' }}
                  >
                    {processSteps[2].description}
                  </p>
                </div>
              </div>

              {/* Tarjeta 4 - DEBAJO del texto descriptivo */}
              <div
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{ 
                  fontFamily: 'Kufam, sans-serif',
                  background: 'transparent',
                  border: '1.8px solid #FF6A00'
                }}
              >
                
                {/* Número grande ARRIBA */}
                <div 
                  className="absolute top-2 left-4 text-8xl font-bold opacity-30"
                  style={{ color: '#FF6A00' }}
                >
                  4
                </div>

                {/* Contenido MUCHO MÁS ABAJO - ALINEADO A LA IZQUIERDA */}
                <div className="relative z-10 mt-16 ml-4">
                  <h3 
                    className="text-2xl font-bold mb-4 text-left"
                    style={{ color: '#2C2C2C' }}
                  >
                    {processSteps[3].title}
                </h3>
                  <p 
                    className="text-base leading-relaxed text-left"
                    style={{ color: '#8B8B8B' }}
                  >
                    {processSteps[3].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Problemas y Soluciones */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFF4EC' }}>
        <div className="container mx-auto max-w-7xl">
          {/* Título Principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
            >
              Problemas
            </h2>
            <p 
              className="text-xl max-w-3xl mx-auto"
              style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
            >
              Exploramos las expectativas y problemas potenciales de los comerciantes para simplificar su experiencia.
            </p>
          </motion.div>

          {/* Problemas */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Problema 1 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif' }}
                >
                  01
                </div>
                <div 
                  className="h-0.5 w-16"
                  style={{ backgroundColor: '#FF6A00' }}
                />
              </div>
              <h3 
                className="text-2xl font-bold"
                style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
              >
                Pérdida de valor por inflación
              </h3>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                Los comerciantes ven cómo sus ventas en pesos argentinos pierden valor día a día debido a la inflación. 
                No entienden cómo proteger sus ingresos sin cambiar su forma de cobrar.
              </p>
            </motion.div>

            {/* Problema 2 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif' }}
                >
                  02
                </div>
                <div 
                  className="h-0.5 w-16"
                  style={{ backgroundColor: '#FF6A00' }}
                />
              </div>
              <h3 
                className="text-2xl font-bold"
                style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
              >
                Complejidad técnica innecesaria
              </h3>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                Los clientes llegan al comercio y no pueden entender cómo pagar con criptomonedas. 
                Todo parece complicado, necesitan wallets, conocimientos técnicos, y terminan abandonando la compra.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4" style={{ backgroundColor: '#2C2C2C' }}>
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo y Descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <Image
                  src="/logo.png"
                  alt="MidatoPay Logo"
                  width={48}
                  height={48}
                  className="mr-4"
                />
                <h3 
                  className="text-2xl font-bold"
                  style={{ color: '#FFFFFF', fontFamily: 'Kufam, sans-serif' }}
                >
                  MidatoPay
                </h3>
              </div>
              <p 
                className="text-base leading-relaxed mb-6 max-w-md"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                Protege tus ventas de la inflación con pagos en criptomonedas. 
                Conversión automática y seguridad blockchain para tu negocio.
              </p>
            </div>

            {/* Producto */}
            <div>
              <h4 
                className="text-lg font-bold mb-6"
                style={{ color: '#FFFFFF', fontFamily: 'Kufam, sans-serif' }}
              >
                Producto
              </h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="#como-funciona" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <a 
                    href="#precios" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a 
                    href="#seguridad" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Seguridad
                  </a>
                </li>
                <li>
                  <a 
                    href="#api" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h4 
                className="text-lg font-bold mb-6"
                style={{ color: '#FFFFFF', fontFamily: 'Kufam, sans-serif' }}
              >
                Soporte
              </h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="#ayuda" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a 
                    href="#contacto" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Contacto
                  </a>
                </li>
                <li>
                  <a 
                    href="#documentacion" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Documentación
                  </a>
                </li>
                <li>
                  <a 
                    href="#status" 
                    className="text-base hover:opacity-80 transition-opacity"
                    style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                  >
                    Estado del Sistema
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div 
            className="w-full h-px mb-8"
            style={{ backgroundColor: '#5d5d5d' }}
          />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p 
                className="text-sm"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                © 2024 MidatoPay. Todos los derechos reservados.
              </p>
            </div>
            <div className="flex space-x-6">
              <a 
                href="#privacidad" 
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                Política de Privacidad
              </a>
              <a 
                href="#terminos" 
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                Términos de Servicio
              </a>
              <a 
                href="#cookies" 
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
              >
                Cookies
              </a>
            </div>
          </div>

        </div>
      </footer>
      </div>
    </div>
  )
}
