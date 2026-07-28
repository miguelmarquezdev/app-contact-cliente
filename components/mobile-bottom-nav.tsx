'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, LayoutDashboard, MessageCircle, Route, User, Users } from 'lucide-react'

type MobileBottomNavProps = { role?: string | null }

const adminItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/itineraries', label: 'Itinerarios', icon: Route },
  { href: '/clients', label: 'Prospectos', icon: Users },
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
    <div className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/96 px-2 pb-[calc(.38rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,.07)] backdrop-blur-xl lg:hidden">
      <nav className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} className={`group flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[10px] font-black transition active:scale-95 ${active ? 'text-[#14264F]' : 'text-slate-500 hover:text-[#14264F]'}`} aria-current={active ? 'page' : undefined}>
              <span className={`relative flex h-8 min-w-10 items-center justify-center rounded-full transition ${active ? 'bg-[#14264F] text-white shadow-sm' : 'bg-transparent text-slate-500 group-hover:bg-slate-100 group-hover:text-[#14264F]'}`}>
                <Icon className="h-5 w-5" />
                {item.href.includes('chat') ? <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-[#1E40AF] ring-2 ring-white" /> : null}
              </span>
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
