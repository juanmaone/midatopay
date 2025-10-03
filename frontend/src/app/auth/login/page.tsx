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
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthActions } from '@/store/auth'
import { DollarSign, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import PixelBlast from '@/components/PixelBlast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthActions()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError()
      await login(data.email, data.password)
      toast.success('¡Bienvenido a MidatoPay!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    }
  }

  // Login social (placeholder para futuras expansiones)
  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    toast.info(`Login con ${provider} próximamente disponible con Cavos Aegis`)
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ backgroundColor: '#f7f7f6' }}>
      {/* Panel izquierdo: fondo naranja + PixelBlast blanco */}
      <div className="relative hidden md:block">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #fe6c1c 0%, #fe9c42 100%)' }} />
        <PixelBlast color="#ffffff" className="absolute inset-0" pixelSize={3} patternScale={2} />
      </div>

      {/* Panel derecho: contenido de login */}
      <div className="flex items-center justify-center p-4">
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 transition-colors mb-4" style={{ color: '#1a1a1a' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f7f7f6', border: '1px solid rgba(26,26,26,0.1)' }}>
              <Image src="/logo.png" alt="MidatoPay logo" width={24} height={24} className="rounded" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Gromm, sans-serif', color: '#1a1a1a' }}>MidatoPay</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Gromm, sans-serif', color: '#fe6c1c' }}>INICIAR SESIÓN</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', color: '#5d5d5d' }}>Accedé a tu cuenta para gestionar tus pagos</p>
        </div>

        {/* Formulario */}
        <Card
          className="shadow-xl"
          style={{
            backgroundColor: 'rgba(254, 108, 28, 0.15)',
            borderColor: 'rgba(254, 108, 28, 0.35)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 20px 40px rgba(254, 108, 28, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          {/* Acento superior */}
          <div style={{ height: 4, background: 'linear-gradient(90deg,#fe6c1c,#fe9c42)' }} />
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Gromm, sans-serif', color: '#1a1a1a' }}>BIENVENIDO DE VUELTA</CardTitle>
            <CardDescription style={{ color: '#5d5d5d' }}>
              Ingresá tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Botones de login social */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                🍎 Continuar con Apple
              </Button>
              <Button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                📱 Continuar con Google
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'rgba(26,26,26,0.1)' }} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span style={{ backgroundColor: 'rgba(254, 108, 28, 0.15)', color: '#5d5d5d' }} className="px-2">
                    o continúa con email
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: '#1a1a1a' }}>Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email')}
                    className={(errors.email ? 'border-red-500 ' : '') + 'pl-10 focus:ring-2 focus:ring-[#fe9c42]'}
                    style={{ backgroundColor: '#ffffff', borderColor: '#fe6c1c', color: '#1a1a1a' }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5d5d5d]">@</span>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: '#1a1a1a' }}>Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    {...register('password')}
                    className={(errors.password ? 'border-red-500 pr-10 ' : 'pr-10 ') + 'focus:ring-2 focus:ring-[#fe9c42]'}
                    style={{ backgroundColor: '#ffffff', borderColor: '#fe6c1c', color: '#1a1a1a' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: '#5d5d5d' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Error general */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Botón de envío */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                style={{ backgroundColor: '#fe6c1c', color: '#ffffff', border: '1px solid #fe6c1c' }}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Enlaces adicionales */}
            <div className="mt-6">
              <div className="h-px w-full" style={{ backgroundColor: 'rgba(26,26,26,0.08)' }} />
              <div className="mt-4 text-center space-y-2">
              <Link
                href="/auth/forgot-password"
                className="text-sm transition-colors"
                style={{ color: '#1a1a1a' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
              
              <div className="text-sm" style={{ color: '#5d5d5d' }}>
                ¿No tienes cuenta?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium transition-colors underline-offset-2 hover:underline"
                  style={{ color: '#1a1a1a' }}
                >
                  Regístrate aquí
                </Link>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        </motion.div>
      </div>
    </div>
  )
}
