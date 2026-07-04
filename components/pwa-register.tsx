'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Save, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const OFFLINE_ROUTES = [
  '/',
  '/login',
  '/offline',
  '/client/dashboard',
  '/client/itineraries',
  '/client/profile',
  '/client/chat',
  '/collaborator/dashboard',
  '/collaborator/itineraries',
  '/collaborator/profile',
  '/collaborator/chat'
]

function cacheOfflineRoutes() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready
    .then((registration) => {
      registration.active?.postMessage({ type: 'CACHE_URLS', urls: OFFLINE_ROUTES })
    })
    .catch(() => undefined)
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showOfflineHint, setShowOfflineHint] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
          cacheOfflineRoutes()
        }).catch(() => undefined)
      })
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      if (!localStorage.getItem('happy-manager-install-dismissed')) {
        setShowHint(true)
      }
    }

    const handleOnline = () => cacheOfflineRoutes()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)

    if (!localStorage.getItem('happy-manager-offline-dismissed')) {
      const timer = window.setTimeout(() => setShowOfflineHint(true), 2500)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('online', handleOnline)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice.catch(() => undefined)
    setShowHint(false)
    setInstallPrompt(null)
  }

  const dismissInstall = () => {
    localStorage.setItem('happy-manager-install-dismissed', '1')
    setShowHint(false)
  }

  const saveOffline = () => {
    cacheOfflineRoutes()
    setSavedOffline(true)
    window.setTimeout(() => setSavedOffline(false), 2200)
  }

  const dismissOffline = () => {
    localStorage.setItem('happy-manager-offline-dismissed', '1')
    setShowOfflineHint(false)
  }

  return (
    <>
      {!isStandalone && showHint && installPrompt ? (
        <div className="fixed inset-x-4 bottom-24 z-[80] rounded-3xl border border-emerald-500/30 bg-[#07111f]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-white">Instalar Happy Manager</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">Guárdalo en tu celular como app y entra más rápido al panel.</p>
              <button type="button" onClick={installApp} className="mt-3 rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-950/30 transition active:scale-95">
                Instalar app
              </button>
            </div>
            <button type="button" onClick={dismissInstall} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label="Cerrar aviso de instalación">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {showOfflineHint ? (
        <div className="fixed inset-x-4 bottom-24 z-[79] rounded-3xl border border-sky-500/25 bg-[#07111f]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl lg:bottom-6 lg:left-auto lg:right-6 lg:w-[380px]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30">
              <Save className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-white">Guardar para usar offline</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">Cliente y colaborador podrán revisar itinerarios/días ya abiertos aunque se queden sin internet.</p>
              <button type="button" onClick={saveOffline} className="mt-3 rounded-2xl bg-sky-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-sky-950/30 transition active:scale-95">
                {savedOffline ? 'Guardado' : 'Guardar offline'}
              </button>
            </div>
            <button type="button" onClick={dismissOffline} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label="Cerrar aviso offline">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
