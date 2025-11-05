import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'MidatoPay - Pagos con Criptomonedas',
  description: 'Sistema de pagos que permite a comercios recibir pagos en criptomonedas y convertirlos automáticamente a pesos argentinos.',
  keywords: ['pagos', 'criptomonedas', 'USDT', 'Bitcoin', 'Ethereum', 'Argentina', 'ARS'],
  authors: [{ name: 'MidatoPay Team' }],
  openGraph: {
    title: 'MidatoPay - Pagos con Criptomonedas',
    description: 'Recibe pagos en criptomonedas y conviértelos automáticamente a pesos argentinos',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MidatoPay - Pagos con Criptomonedas',
    description: 'Recibe pagos en criptomonedas y conviértelos automáticamente a pesos argentinos',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#667eea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
