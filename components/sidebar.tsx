import Link from 'next/link'
import { LayoutDashboard, Users, Map, FileText, MessageCircle, Route, UserCog, User, ClipboardList, BriefcaseBusiness } from 'lucide-react'
import { LogoutButton } from './logout-button'
import { MobileBottomNav } from './mobile-bottom-nav'
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

export async function Sidebar({ hideMobileNav = false, hideMobileHeader = false }: { hideMobileNav?: boolean; hideMobileHeader?: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role,full_name,email').eq('id', user?.id).single()
  const role = profile?.role
  const isClient = role === 'client'
  const isCollaborator = role === 'collaborator' || role === 'tour_leader'
  const items = isClient ? clientItems : isCollaborator ? collaboratorItems : adminItems
  const portalLabel = isClient ? 'Portal cliente' : isCollaborator ? 'Panel equipo' : 'Tour CRM'
  const icon = isCollaborator ? <BriefcaseBusiness className="h-6 w-6" /> : <Route className="h-6 w-6" />

  return (
    <>
      {!hideMobileNav && !hideMobileHeader ? (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-violet-400/10 bg-[#0a071d]/95 px-4 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] shadow-xl shadow-black/25 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href={isClient ? '/client/dashboard' : isCollaborator ? '/collaborator/dashboard' : '/dashboard'} className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/14 text-violet-200 ring-1 ring-violet-400/15">
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">{portalLabel}</span>
                <span className="block truncate text-lg font-black text-white">Happy Manager</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href={isClient ? '/client/chat' : isCollaborator ? '/collaborator/chat' : '/chat'} className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/12 text-violet-200 ring-1 ring-violet-400/10" aria-label="Abrir chat">
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>
      ) : null}

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

      {!hideMobileNav ? <MobileBottomNav role={role} /> : null}
    </>
  )
}

