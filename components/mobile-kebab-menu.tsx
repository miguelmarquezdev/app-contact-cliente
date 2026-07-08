'use client'

import { useEffect, useRef, useState } from 'react'
import { LogOut, MoreVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type MobileKebabMenuProps = {
  className?: string
  buttonClassName?: string
}

export function MobileKebabMenu({ className = '', buttonClassName = '' }: MobileKebabMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) setOpen(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function logout() {
    setOpen(false)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null)
      registration?.active?.postMessage({ type: 'CLEAR_OFFLINE_CACHE' })
    }
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div ref={menuRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/14 text-violet-100 ring-1 ring-violet-400/10 transition active:scale-95 hover:bg-violet-500/22 ${buttonClassName}`}
        aria-label="Abrir opciones"
        aria-expanded={open}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed right-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-[80] w-56 overflow-hidden rounded-3xl border border-violet-400/12 bg-[#151322]/98 py-2 text-left shadow-2xl shadow-black/50 backdrop-blur-xl">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/[.06] active:bg-white/[.08]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-400/10">
              <LogOut className="h-4 w-4" />
            </span>
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}
