import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWARegister } from '@/components/pwa-register'
import { OfflineStatus } from '@/components/offline-status'

export const metadata: Metadata = {
  title: 'Happy Manager',
  description: 'CRM turístico con itinerarios, clientes, documentos y chat.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Happy Manager'
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  }
}

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <PWARegister />
        <OfflineStatus />
      </body>
    </html>
  )
}
