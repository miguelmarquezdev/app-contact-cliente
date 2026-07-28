'use client'

import { usePathname } from 'next/navigation'
import {
  ClipboardList,
  LayoutDashboard,
  Route,
  User,
  Users,
  UserCog,
  FileText,
  Map,
  Hotel,
  BriefcaseBusiness,
  Plus,
  Search
} from 'lucide-react'
import { MobileKebabMenu } from './mobile-kebab-menu'
import { SunbeamLogo } from './sunbeam-logo'

type MobileAppHeaderProps = {
  role?: string | null
}

const pageCopy = [
  {
    match: (path: string) => path === '/dashboard',
    label: 'Panel admin',
    title: 'Dashboard',
    icon: LayoutDashboard,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path.startsWith('/itineraries'),
    label: 'Itinerarios independientes',
    title: 'Itinerarios',
    icon: Route,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path.startsWith('/clients'),
    label: 'Pipeline',
    title: 'Prospectos',
    icon: Users,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path.startsWith('/collaborators'),
    label: 'Equipo operativo',
    title: 'Colaboradores',
    icon: UserCog,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path.startsWith('/tours'),
    label: 'Servicios',
    title: 'Tours',
    icon: Map,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path.startsWith('/hotels'),
    label: 'Alojamientos',
    title: 'Hoteles',
    icon: Hotel,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path.startsWith('/documents'),
    label: 'Archivos',
    title: 'Documentos',
    icon: FileText,
    chatHref: '/chat'
  },
  {
    match: (path: string) => path === '/client/dashboard',
    label: 'Portal cliente',
    title: 'Inicio',
    icon: LayoutDashboard,
    chatHref: '/client/chat'
  },
  {
    match: (path: string) => path.startsWith('/client/itineraries'),
    label: 'Mis viajes',
    title: 'Itinerarios',
    icon: ClipboardList,
    chatHref: '/client/chat'
  },
  {
    match: (path: string) => path.startsWith('/client/profile'),
    label: 'Mi cuenta',
    title: 'Perfil',
    icon: User,
    chatHref: '/client/chat'
  },
  {
    match: (path: string) => path === '/collaborator/dashboard',
    label: 'Panel equipo',
    title: 'Dashboard',
    icon: BriefcaseBusiness,
    chatHref: '/collaborator/chat'
  },
  {
    match: (path: string) => path.startsWith('/collaborator/itineraries'),
    label: 'Operación asignada',
    title: 'Mis días',
    icon: Route,
    chatHref: '/collaborator/chat'
  },
  {
    match: (path: string) => path.startsWith('/collaborator/profile'),
    label: 'Mi cuenta',
    title: 'Perfil',
    icon: User,
    chatHref: '/collaborator/chat'
  }
]

function fallbackByRole(role?: string | null) {
  if (role === 'client') {
    return { label: 'Portal cliente', title: 'Inicio', icon: LayoutDashboard, chatHref: '/client/chat' }
  }
  if (role === 'collaborator' || role === 'tour_leader') {
    return { label: 'Panel equipo', title: 'Inicio', icon: BriefcaseBusiness, chatHref: '/collaborator/chat' }
  }
  return { label: 'Tour CRM', title: 'Dashboard', icon: LayoutDashboard, chatHref: '/chat' }
}

export function MobileAppHeader({ role }: MobileAppHeaderProps) {
  const pathname = usePathname()
  const current = pageCopy.find((item) => item.match(pathname)) || fallbackByRole(role)
  const canCreate = pathname.startsWith('/itineraries') || pathname.startsWith('/clients') || pathname.startsWith('/collaborators') || pathname.startsWith('/tours') || pathname.startsWith('/hotels')
  const canSearch = canCreate
  const placeholder = pathname.startsWith('/clients')
    ? 'Buscar prospecto...'
    : pathname.startsWith('/collaborators')
      ? 'Buscar colaborador...'
      : pathname.startsWith('/tours')
        ? 'Buscar tour...'
        : pathname.startsWith('/hotels')
          ? 'Buscar hotel...'
          : pathname.startsWith('/itineraries')
            ? 'Buscar itinerario...'
            : 'Buscar...'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/96 px-4 pb-2.5 pt-[calc(.65rem+env(safe-area-inset-top))] shadow-[0_6px_22px_rgba(15,23,42,.04)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 leading-none">
          <div className="flex items-center gap-3">
            <SunbeamLogo compact />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#1E40AF]">{current.label}</p>
              <h1 className="truncate text-[1.18rem] font-black leading-tight text-[#14264F]">{current.title}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCreate ? (
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('app:create'))} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#14264F] text-white shadow-sm active:scale-95" aria-label="Crear nuevo">
              <Plus className="h-5 w-5 stroke-[3]" />
            </button>
          ) : null}
          <MobileKebabMenu />
        </div>
      </div>
      {canSearch ? (
        <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Search className="h-5 w-5 shrink-0 text-slate-500" />
          <input type="search" placeholder={placeholder} onChange={(event) => window.dispatchEvent(new CustomEvent('app:search', { detail: event.target.value }))} className="w-full bg-transparent text-sm font-bold text-[#14264F] outline-none placeholder:text-slate-500" />
        </div>
      ) : null}
    </header>
  )
}
