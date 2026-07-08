import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { StatCard } from '@/components/stat-card'
import { createClient } from '@/lib/supabase-server'

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  const { data: client } = await supabase.from('clients').select('id,country,passport_number').eq('profile_id', user?.id).single()

  const { count: assignedCount } = client?.id
    ? await supabase.from('client_itineraries').select('*', { count: 'exact', head: true }).eq('client_id', client.id)
    : { count: 0 }

  return (
    <PageShell>
      <div className="mb-8 hidden flex-col justify-between gap-4 lg:flex lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Portal del cliente</p>
          <h1 className="mt-1 text-3xl font-black text-white">Hola, {profile?.full_name || user?.email}</h1>
          <p className="mt-2 text-slate-500">Aquí podrás ver los itinerarios que la agencia te envía y actualizar tus datos.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Itinerarios recibidos" value={String(assignedCount ?? 0)} helper="Programas enviados por la agencia" />
        <StatCard title="Correo" value={profile?.email || '-'} helper="Usuario de acceso" />
        <StatCard title="País" value={client?.country || 'Sin registrar'} helper="Dato editable desde mi perfil" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/client/itineraries" className="card block p-6 hover:ring-2 hover:ring-emerald-500/30">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Mis viajes</p>
          <h2 className="mt-2 text-xl font-black text-white">Ver itinerarios recibidos</h2>
          <p className="mt-2 text-sm text-slate-500">Revisa días, rutas, comidas, alojamiento y stops del viaje.</p>
        </Link>
        <Link href="/client/chat" className="card block p-6 hover:ring-2 hover:ring-emerald-500/30">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Comunicación</p>
          <h2 className="mt-2 text-xl font-black text-white">Chat con el equipo</h2>
          <p className="mt-2 text-sm text-slate-500">Habla en vivo con colaboradores, tour leaders o administración.</p>
        </Link>
        <Link href="/client/profile" className="card block p-6 hover:ring-2 hover:ring-emerald-500/30">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Mis datos</p>
          <h2 className="mt-2 text-xl font-black text-white">Editar perfil</h2>
          <p className="mt-2 text-sm text-slate-500">Actualiza nombre, WhatsApp, país y pasaporte.</p>
        </Link>
      </div>
    </PageShell>
  )
}
