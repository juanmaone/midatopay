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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth, useAuthActions, useAuthStore } from '@/store/auth'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const { t } = useLanguage()
  const [registerStep, setRegisterStep] = useState<'basic' | 'password'>('basic')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [basicData, setBasicData] = useState({ name: '', email: '' })
  const router = useRouter()
  const { isLoading } = useAuth()
  const error = useAuthStore((state) => state.error)
  const { register: registerUser, clearError } = useAuthActions()

  const registerSchema = z.object({
    name: z.string().min(2, t.auth.register.errors.nameMin),
    email: z.string().email(t.auth.register.errors.invalidEmail),
    phone: z.string().optional(),
    password: z.string().min(6, t.auth.register.errors.passwordMin),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.auth.register.errors.passwordsDontMatch,
    path: ["confirmPassword"],
  })

  type RegisterForm = z.infer<typeof registerSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    
    if (!name || name.length < 2) {
      toast.error(t.auth.register.errors.nameMin)
      return
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.error(t.auth.register.errors.invalidEmail)
      return
    }
    
    setBasicData({ name, email })
    setRegisterStep('password')
    clearError()
  }

  const handleBackToBasic = () => {
    setRegisterStep('basic')
    clearError()
  }

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    toast(t.auth.register.socialRegister.replace('{provider}', provider))
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError()
      const { confirmPassword, ...userData } = data
      const finalData = { ...basicData, ...userData }
      await registerUser(finalData)
      toast.success(t.auth.register.accountCreated)
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.register.errors.registering)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF4EC' }}>
      <div className="grid md:grid-cols-2 min-h-screen">
        <div className="hidden md:block relative">
          <Image
            src="/fondo-login.png"
            alt="Fondo MidatoPay"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <Link 
                href="/" 
                className="inline-flex items-center space-x-2 mb-6 transition-colors"
                style={{ color: '#8B8B8B' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span style={{ fontFamily: 'Kufam, sans-serif' }}>{t.auth.register.backToHome}</span>
              </Link>
              
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}
              >
                {t.auth.register.title}
              </h1>
            </div>

            <div 
              className="p-8 rounded-2xl shadow-xl"
              style={{ 
                backgroundColor: '#2C2C2C',
                border: '1px solid rgba(255, 106, 0, 0.2)',
                boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              {registerStep === 'basic' && (
                <form onSubmit={handleBasicSubmit}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label 
                        htmlFor="name" 
                        className="block text-sm font-medium"
                        style={{ color: '#fff5f0', fontFamily: 'Kufam, sans-serif' }}
                      >
                        {t.auth.register.fullName}
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={t.auth.register.fullNamePlaceholder}
                        className="w-full h-14 pl-4 pr-4 text-lg rounded-xl border-0 focus:ring-2 focus:ring-[#FF6A00]"
                        style={{ 
                          backgroundColor: '#FFF9F5', 
                          color: '#2C2C2C',
                          fontFamily: 'Kufam, sans-serif'
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium"
                        style={{ color: '#fff5f0', fontFamily: 'Kufam, sans-serif' }}
                      >
                        {t.auth.register.email}
                      </label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder={t.auth.register.emailPlaceholder}
                          className="w-full h-14 pl-4 pr-4 text-lg rounded-xl border-0 focus:ring-2 focus:ring-[#FF6A00]"
                          style={{ 
                            backgroundColor: '#FFF9F5', 
                            color: '#2C2C2C',
                            fontFamily: 'Kufam, sans-serif'
                          }}
                        />
                        <button
                          type="submit"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#FF6A00' }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-400" style={{ fontFamily: 'Kufam, sans-serif' }}>{error}</p>
                    )}

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#2C2C2C] text-white/60" style={{ fontFamily: 'Kufam, sans-serif' }}>
                          {t.auth.register.orSignUpWith}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-0 transition-all duration-200 hover:scale-105"
                        style={{ 
                          backgroundColor: '#FFF9F5',
                          fontFamily: 'Kufam, sans-serif'
                        }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span style={{ color: '#2C2C2C' }}>{t.auth.register.continueWithGoogle}</span>
                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8B8B8B' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialLogin('apple')}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-0 transition-all duration-200 hover:scale-105"
                        style={{ 
                          backgroundColor: '#FFF9F5',
                          fontFamily: 'Kufam, sans-serif'
                        }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#000000' }}>
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        <span style={{ color: '#2C2C2C' }}>{t.auth.register.continueWithApple}</span>
                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8B8B8B' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {registerStep === 'password' && (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-6 space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                      <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}>{t.auth.register.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}>{basicData.name}</p>
                        <button
                          type="button"
                          onClick={handleBackToBasic}
                          className="text-sm underline"
                          style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif' }}
                        >
                          {t.auth.register.change}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                      <p className="text-sm" style={{ color: '#8B8B8B', fontFamily: 'Kufam, sans-serif' }}>{t.auth.register.email}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium" style={{ color: '#2C2C2C', fontFamily: 'Kufam, sans-serif' }}>{basicData.email}</p>
                        <button
                          type="button"
                          onClick={handleBackToBasic}
                          className="text-sm underline"
                          style={{ color: '#FF6A00', fontFamily: 'Kufam, sans-serif' }}
                        >
                          {t.auth.register.change}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label 
                        htmlFor="password" 
                        className="block text-sm font-medium"
                        style={{ color: '#fff5f0', fontFamily: 'Kufam, sans-serif' }}
                      >
                        {t.auth.register.password}
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t.auth.register.passwordPlaceholder}
                          {...register('password')}
                          className="w-full h-14 pl-4 pr-4 text-lg rounded-xl border-0 focus:ring-2 focus:ring-[#FF6A00]"
                          style={{ 
                            backgroundColor: '#FFF9F5', 
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
                      {errors.password && (
                        <p className="text-sm text-red-400">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label 
                        htmlFor="confirmPassword" 
                        className="block text-sm font-medium"
                        style={{ color: '#fff5f0', fontFamily: 'Kufam, sans-serif' }}
                      >
                        {t.auth.register.confirmPassword}
                      </label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={t.auth.register.confirmPasswordPlaceholder}
                          {...register('confirmPassword')}
                          className="w-full h-14 pl-4 pr-4 text-lg rounded-xl border-0 focus:ring-2 focus:ring-[#FF6A00]"
                          style={{ 
                            backgroundColor: '#FFF9F5', 
                            color: '#2C2C2C',
                            fontFamily: 'Kufam, sans-serif'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                          style={{ color: '#8B8B8B' }}
                        >
                          {showConfirmPassword ? (
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
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-md">
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          required
                          className="w-4 h-4 text-orange-500 bg-white/10 border-white/30 rounded focus:ring-orange-400 focus:ring-2"
                        />
                      </div>
                      <label 
                        htmlFor="terms" 
                        className="text-sm"
                        style={{ color: '#fff5f0', fontFamily: 'Kufam, sans-serif' }}
                      >
                        {t.auth.register.acceptTerms}{' '}
                        <Link href="/terms" className="text-orange-400 hover:text-orange-300">
                          {t.auth.register.termsAndConditions}
                        </Link>{' '}
                        {t.auth.register.andThe}{' '}
                        <Link href="/privacy" className="text-orange-400 hover:text-orange-300">
                          {t.auth.register.privacyPolicy}
                        </Link>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                      style={{ 
                        backgroundColor: '#FF6A00',
                        color: 'white',
                        fontFamily: 'Kufam, sans-serif'
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? t.auth.register.creatingAccount : t.auth.register.createAccount}
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <div 
                  className="text-sm"
                  style={{ color: '#fff5f0', fontFamily: 'Kufam, sans-serif' }}
                >
                  {t.auth.register.alreadyHaveAccount}{' '}
                  <Link
                    href="/auth/login"
                    className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
                  >
                    {t.auth.register.loginHere}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
