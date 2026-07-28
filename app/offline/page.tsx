import Link from 'next/link'
import { WifiOff, CalendarDays, MessageCircle, UserRound } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#14264F]">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#14264F]/10 text-[#0EA5E9] ring-1 ring-emerald-500/20">
          <WifiOff className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-[#0EA5E9]">Modo offline</p>
        <h1 className="mt-2 text-3xl font-black">Sin conexión</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Puedes revisar las secciones del cliente o colaborador que ya abriste antes con internet. El chat y los cambios se enviarán cuando vuelvas a estar conectado.
        </p>

        <div className="mt-6 grid gap-3">
          <Link href="/client/itineraries" className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-[#14264F]/10">
            <CalendarDays className="mb-2 h-5 w-5 text-[#0EA5E9]" />
            <strong>Itinerarios del cliente</strong>
            <p className="mt-1 text-xs text-slate-500">Disponible si ya se abrió una vez online.</p>
          </Link>
          <Link href="/collaborator/itineraries" className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-[#14264F]/10">
            <UserRound className="mb-2 h-5 w-5 text-[#1E40AF]" />
            <strong>Días asignados del colaborador</strong>
            <p className="mt-1 text-xs text-slate-500">Consulta rutas, stops y documentos guardados.</p>
          </Link>
          <Link href="/client/chat" className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-[#14264F]/10">
            <MessageCircle className="mb-2 h-5 w-5 text-[#0EA5E9]" />
            <strong>Chat</strong>
            <p className="mt-1 text-xs text-slate-500">Necesita internet para enviar y recibir mensajes en vivo.</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
