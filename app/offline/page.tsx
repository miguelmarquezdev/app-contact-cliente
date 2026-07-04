import Link from 'next/link'
import { WifiOff, CalendarDays, MessageCircle, UserRound } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-[#1e293b] bg-[#0b1220] p-6 shadow-2xl shadow-black/30">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
          <WifiOff className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Modo offline</p>
        <h1 className="mt-2 text-3xl font-black">Sin conexión</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Puedes revisar las secciones del cliente o colaborador que ya abriste antes con internet. El chat y los cambios se enviarán cuando vuelvas a estar conectado.
        </p>

        <div className="mt-6 grid gap-3">
          <Link href="/client/itineraries" className="rounded-3xl border border-[#1e293b] bg-[#030712] p-4 transition hover:border-emerald-500/40">
            <CalendarDays className="mb-2 h-5 w-5 text-emerald-300" />
            <strong>Itinerarios del cliente</strong>
            <p className="mt-1 text-xs text-slate-500">Disponible si ya se abrió una vez online.</p>
          </Link>
          <Link href="/collaborator/itineraries" className="rounded-3xl border border-[#1e293b] bg-[#030712] p-4 transition hover:border-emerald-500/40">
            <UserRound className="mb-2 h-5 w-5 text-sky-300" />
            <strong>Días asignados del colaborador</strong>
            <p className="mt-1 text-xs text-slate-500">Consulta rutas, stops y documentos guardados.</p>
          </Link>
          <Link href="/client/chat" className="rounded-3xl border border-[#1e293b] bg-[#030712] p-4 transition hover:border-emerald-500/40">
            <MessageCircle className="mb-2 h-5 w-5 text-emerald-300" />
            <strong>Chat</strong>
            <p className="mt-1 text-xs text-slate-500">Necesita internet para enviar y recibir mensajes en vivo.</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
