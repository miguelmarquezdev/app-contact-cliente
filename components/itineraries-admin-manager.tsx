'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Eye, FileText, Plus, Route, Search, Send, Users } from 'lucide-react'
import { ItineraryBuilder, type CollaboratorOption, type TourTemplateOption, type HotelOption } from '@/components/itinerary-builder'
import { ItineraryDaysTabs, type ItineraryTabDay } from '@/components/itinerary-days-tabs'

type Itinerary = {
  id: string
  title: string
  description: string | null
  itinerary_days: ItineraryTabDay[] | null
  client_itineraries?: {
    id: string
    note: string | null
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
        <ItineraryBuilder action={createAction} collaborators={collaborators} tourTemplates={tourTemplates} hotels={hotels} />
      </div>
    )
  }

  if (mode.type === 'detail' && selectedItinerary) {
    const days = [...(selectedItinerary.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver
          </button>
          <div className="flex flex-wrap gap-2">
            <Link href={`/itineraries/${selectedItinerary.id}/edit`} className="btn-secondary py-2">
              Editar
            </Link>
            <form action={deleteAction}>
              <input type="hidden" name="itinerary_id" value={selectedItinerary.id} />
              <button className="btn-danger py-2">Eliminar</button>
            </form>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-[#0b1220] to-sky-500/10 p-6">
            <p className="badge-brand inline-flex">Itinerario / paquete</p>
            <h2 className="mt-3 text-3xl font-black text-[#14264F]">{selectedItinerary.title}</h2>
            {selectedItinerary.description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{selectedItinerary.description}</p> : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{days.length}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Días</p></div>
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{countStops(days)}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Stops</p></div>
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{countDocuments(days)}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Docs</p></div>
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{countTeam(days)}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Equipo</p></div>
            </div>
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
            <p className="mt-2 text-sm text-slate-500">Crea versiones de propuesta, envíalas a prospectos y conviértelas en venta.</p>
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

      <div className="grid gap-4">
        {filteredItineraries.map((itinerary) => {
          const days = [...(itinerary.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
          return (
            <article key={itinerary.id} className="card overflow-hidden transition hover:border-[#14264F]/10">
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-[#0EA5E9]">Itinerario / paquete</p>
                  <h3 className="mt-1 truncate text-2xl font-black text-[#14264F]">{itinerary.title}</h3>
                  {itinerary.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{itinerary.description}</p> : null}
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                    <span className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-slate-600 ring-1 ring-slate-200"><CalendarDays className="mr-1 inline h-4 w-4 text-[#0EA5E9]" /> {days.length} días</span>
                    <span className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-slate-600 ring-1 ring-slate-200"><Route className="mr-1 inline h-4 w-4 text-[#1E40AF]" /> {countStops(days)} stops</span>
                    <span className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-slate-600 ring-1 ring-slate-200"><FileText className="mr-1 inline h-4 w-4 text-[#0EA5E9]" /> {countDocuments(days)} docs</span>
                    <span className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-slate-600 ring-1 ring-slate-200"><Users className="mr-1 inline h-4 w-4 text-[#1E40AF]" /> {countTeam(days)} equipo</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button type="button" onClick={() => setMode({ type: 'detail', itineraryId: itinerary.id })} className="btn-secondary py-2">
                    <Eye className="mr-2 inline h-4 w-4" /> Ver más
                  </button>
                  <Link href={`/itineraries/${itinerary.id}/edit`} className="btn-secondary py-2">
                    Editar
                  </Link>
                  <form action={deleteAction}>
                    <input type="hidden" name="itinerary_id" value={itinerary.id} />
                    <button className="btn-danger py-2">Eliminar</button>
                  </form>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white/55 p-4 sm:p-5">
                <div className="rounded-3xl border border-[#14264F]/10 bg-[#14264F]/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#0EA5E9]">
                    <Send className="h-4 w-4" /> Enviar propuesta a prospecto
                  </div>
                  <form action={assignAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="itinerary_id" value={itinerary.id} />
                    <select name="client_id" className="input" required defaultValue="">
                      <option value="" disabled>Seleccionar prospecto</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.profiles?.full_name || client.profiles?.email || 'Prospecto sin nombre'} — {client.lifecycle_status === 'client' ? 'Cliente' : 'Prospecto'}
                        </option>
                      ))}
                    </select>
                    <input name="note" className="input" placeholder="Nota opcional para el prospecto" />
                    <button className="btn-primary">Enviar</button>
                  </form>

                  {itinerary.client_itineraries?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {itinerary.client_itineraries.map((assignment) => (
                        <form key={assignment.id} action={removeAssignmentAction} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-emerald-500/20">
                          <input type="hidden" name="assignment_id" value={assignment.id} />
                          <span>{assignment.clients?.profiles?.full_name || assignment.clients?.profiles?.email || 'Prospecto'}</span>
                          <button className="text-red-300">Quitar</button>
                        </form>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-semibold text-slate-500">Aún no fue enviado a ningún prospecto.</p>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
