import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { StatCard } from '@/components/stat-card'
import { createClient } from '@/lib/supabase-server'

export default async function CollaboratorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  const { data: links, count: assignedDays } = user?.id
    ? await supabase
        .from('itinerary_day_collaborators')
        .select('day_id', { count: 'exact' })
        .eq('collaborator_id', user.id)
    : { data: [], count: 0 }

  const dayIds = [...new Set((links || []).map((item) => item.day_id).filter(Boolean))]

  const { data: days } = dayIds.length
    ? await supabase
        .from('itinerary_days')
        .select('id,itinerary_id,day_number,title,route,itineraries(id,title)')
        .in('id', dayIds)
        .order('day_number', { ascending: true })
    : { data: [] }

  const itineraryCount = new Set((days || []).map((day) => day.itinerary_id)).size

  const { count: documentCount } = dayIds.length
    ? await supabase
        .from('itinerary_day_documents')
        .select('*', { count: 'exact', head: true })
        .in('day_id', dayIds)
    : { count: 0 }

  const recentDays = (days || []).slice(0, 5)

  return (
    <PageShell>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Panel colaborador</p>
          <h1 className="mt-1 text-3xl font-black text-white">Hola, {profile?.full_name || user?.email}</h1>
          <p className="mt-2 text-slate-500">Revisa tus días asignados, documentos del itinerario y conversa con clientes o equipo.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Días asignados" value={String(assignedDays ?? 0)} helper="Días donde participas" />
        <StatCard title="Itinerarios" value={String(itineraryCount)} helper="Programas relacionados" />
        <StatCard title="Documentos" value={String(documentCount ?? 0)} helper="PDFs o fotos disponibles" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-300">Resumen</p>
              <h2 className="text-xl font-black text-white">Próximos días asignados</h2>
            </div>
            <Link href="/collaborator/itineraries" className="text-sm font-black text-emerald-300 hover:text-emerald-200">Ver todo</Link>
          </div>
          <div className="space-y-3">
            {recentDays.length ? recentDays.map((day) => (
              <div key={day.id} className="rounded-3xl border border-[#1e293b] bg-[#030712] p-4">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Día {day.day_number}</p>
                <h3 className="mt-1 font-black text-white">{day.title || `Día ${day.day_number}`}</h3>
                {day.route ? <p className="mt-1 text-sm font-semibold text-slate-500">Ruta: {day.route}</p> : null}
              </div>
            )) : (
              <p className="rounded-3xl border border-dashed border-[#334155] bg-[#030712] p-6 text-sm font-semibold text-slate-500">Aún no tienes días asignados.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <Link href="/collaborator/itineraries" className="card block p-6 hover:ring-2 hover:ring-emerald-500/30">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Operación</p>
            <h2 className="mt-2 text-xl font-black text-white">Ver mis itinerarios</h2>
            <p className="mt-2 text-sm text-slate-500">Días, rutas, documentos, comidas, alojamiento y stops.</p>
          </Link>
          <Link href="/collaborator/chat" className="card block p-6 hover:ring-2 hover:ring-emerald-500/30">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Comunicación</p>
            <h2 className="mt-2 text-xl font-black text-white">Abrir chat</h2>
            <p className="mt-2 text-sm text-slate-500">Habla con clientes, administradores y otros colaboradores.</p>
          </Link>
          <Link href="/collaborator/profile" className="card block p-6 hover:ring-2 hover:ring-emerald-500/30">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Perfil</p>
            <h2 className="mt-2 text-xl font-black text-white">Editar mis datos</h2>
            <p className="mt-2 text-sm text-slate-500">Actualiza tu nombre y WhatsApp.</p>
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
