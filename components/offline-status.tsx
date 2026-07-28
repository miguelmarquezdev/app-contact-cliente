'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function OfflineStatus() {
  const [online, setOnline] = useState(true)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    const update = () => {
      const nextOnline = navigator.onLine
      setOnline(nextOnline)
      if (nextOnline) {
        setShowBackOnline(true)
        window.setTimeout(() => setShowBackOnline(false), 2500)
      }
    }

    setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!online) {
    return (
      <div className="fixed inset-x-3 top-3 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-400/30 bg-slate-50/95 px-4 py-3 text-sm font-bold text-amber-100 shadow-2xl shadow-black/40 backdrop-blur md:bottom-6 md:top-auto">
        <WifiOff className="h-5 w-5 shrink-0 text-amber-300" />
        <span>Estás offline. Puedes ver datos guardados, pero chat y cambios necesitan internet.</span>
      </div>
    )
  }

  if (showBackOnline) {
    return (
      <div className="fixed inset-x-3 top-3 z-[90] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[#0EA5E9]/30 bg-[#052e1b]/95 px-4 py-3 text-sm font-bold text-emerald-100 shadow-2xl shadow-black/40 backdrop-blur md:bottom-6 md:top-auto">
        <Wifi className="h-5 w-5 shrink-0 text-[#0EA5E9]" />
        <span>Conexión recuperada.</span>
      </div>
    )
  }

  return null
}
