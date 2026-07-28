import Link from 'next/link'
import { ArrowRight, MessageCircle, Route, Users, Map, FileText, UserCog, PlusCircle } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase-server'

function DashboardLinkCard({
  href,
  title,
  value,
  helper,
  icon: Icon,
  accent = 'emerald'
}: {
  href: string
  title: string
  value: string
  helper: string
  icon: any
  accent?: 'emerald' | 'sky' | 'violet' | 'rose'
}) {
  const styles = {
    emerald: 'from-emerald-500/12 to-white text-emerald-600 ring-emerald-500/20 hover:border-emerald-500/35',
    sky: 'from-sky-500/12 to-white text-sky-600 ring-sky-500/20 hover:border-sky-500/35',
    violet: 'from-blue-700/12 to-white text-[#1E40AF] ring-blue-700/20 hover:border-[#1E40AF]/35',
    rose: 'from-rose-500/10 to-white text-rose-600 ring-rose-500/20 hover:border-rose-500/35'
  }[accent]

  return (
    <Link href={href} className={`group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${styles}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="rounded-lg bg-slate-50 p-2 text-slate-500 transition group-hover:bg-white/10 group-hover:text-[#14264F]">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 text-sm font-black uppercase tracking-widest text-slate-500">{title}</p>
      <h3 className="mt-1 break-words text-3xl font-black text-[#14264F]">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </Link>
  )
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 transition hover:border-[#1E40AF]/35 hover:bg-slate-50 hover:text-[#1E40AF]">
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-[#1E40AF] ring-1 ring-slate-200">
          <Icon className="h-5 w-5" />
        </span>
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-500" />
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  const [{ count: tours }, { count: clients }, { count: messages }, { count: itineraries }, { count: collaborators }, { count: documents }] = await Promise.all([
    supabase.from('tours').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
    supabase.from('itineraries').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['collaborator', 'tour_leader']),
    supabase.from('documents').select('*', { count: 'exact', head: true })
  ])

  return (
    <PageShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:mb-8 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1E40AF]">Panel principal</p>
          <h1 className="mt-2 text-2xl font-black text-[#14264F] sm:text-3xl lg:text-4xl">Hola, {profile?.full_name || user?.email}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Gestiona prospectos, clientes, itinerarios, equipo y chats desde accesos rápidos. Todo está optimizado para usarlo también desde celular.</p>
        </div>
        <div className="hidden lg:block">
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardLinkCard href="/itineraries" title="Itinerarios" value={String(itineraries ?? 0)} helper="Crear, editar, ver más y enviar al prospecto." icon={Route} accent="emerald" />
        <DashboardLinkCard href="/clients" title="Prospectos" value={String(clients ?? 0)} helper="Ver, buscar, editar y crear accesos." icon={Users} accent="sky" />
        <DashboardLinkCard href="/chat" title="Mensajes" value={String(messages ?? 0)} helper="Abrir chat directo con clientes y equipo." icon={MessageCircle} accent="violet" />
        <DashboardLinkCard href="/collaborators" title="Colaboradores" value={String(collaborators ?? 0)} helper="Guías, conductores, operaciones y soporte." icon={UserCog} accent="emerald" />
        <DashboardLinkCard href="/tours" title="Tours" value={String(tours ?? 0)} helper="Tours registrados en el sistema." icon={Map} accent="sky" />
        <DashboardLinkCard href="/documents" title="Documentos" value={String(documents ?? 0)} helper="PDFs, fotos y archivos internos." icon={FileText} accent="rose" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E40AF]">Acciones rápidas</p>
              <h2 className="mt-2 text-xl font-black text-[#14264F]">¿Qué quieres hacer ahora?</h2>
            </div>
            <span className="hidden rounded-xl bg-[#14264F]/5 p-3 text-[#1E40AF] ring-1 ring-slate-200 sm:inline-flex">
              <PlusCircle className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickAction href="/itineraries" label="Crear itinerario" icon={Route} />
            <QuickAction href="/clients" label="Registrar prospecto" icon={Users} />
            <QuickAction href="/collaborators" label="Registrar colaborador" icon={UserCog} />
            <QuickAction href="/chat" label="Abrir chat" icon={MessageCircle} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#14264F]/10 bg-gradient-to-br from-[#14264F]/5 via-white to-sky-500/10 p-5 shadow-sm lg:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E40AF]">Modo móvil</p>
          <h2 className="mt-2 text-xl font-black text-[#14264F]">Navegación rápida abajo</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">En celular tendrás accesos directos a Dashboard, Itinerarios, Prospectos y Chat para operar más rápido durante el día.</p>
        </div>
      </div>
    </PageShell>
  )
}
