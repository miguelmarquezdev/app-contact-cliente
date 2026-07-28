import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWARegister } from '@/components/pwa-register'
import { OfflineStatus } from '@/components/offline-status'
import { OfflineNavigationGuard } from '@/components/offline-navigation-guard'
import { RealtimeAppRefresh } from '@/components/realtime-app-refresh'

export const metadata: Metadata = {
  title: 'Sunbeam App',
  description: 'CRM turístico de Sunbeam Journeys con itinerarios, prospectos, clientes, documentos y chat.',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sunbeam App'
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png', shortcut: '/icons/icon-192.png'
  }
}

export const viewport: Viewport = {
  themeColor: '#14264F',
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
        <RealtimeAppRefresh />
      </body>
    </html>
  )
}
