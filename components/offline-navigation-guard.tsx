'use client'

import { useEffect } from 'react'

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

function isSafeInternalLink(anchor: HTMLAnchorElement) {
  if (!anchor.href) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false

  const url = new URL(anchor.href)
  if (url.origin !== window.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.pathname.startsWith('/_next/')) return false
  return true
}

export function OfflineNavigationGuard() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (navigator.onLine || isModifiedClick(event)) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || !isSafeInternalLink(anchor)) return

      // Cuando no hay internet, Next intenta pedir datos RSC por fetch y la vista se queda colgada.
      // Forzamos navegación normal para que el service worker entregue la última pantalla cacheada.
      event.preventDefault()
      window.location.assign(anchor.href)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
