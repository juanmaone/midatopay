'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
// import { useAegis } from '@cavos/aegis'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthActions } from '@/store/auth'
import { ArrowLeft } from 'lucide-react'

// Apple Logo Component
const AppleLogo = ({ size = 20, color = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill={color}
    />
  </svg>
);

// Google Logo Component  
const GoogleLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.37-4.52H2.18v2.84A9.95 9.95 0 0012 23z"
      fill="#34A853"
    />
    <path
      d="M5.63 13.01c-.22-.66-.35-1.36-.35-2.06s.13-1.4.35-2.06V6.05H2.18C1.43 7.44 1 8.97 1 10.5s.43 3.06 1.18 4.45l3.45-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.02 1 2.7 4.63 1.18 9.45l3.45 2.84C5.71 9.22 8.14 5.38 12 5.38z"
      fill="#EA4335"
    />
  </svg>
);

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type PasswordForm = z.infer<typeof passwordSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'complete'>('email')
  const [emailValue, setEmailValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const router = useRouter()
  const { login, clearError } = useAuthActions()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordForm) => {
    try {
      console.log('🔐 Intentando login con:', { email: emailValue, password: data.password })
      setIsLoading(true)
      setError(null)
      clearError()
      await login(emailValue, data.password)
      console.log('✅ Login exitoso')
      toast.success('Welcome to MidatoPay!')
      router.push('/dashboard')
    } catch (error) {
      console.error('❌ Error en login:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error logging in'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para manejar el envío del email
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📧 Email ingresado:', emailValue)
    if (emailValue && emailValue.includes('@') && emailValue.includes('.')) {
      console.log('✅ Email válido, avanzando a contraseña')
      setLoginStep('password')
      setError(null)
      clearError()
    } else {
      console.log('❌ Email inválido')
      setError('Por favor ingresa un email válido')
      toast.error('Please enter a valid email')
    }
  }

  // Función para volver al paso anterior
  const handleBackToEmail = () => {
    setLoginStep('email')
    setError(null)
    clearError()
  }

  // Login social (placeholder para futuras expansiones)
  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    toast(`Login con ${provider} próximamente disponible con Cavos Aegis`)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF4EC' }}>
      {/* Header fijo en la parte superior de toda la página */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4" style={{ backgroundColor: '#FFF4EC' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="MidatoPay Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Kufam, sans-serif', color: '#2C2C2C' }}>
              Midato<span style={{ color: '#FF6A00' }}>Pay</span>
            </h1>
          </div>
          
          <Link href="/" className="inline-flex items-center space-x-2 transition-colors" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>

      {/* Contenido principal centrado */}
      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Título de bienvenida */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Kufam, sans-serif', color: '#FF6A00' }}>Hello!</h2>
          </div>

          {/* Formulario */}
          <div 
            className="rounded-2xl p-8 shadow-xl"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(255, 106, 0, 0.1)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Paso 1: Email */}
            {loginStep === 'email' && (
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}>
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      className="w-full h-12 pl-4 pr-4 text-base rounded-lg border border-orange-200 focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        color: '#2C2C2C',
                        fontFamily: 'Kufam, sans-serif'
                      }}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-400 mt-2" style={{ fontFamily: 'Kufam, sans-serif' }}>{error}</p>
                  )}
                </div>

                {/* Botón Continuar */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg border-0"
                  style={{ 
                    backgroundColor: '#FF6A00', 
                    color: '#FFFFFF',
                    fontFamily: 'Kufam, sans-serif',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Continue
                </Button>
              </form>
            )}

            {/* Paso 2: Contraseña */}
            {loginStep === 'password' && (
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Email mostrado */}
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                  <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}>Email</p>
                  <div className="flex items-center justify-between">
                    <p className="font-medium" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}>{emailValue}</p>
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-sm underline"
                      style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif' }}
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}>
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password')}
                      className="w-full h-12 pl-4 pr-4 text-base rounded-lg border border-orange-200 focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        color: '#2C2C2C',
                        fontFamily: 'Kufam, sans-serif'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      style={{ color: '#8B8B8B' }}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      className="text-sm underline"
                      style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}
                    >
                      Forgot your password?
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 mt-2" style={{ fontFamily: 'Kufam, sans-serif' }}>{errors.password.message}</p>
                  )}
                  {error && (
                    <p className="text-sm text-red-400 mt-2" style={{ fontFamily: 'Kufam, sans-serif' }}>{error}</p>
                  )}
                </div>

                {/* Checkbox Remember me */}
                <div className="flex items-center mb-6">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-orange-200 text-orange-500 focus:ring-orange-500"
                    defaultChecked
                  />
                  <label htmlFor="remember" className="ml-2 text-sm" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}>
                    Remember me
                  </label>
                </div>

                {/* Botón Iniciar Sesión */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg border-0"
                  disabled={isLoading}
                  style={{ 
                    backgroundColor: '#FF6A00', 
                    color: '#FFFFFF',
                    fontFamily: 'Kufam, sans-serif',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            )}

            {/* Separador y Botones Sociales - Solo en paso de email */}
            {loginStep === 'email' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span 
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        color: '#8B8B8B',
                        fontFamily: 'Kufam, sans-serif'
                      }} 
                      className="px-4"
                    >
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Botón Google */}
                <Button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full h-12 rounded-lg border border-gray-200 flex items-center justify-center gap-3 mb-3"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    color: '#2C2C2C',
                    fontFamily: 'Kufam, sans-serif',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  <GoogleLogo size={20} />
                  Google
                </Button>
              </>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif', fontSize: '14px' }}>
                Don't have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium transition-colors underline-offset-2 hover:underline"
                  style={{ color: '#FF6A00' }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}