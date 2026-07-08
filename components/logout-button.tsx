'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type LogoutButtonProps = {
  variant?: 'default' | 'sidebar' | 'mobileNav'
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
        className="group mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/20 hover:text-red-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-500/20 transition group-hover:bg-red-500/20">
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
        className="group flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-black text-slate-400 transition active:scale-95 hover:text-red-200"
        aria-label="Cerrar sesión"
      >
        <span className="flex h-9 min-w-12 items-center justify-center rounded-full bg-transparent text-slate-400 transition group-hover:bg-red-500/10 group-hover:text-red-200">
          <LogOut className="h-5 w-5" />
        </span>
        <span className="max-w-full truncate leading-none">Salir</span>
      </button>
    )
  }

  return <button onClick={logout} className="btn-secondary">Cerrar sesión</button>
}
