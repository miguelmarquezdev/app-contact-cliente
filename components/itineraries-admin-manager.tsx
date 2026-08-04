'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bell, CalendarDays, Eye, Pencil, Plus, Route, Search, Trash2, Users } from 'lucide-react'
import { ItineraryBuilder, type CollaboratorOption, type TourTemplateOption, type HotelOption } from '@/components/itinerary-builder'
import { ItineraryDaysTabs, type ItineraryTabDay } from '@/components/itinerary-days-tabs'
import { ItineraryProposalPanel } from '@/components/itinerary-proposal-panel'

type Itinerary = {
  id: string
  title: string
  description: string | null
  image_url?: string | null
  updated_at?: string | null
  itinerary_days: ItineraryTabDay[] | null
  client_itineraries?: {
    id: string
    note: string | null
    proposal_status?: string | null
    version_number?: number | null
    clients: { id: string; lifecycle_status?: string | null; proposal_status?: string | null; profiles: { full_name: string | null; email: string | null } | null } | null
  }[] | null
}

type ClientOption = {
  id: string
  lifecycle_status?: string | null
  proposal_status?: string | null
  profiles: { full_name: string | null; email: string | null } | null
}

type ActionFn = (formData: FormData) => void | Promise<void>

type Mode =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'detail'; itineraryId: string }

function countStops(days: ItineraryTabDay[]) {
  return days.reduce((sum, day) => sum + (day.itinerary_stops?.length || 0), 0)
}

function countDocuments(days: ItineraryTabDay[]) {
  return days.reduce((sum, day) => sum + (day.itinerary_day_documents?.length || 0), 0)
}

function countTeam(days: ItineraryTabDay[]) {
  const ids = new Set<string>()
  days.forEach((day) => {
    ;(day.itinerary_day_collaborators || []).forEach((item) => {
      if (item.profiles?.id) ids.add(item.profiles.id)
    })
  })
  return ids.size
}

function hasClientUpdate(itinerary: Itinerary) {
  return (itinerary.client_itineraries || []).some((assignment) =>
    assignment.proposal_status === 'changes_requested' ||
    assignment.proposal_status === 'rejected' ||
    assignment.proposal_status === 'accepted'
  )
}

function updateSignature(itinerary: Itinerary) {
  const events = (itinerary.client_itineraries || [])
    .filter((assignment) =>
      assignment.proposal_status === 'changes_requested' ||
      assignment.proposal_status === 'rejected' ||
      assignment.proposal_status === 'accepted'
    )
    .map((assignment) => `${assignment.id}:${assignment.proposal_status || ''}:${assignment.version_number || 1}`)
    .sort()
    .join('|')
  return `${itinerary.id}:${events || 'none'}`
}

export function ItinerariesAdminManager({
  itineraries,
  clients,
  collaborators,
  tourTemplates,
  hotels,
  createAction,
  assignAction,
  removeAssignmentAction,
  deleteAction,
}: {
  itineraries: Itinerary[]
  clients: ClientOption[]
  collaborators: CollaboratorOption[]
  tourTemplates: TourTemplateOption[]
  hotels: HotelOption[]
  createAction: ActionFn
  assignAction: ActionFn
  removeAssignmentAction: ActionFn
  deleteAction: ActionFn
}) {
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [query, setQuery] = useState('')
  const [reviewedUpdates, setReviewedUpdates] = useState<string[]>([])

  useEffect(() => {
    try {
      setReviewedUpdates(JSON.parse(localStorage.getItem('happy-manager-reviewed-itinerary-updates') || '[]'))
    } catch {
      setReviewedUpdates([])
    }
  }, [])

  const openItineraryDetail = (itinerary: Itinerary) => {
    if (hasClientUpdate(itinerary)) {
      const signature = updateSignature(itinerary)
      const next = Array.from(new Set([...reviewedUpdates, signature]))
      setReviewedUpdates(next)
      localStorage.setItem('happy-manager-reviewed-itinerary-updates', JSON.stringify(next))
    }
    setMode({ type: 'detail', itineraryId: itinerary.id })
  }

  useEffect(() => {
    const openCreate = () => setMode({ type: 'create' })
    window.addEventListener('app:create', openCreate)
    return () => window.removeEventListener('app:create', openCreate)
  }, [])

  useEffect(() => {
    const handleSearch = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      setQuery(customEvent.detail || '')
    }
    window.addEventListener('app:search', handleSearch)
    return () => window.removeEventListener('app:search', handleSearch)
  }, [])

  const filteredItineraries = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return itineraries
    return itineraries.filter((itinerary) => {
      const days = itinerary.itinerary_days || []
      const haystack = [
        itinerary.title,
        itinerary.description,
        ...days.map((day) => `${day.title || ''} ${day.route || ''} ${day.description || ''}`),
      ].join(' ').toLowerCase()
      return haystack.includes(value)
    })
  }, [itineraries, query])

  const selectedItinerary = mode.type === 'detail' ? itineraries.find((item) => item.id === mode.itineraryId) : null

  if (mode.type === 'create') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a itinerarios
          </button>
          <p className="text-sm font-semibold text-slate-500">Completa el formulario y guarda el itinerario al final.</p>
        </div>
        <ItineraryBuilder action={createAction} collaborators={collaborators} tourTemplates={tourTemplates} hotels={hotels} simpleCreate />
      </div>
    )
  }

  if (mode.type === 'detail' && selectedItinerary) {
    const days = [...(selectedItinerary.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
    const hasUpdate = hasClientUpdate(selectedItinerary) && !reviewedUpdates.includes(updateSignature(selectedItinerary))
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver
          </button>
          <div className="flex flex-wrap gap-2">
            <Link href={`/itineraries/${selectedItinerary.id}/edit`} className="inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-black text-[#14264F] transition hover:bg-amber-50">
              <Pencil className="mr-2 h-4 w-4 text-amber-600" /> Editar
            </Link>
            <form action={deleteAction}>
              <input type="hidden" name="itinerary_id" value={selectedItinerary.id} />
              <button className="inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Eliminar
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[180px_1fr]">
            <div className="relative h-44 overflow-hidden rounded-3xl bg-slate-100 lg:h-full">
              {selectedItinerary.image_url ? (
                <img src={selectedItinerary.image_url} alt={selectedItinerary.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#14264F] to-[#1E40AF] text-white">
                  <Route className="h-10 w-10 opacity-80" />
                </div>
              )}
              {hasUpdate ? (
                <span className="absolute right-3 top-3 flex h-9 w-9 animate-bell-swing items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
                  <Bell className="h-4 w-4" />
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Información del itinerario</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-[#14264F]">{selectedItinerary.title}</h2>
              {selectedItinerary.description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{selectedItinerary.description}</p> : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xl font-black text-[#14264F]">{days.length}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Días</p></div>
                <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xl font-black text-[#14264F]">{countStops(days)}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stops</p></div>
                <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xl font-black text-[#14264F]">{countDocuments(days)}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Docs</p></div>
                <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xl font-black text-[#14264F]">{countTeam(days)}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Equipo</p></div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <ItineraryProposalPanel
              itineraryId={selectedItinerary.id}
              clients={clients}
              initialAssignments={selectedItinerary.client_itineraries || []}
            />
          </div>

          <div className="p-4 sm:p-6">
            <ItineraryDaysTabs days={days} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card hidden p-5 sm:p-6 lg:block">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Itinerarios guardados</p>
            <h2 className="mt-1 text-2xl font-black text-[#14264F]">Lista de itinerarios</h2>
            <p className="mt-2 text-sm text-slate-500">Crea versiones de propuesta y revisa cada itinerario antes de enviarlo.</p>
          </div>
          <button type="button" onClick={() => setMode({ type: 'create' })} className="btn-primary w-full sm:w-fit">
            <Plus className="mr-2 inline h-4 w-4" /> Crear nuevo itinerario
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#14264F] outline-none placeholder:text-slate-600"
            placeholder="Buscar por nombre, ruta o descripción..."
          />
        </div>
      </div>

      {!filteredItineraries.length ? (
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14264F]/10 text-[#0EA5E9]">
            <Route className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-black text-[#14264F]">No hay itinerarios</h3>
          <p className="mt-2 text-sm text-slate-500">Crea tu primer itinerario para empezar.</p>
          <button type="button" onClick={() => setMode({ type: 'create' })} className="btn-primary mt-5">
            Crear nuevo itinerario
          </button>
        </div>
      ) : null}

      <div className="grid gap-3">
        {filteredItineraries.map((itinerary) => {
          const days = [...(itinerary.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
          const hasUpdate = hasClientUpdate(itinerary) && !reviewedUpdates.includes(updateSignature(itinerary))
          return (
            <article key={itinerary.id} className="rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md sm:p-4">
              <div className="flex gap-3 lg:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-28">
                  {itinerary.image_url ? (
                    <img src={itinerary.image_url} alt={itinerary.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#14264F] to-[#1E40AF] text-white">
                      <Route className="h-6 w-6 opacity-80" />
                    </div>
                  )}
                  {hasUpdate ? (
                    <span className="absolute right-1.5 top-1.5 flex h-7 w-7 animate-bell-swing items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
                      <Bell className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1E40AF]">Itinerario</p>
                  <h3 className="mt-1 line-clamp-1 text-base font-black leading-tight text-[#14264F] sm:text-xl">{itinerary.title}</h3>
                  {itinerary.description ? <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500 sm:text-sm">{itinerary.description}</p> : null}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"><CalendarDays className="mr-1 inline h-3.5 w-3.5 text-[#1E40AF]" />{days.length} días</span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"><Route className="mr-1 inline h-3.5 w-3.5 text-[#1E40AF]" />{countStops(days)} stops</span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"><Users className="mr-1 inline h-3.5 w-3.5 text-[#1E40AF]" />{countTeam(days)} equipo</span>
                    {hasUpdate ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">Actualización</span> : null}
                  </div>
                </div>

                <div className="hidden shrink-0 gap-2 lg:flex">
                  <button type="button" onClick={() => openItineraryDetail(itinerary)} className="inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-black text-[#14264F] transition hover:bg-blue-50">
                    <Eye className="mr-2 h-4 w-4 text-blue-600" /> Ver
                  </button>
                  <Link href={`/itineraries/${itinerary.id}/edit`} className="inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-black text-[#14264F] transition hover:bg-amber-50">
                    <Pencil className="mr-2 h-4 w-4 text-amber-600" /> Editar
                  </Link>
                  <form action={deleteAction}>
                    <input type="hidden" name="itinerary_id" value={itinerary.id} />
                    <button className="inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50"><Trash2 className="mr-2 h-4 w-4 text-red-600" /> Eliminar</button>
                  </form>
                </div>
              </div>

              <div className="mt-2 flex gap-2 lg:hidden">
                <button type="button" onClick={() => openItineraryDetail(itinerary)} className="flex-1 rounded-xl py-2 text-xs font-black text-[#14264F] hover:bg-blue-50"><Eye className="mr-1 inline h-4 w-4 text-blue-600" /> Ver</button>
                <Link href={`/itineraries/${itinerary.id}/edit`} className="flex-1 rounded-xl py-2 text-center text-xs font-black text-[#14264F] hover:bg-amber-50"><Pencil className="mr-1 inline h-4 w-4 text-amber-600" /> Editar</Link>
                <form action={deleteAction} className="flex-1">
                  <input type="hidden" name="itinerary_id" value={itinerary.id} />
                  <button className="w-full rounded-xl py-2 text-xs font-black text-red-600 hover:bg-red-50"><Trash2 className="mr-1 inline h-4 w-4 text-red-600" /> Eliminar</button>
                </form>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
