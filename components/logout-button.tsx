'use client'

import { createClient } from '@/lib/supabase-browser'

export function LogoutButton() {
  const supabase = createClient()
  async function logout() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null)
      registration?.active?.postMessage({ type: 'CLEAR_OFFLINE_CACHE' })
    }
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  return <button onClick={logout} className="btn-secondary">Cerrar sesión</button>
}
