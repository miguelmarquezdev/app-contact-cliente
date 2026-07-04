import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Happy Manager',
    short_name: 'Happy CRM',
    description: 'App para clientes, colaboradores, itinerarios y chat de turismo.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#10b981',
    orientation: 'portrait',
    categories: ['business', 'travel', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
