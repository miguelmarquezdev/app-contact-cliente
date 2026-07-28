'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type LogoutButtonProps = {
  variant?: 'default' | 'sidebar' | 'mobileNav' | 'outlineDanger'
}

export function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
  const supabase = createClient()

  async function logout() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null)
      registration?.active?.postMessage({ type: 'CLEAR_OFFLINE_CACHE' })
    }
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={logout}
        className="group mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 hover:text-red-700"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-600 ring-1 ring-red-100 transition group-hover:bg-red-50">
          <LogOut className="h-5 w-5" />
        </span>
        Cerrar sesión
      </button>
    )
  }

  if (variant === 'mobileNav') {
    return (
      <button
        type="button"
        onClick={logout}
        className="group flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-black text-slate-500 transition active:scale-95 hover:text-red-200"
        aria-label="Cerrar sesión"
      >
        <span className="flex h-9 min-w-12 items-center justify-center rounded-full bg-transparent text-slate-500 transition group-hover:bg-red-500/10 group-hover:text-red-200">
          <LogOut className="h-5 w-5" />
        </span>
        <span className="max-w-full truncate leading-none">Salir</span>
      </button>
    )
  }


  if (variant === 'outlineDanger') {
    return (
      <button
        type="button"
        onClick={logout}
        className="w-full rounded-2xl border border-red-400 bg-white px-5 py-3.5 text-center text-lg font-black text-red-500 transition hover:bg-red-50"
      >
        Sign Out
      </button>
    )
  }

  return <button onClick={logout} className="btn-secondary">Cerrar sesión</button>
}
