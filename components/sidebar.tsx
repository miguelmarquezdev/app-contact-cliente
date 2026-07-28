import Link from 'next/link'
import { LayoutDashboard, Users, Map, FileText, MessageCircle, Route, UserCog, User, ClipboardList, BriefcaseBusiness, Hotel } from 'lucide-react'
import { LogoutButton } from './logout-button'
import { SunbeamLogo } from './sunbeam-logo'
import { MobileBottomNav } from './mobile-bottom-nav'
import { MobileAppHeader } from './mobile-app-header'
import { createClient } from '@/lib/supabase-server'

const adminItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Prospectos', icon: Users },
  { href: '/collaborators', label: 'Colaboradores', icon: UserCog },
  { href: '/tours', label: 'Tours', icon: Map },
  { href: '/hotels', label: 'Hoteles', icon: Hotel },
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

  return (
    <>
      {!hideMobileNav && !hideMobileHeader ? <MobileAppHeader role={role} /> : null}

      <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white p-5 shadow-[10px_0_30px_rgba(15,23,42,.04)] lg:flex lg:flex-col">
        <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SunbeamLogo />
          <p className="mt-4 text-[11px] font-black uppercase tracking-[.18em] text-[#1E40AF]">{portalLabel}</p>
          {profile ? <p className="mt-2 truncate text-xs font-semibold text-slate-500">{profile.full_name || profile.email}</p> : null}
        </div>
        <nav className="flex-1 space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#14264F]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-[#1E40AF] ring-1 ring-slate-200 transition group-hover:bg-[#14264F] group-hover:text-white group-hover:ring-[#14264F]">
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-200 pt-4">
          <LogoutButton variant="sidebar" />
        </div>
      </aside>

      {!hideMobileNav ? <MobileBottomNav role={role} /> : null}
    </>
  )
}

