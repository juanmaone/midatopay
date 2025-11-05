'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function CustomHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
        <header 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'py-2' : 'py-3'
          }`}
          style={{
            background: isScrolled 
              ? 'rgba(255, 106, 0, 0.9)' 
              : 'rgba(255, 106, 0, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isScrolled 
              ? '0 8px 32px rgba(0, 0, 0, 0.2)' 
              : '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}
        >
      <div className="w-full px-6">
        <nav className="flex items-center justify-between w-full">
          {/* Logo - Completamente a la izquierda */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Image 
                  src="/logo.png" 
                  alt="MidatoPay Logo" 
                  width={isScrolled ? 28 : 32} 
                  height={isScrolled ? 28 : 32}
                  className="object-contain transition-all duration-300"
                />
              </div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}>
                MidatoPay
              </h1>
            </Link>
          </div>

          {/* Menú Central - Desktop */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <Link 
              href="/" 
              className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
              style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
            >
              Home
            </Link>
            <Link 
              href="/anotate" 
              className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
              style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
            >
              Join Waitlist
            </Link>
            <Link 
              href="/aprende" 
              className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
              style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
            >
              Learn
            </Link>
          </div>

          {/* Botones Derecha - Completamente a la derecha */}
          <div className="flex items-center space-x-4 ml-auto">
            <Link 
              href="/auth/login"
              className="px-5 py-2 text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
              style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
            >
              Login
            </Link>
            <Link 
              href="/auth/register"
              className="px-5 py-2 bg-white text-orange-500 text-base font-medium rounded-full transition-all duration-300 hover:bg-gray-100 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              style={{ fontFamily: 'Kufam, sans-serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign Up
            </Link>
          </div>

          {/* Menú Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg transition-all duration-300 hover:bg-white hover:bg-opacity-20"
              style={{ color: '#FFFFFF' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Menú Mobile Desplegable */}
            {isMenuOpen && (
              <div 
                className="md:hidden mt-4 py-4 border-t border-white border-opacity-20 transition-all duration-300"
                style={{
                  background: 'rgba(255, 106, 0, 0.95)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: '0 0 16px 16px'
                }}
              >
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
                style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/anotate" 
                className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
                style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Join Waitlist
              </Link>
              <Link 
                href="/aprende" 
                className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
                style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Learn
              </Link>
              <Link 
                href="/auth/login"
                className="text-base font-medium transition-all duration-300 hover:text-white hover:scale-105"
                style={{ fontFamily: 'Kufam, sans-serif', color: '#FFFFFF' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/auth/register"
                className="text-base font-medium bg-white text-orange-500 px-5 py-2 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:scale-105 hover:shadow-lg text-center flex items-center justify-center gap-2"
                style={{ fontFamily: 'Kufam, sans-serif' }}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
