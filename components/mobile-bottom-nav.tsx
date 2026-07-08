'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, LayoutDashboard, MessageCircle, Route, User, Users } from 'lucide-react'
import { LogoutButton } from './logout-button'

type MobileBottomNavProps = {
  role?: string | null
}

const adminItems = [
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

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/chat') return pathname === '/chat'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = role === 'client' ? clientItems : role === 'collaborator' || role === 'tour_leader' ? collaboratorItems : adminItems

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-400/10 bg-[#090712]/98 px-2 pb-[calc(.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl lg:hidden">
      <nav className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-black transition active:scale-95 ${
                active ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`relative flex h-9 min-w-12 items-center justify-center rounded-full transition ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-400/20'
                    : 'bg-transparent text-slate-400 group-hover:bg-white/[.05] group-hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.href.includes('chat') ? (
                  <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090712]" />
                ) : null}
              </span>
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </Link>
          )
        })}
        <LogoutButton variant="mobileNav" />
      </nav>
    </div>
  )
}
