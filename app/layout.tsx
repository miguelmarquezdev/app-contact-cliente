import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWARegister } from '@/components/pwa-register'
import { OfflineStatus } from '@/components/offline-status'
import { OfflineNavigationGuard } from '@/components/offline-navigation-guard'

export const metadata: Metadata = {
  title: 'Happy Manager',
  description: 'CRM turístico con itinerarios, clientes, documentos y chat.',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Happy Manager'
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png', shortcut: '/icons/icon-192.png'
  }
}

export const viewport: Viewport = {
  themeColor: '#0a071d',
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
        <OfflineNavigationGuard />
        <OfflineStatus />
      </body>
    </html>
  )
}
