import Link from 'next/link'
import { LayoutDashboard, Users, Map, FileText, MessageCircle, Route, UserCog, User, ClipboardList, BriefcaseBusiness } from 'lucide-react'
import { LogoutButton } from './logout-button'
import { createClient } from '@/lib/supabase-server'

const adminItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/collaborators', label: 'Colaboradores', icon: UserCog },
  { href: '/tours', label: 'Tours', icon: Map },
  { href: '/itineraries', label: 'Itinerarios', icon: Route },
  { href: '/documents', label: 'Docs', icon: FileText },
  { href: '/chat', label: 'Chat', icon: MessageCircle }
]

const adminMobileItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/itineraries', label: 'Itinerarios', icon: Route },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageCircle }
]

const clientItems = [
  { href: '/client/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/client/itineraries', label: 'Itinerarios', icon: ClipboardList },
  { href: '/client/chat', label: 'Chat', icon: MessageCircle },
  { href: '/client/profile', label: 'Perfil', icon: User }
]

const collaboratorItems = [
  { href: '/collaborator/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/collaborator/itineraries', label: 'Mis días', icon: Route },
  { href: '/collaborator/chat', label: 'Chat', icon: MessageCircle },
  { href: '/collaborator/profile', label: 'Perfil', icon: User }
]

export async function Sidebar({ hideMobileNav = false }: { hideMobileNav?: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role,full_name,email').eq('id', user?.id).single()
  const role = profile?.role
  const isClient = role === 'client'
  const isCollaborator = role === 'collaborator' || role === 'tour_leader'
  const items = isClient ? clientItems : isCollaborator ? collaboratorItems : adminItems
  const mobileItems = isClient ? clientItems : isCollaborator ? collaboratorItems : adminMobileItems
  const portalLabel = isClient ? 'Portal cliente' : isCollaborator ? 'Panel equipo' : 'Tour CRM'
  const icon = isCollaborator ? <BriefcaseBusiness className="h-6 w-6" /> : <Route className="h-6 w-6" />

  return (
    <>
      <aside className="hidden min-h-screen w-72 border-r border-[#1e293b] bg-[#08111f]/95 p-6 shadow-2xl shadow-black/20 backdrop-blur lg:flex lg:flex-col">
        <div className="mb-8 rounded-3xl border border-[#1e293b] bg-[#0b1220] p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            {icon}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-sky-300">{portalLabel}</p>
          <h1 className="mt-1 text-2xl font-black text-white">Happy Manager</h1>
          {profile ? <p className="mt-2 truncate text-xs font-semibold text-slate-500">{profile.full_name || profile.email}</p> : null}
        </div>
        <nav className="flex-1 space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-sky-500/10 hover:text-sky-300 hover:shadow-lg hover:shadow-black/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] text-slate-400 ring-1 ring-[#1e293b] transition group-hover:bg-sky-500/15 group-hover:text-sky-300 group-hover:ring-sky-500/30">
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-800 pt-4">
          <LogoutButton variant="sidebar" />
        </div>
      </aside>

      {!hideMobileNav ? <div className="fixed inset-x-2 bottom-2 z-50 rounded-[1.7rem] border border-violet-400/15 bg-[#0b0820]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl lg:hidden">
        <nav className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="group flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-black text-slate-400 transition active:scale-95 hover:bg-emerald-500/10 hover:text-emerald-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900/90 text-slate-400 ring-1 ring-slate-800 transition group-hover:bg-emerald-500/15 group-hover:text-emerald-300 group-hover:ring-emerald-500/30">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="max-w-full truncate leading-none">{item.label}</span>
              </Link>
            )
          })}
          <LogoutButton variant="mobileNav" />
        </nav>
      </div> : null}
    </>
  )
}

