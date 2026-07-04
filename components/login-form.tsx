'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export function LoginForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={login} className="card w-full max-w-md p-8">
      <h1 className="text-3xl font-black text-white">Ingresar</h1>
      <p className="mt-2 text-sm text-slate-500">Accede al panel de tours, clientes e itinerarios.</p>

      <div className="mt-6 space-y-4">
        <input className="input" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </div>
    </form>
  )
}
