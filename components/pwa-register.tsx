'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, MonitorDown, Save, Share2, Smartphone, X } from 'lucide-react'

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

function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'
  const ua = window.navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

function isChromeLike() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return /chrome|crios|edg|samsungbrowser/.test(ua) && !/firefox|fxios/.test(ua)
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [showOfflineHint, setShowOfflineHint] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
  const [installed, setInstalled] = useState(false)

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  }, [])

  const device = useMemo(() => getDeviceType(), [])

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
      if (!localStorage.getItem('happy-manager-install-dismissed')) setShowInstall(true)
    }

    const handleInstalled = () => {
      setInstalled(true)
      setShowInstall(false)
      setShowInstallGuide(false)
      localStorage.setItem('happy-manager-installed', '1')
    }

    const handleOnline = () => cacheOfflineRoutes()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('online', handleOnline)

    const installWasDismissed = localStorage.getItem('happy-manager-install-dismissed')
    const offlineWasDismissed = localStorage.getItem('happy-manager-offline-dismissed')

    if (!isStandalone && !installWasDismissed) {
      const timer = window.setTimeout(() => setShowInstall(true), 1200)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleInstalled)
        window.removeEventListener('online', handleOnline)
      }
    }

    if (!offlineWasDismissed) {
      const timer = window.setTimeout(() => setShowOfflineHint(true), 2500)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleInstalled)
        window.removeEventListener('online', handleOnline)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('online', handleOnline)
    }
  }, [isStandalone])

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice.catch(() => undefined)
      if (choice?.outcome === 'accepted') {
        localStorage.setItem('happy-manager-installed', '1')
        setInstalled(true)
      }
      setInstallPrompt(null)
      setShowInstall(false)
      return
    }

    // iPhone/iPad y algunos navegadores no permiten instalar con JavaScript.
    // En vez de redirigir, abrimos instrucciones para instalar correctamente.
    setShowInstallGuide(true)
    setShowInstall(true)
  }

  const dismissInstall = () => {
    localStorage.setItem('happy-manager-install-dismissed', '1')
    setShowInstall(false)
    setShowInstallGuide(false)
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

  const title = device === 'desktop' ? 'Instalar en computadora' : 'Instalar en el celular'
  const icon = device === 'desktop' ? <MonitorDown className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />

  return (
    <>
      {!isStandalone && showInstall ? (
        <div className="fixed inset-x-4 bottom-24 z-[90] rounded-3xl border border-emerald-500/30 bg-[#07111f]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl lg:bottom-6 lg:left-auto lg:right-6 lg:w-[390px]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
              {showInstallGuide ? <Share2 className="h-5 w-5" /> : icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-white">{showInstallGuide ? 'Cómo instalar Happy Manager' : title}</h3>

              {!showInstallGuide ? (
                <>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Instálalo como app real. No abrirá un simple link: quedará en tu pantalla de inicio o escritorio.
                  </p>
                  <button type="button" onClick={installApp} className="mt-3 rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-950/30 transition active:scale-95">
                    <span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Instalar app</span>
                  </button>
                </>
              ) : (
                <div className="mt-2 space-y-2 text-xs leading-5 text-slate-300">
                  {device === 'ios' ? (
                    <>
                      <p><b className="text-white">iPhone:</b> abre esta web en <b>Safari</b>, toca <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b>.</p>
                      <p className="text-slate-400">En iPhone, Chrome solo crea acceso tipo link. Para instalar como app debe ser desde Safari.</p>
                    </>
                  ) : device === 'android' ? (
                    <>
                      <p><b className="text-white">Android:</b> abre esta web en <b>Chrome</b>, toca el menú <b>⋮</b> y elige <b>Instalar app</b>.</p>
                      <p className="text-slate-400">Si sale “Agregar acceso directo”, espera unos segundos y recarga; la web debe estar en HTTPS.</p>
                    </>
                  ) : (
                    <>
                      <p><b className="text-white">Computadora:</b> abre esta web en Chrome o Edge y toca el ícono de instalar en la barra de dirección.</p>
                      <p className="text-slate-400">También puedes entrar al menú <b>⋮</b> y elegir <b>Instalar Happy Manager</b>.</p>
                    </>
                  )}
                </div>
              )}

              {installed ? (
                <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> App instalada</p>
              ) : null}
            </div>
            <button type="button" onClick={dismissInstall} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label="Cerrar aviso de instalación">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {!isStandalone && !showInstall ? (
        <button
          type="button"
          onClick={() => setShowInstall(true)}
          className="fixed bottom-24 right-4 z-[70] hidden rounded-full border border-emerald-500/30 bg-[#07111f]/95 px-4 py-3 text-xs font-black text-emerald-200 shadow-2xl shadow-black/40 backdrop-blur-xl transition active:scale-95 md:inline-flex md:items-center md:gap-2"
        >
          <Download className="h-4 w-4" /> Instalar
        </button>
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
