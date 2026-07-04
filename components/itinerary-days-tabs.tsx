'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'

type Stop = {
  id: string
  place: string | null
  title: string | null
  duration: string | null
  description: string | null
  includes_ticket: boolean | null
  order_index: number | null
}

type DayDocument = {
  id: string
  title: string
  file_url: string
  file_type: string | null
}

type DayCollaborator = {
  id: string
  profiles: { id: string; full_name: string | null; email: string | null; role: string | null; position?: string | null } | null
}

export type ItineraryTabDay = {
  id: string
  day_number: number
  title: string
  route: string | null
  food: string | null
  hotel: string | null
  description: string | null
  itinerary_stops: Stop[] | null
  itinerary_day_documents: DayDocument[] | null
  itinerary_day_collaborators: DayCollaborator[] | null
}

export function ItineraryDaysTabs({ days, chatBasePath, compact = false }: { days: ItineraryTabDay[]; chatBasePath?: string; compact?: boolean }) {
  const orderedDays = useMemo(() => [...days].sort((a, b) => a.day_number - b.day_number), [days])
  const [activeDayId, setActiveDayId] = useState(orderedDays[0]?.id || '')
  const [showResume, setShowResume] = useState(false)

  if (!orderedDays.length) {
    return (
      <div className="mt-5 rounded-3xl border border-dashed border-[#334155] bg-[#030712] p-6 text-sm font-semibold text-slate-500">
        Este itinerario todavía no tiene días registrados.
      </div>
    )
  }

  const activeDay = orderedDays.find((day) => day.id === activeDayId) || orderedDays[0]
  const stops = [...(activeDay.itinerary_stops || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  const collaborators = activeDay.itinerary_day_collaborators || []
  const documents = activeDay.itinerary_day_documents || []

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-[#1e293b] bg-[#030712]">
      <div className="border-b border-[#1e293b] bg-[#0b1220] p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Vista por días</p>
            <h4 className="mt-1 text-base font-black text-white sm:text-lg">Selecciona un día</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowResume(true)}
            className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-black text-sky-300 transition hover:bg-sky-500/20"
          >
            Resumen completo
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {orderedDays.map((day) => {
            const isActive = day.id === activeDay.id
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveDayId(day.id)}
                className={`${compact ? 'min-w-[118px] px-3 py-3' : 'min-w-[170px] px-4 py-3'} rounded-2xl border text-left transition ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-950/20'
                    : 'border-[#334155] bg-[#111827] hover:border-sky-500/50 hover:bg-sky-500/10'
                }`}
              >
                <span className={isActive ? 'text-xs font-black uppercase tracking-widest text-emerald-300' : 'text-xs font-black uppercase tracking-widest text-slate-500'}>
                  Día {day.day_number}
                </span>
                <span className="mt-1 block truncate text-sm font-black text-white">{day.title || `Día ${day.day_number}`}</span>
                {!compact && day.route ? <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{day.route}</span> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className={compact ? 'p-3 sm:p-5' : 'p-5'}>
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[#0b1220] to-sky-500/10 p-4 ring-1 ring-[#1e293b] sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="badge-brand inline-flex">Día {activeDay.day_number}</p>
              <h4 className="mt-3 text-2xl font-black text-white">{activeDay.title || `Día ${activeDay.day_number}`}</h4>
              {activeDay.route ? <p className="mt-1 text-sm font-bold text-slate-400">Ruta: {activeDay.route}</p> : null}
              {activeDay.description ? <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{activeDay.description}</p> : null}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center md:min-w-72">
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]">
                <p className="text-xl font-black text-white">{stops.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stops</p>
              </div>
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]">
                <p className="text-xl font-black text-white">{documents.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Docs</p>
              </div>
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]">
                <p className="text-xl font-black text-white">{collaborators.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Equipo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-[#1e293b] bg-[#0b1220] p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-sky-300">Recorrido</p>
                <h5 className="text-xl font-black text-white">Stops del día</h5>
              </div>
              <span className="rounded-full bg-[#030712] px-3 py-1 text-xs font-black text-slate-400 ring-1 ring-[#334155]">{stops.length} stops</span>
            </div>

            <div className="relative space-y-4 border-l-2 border-dashed border-emerald-500/35 pl-5 sm:pl-6">
              {stops.length ? stops.map((stop, index) => (
                <div key={stop.id} className="relative rounded-3xl border border-[#334155] bg-[#111827] p-4 transition hover:border-emerald-500/40 hover:bg-[#0f172a] sm:p-5">
                  <span className="absolute -left-[34px] top-5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white shadow-lg shadow-emerald-950/40 sm:-left-[39px]">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h6 className="text-lg font-black text-white">{stop.place || stop.title || `Stop ${index + 1}`}</h6>
                      {stop.duration ? <p className="mt-1 text-sm font-semibold text-slate-500">Parada: {stop.duration}</p> : null}
                    </div>
                    {stop.includes_ticket ? (
                      <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                        Entrada incluida
                      </span>
                    ) : null}
                  </div>
                  {stop.description ? <p className="mt-4 text-sm leading-6 text-slate-300">{stop.description}</p> : null}
                </div>
              )) : (
                <div className="rounded-3xl border border-dashed border-[#334155] bg-[#111827] p-6 text-sm font-semibold text-slate-500">
                  Este día todavía no tiene stops.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[#1e293b] bg-[#0b1220] p-4 sm:p-5">
              <p className="text-xs font-black uppercase tracking-widest text-sky-300">Equipo</p>
              <h5 className="mt-1 text-lg font-black text-white">Colaboradores</h5>
              {collaborators.length ? (
                <div className="mt-4 space-y-2">
                  {collaborators.map((item) => {
                    const content = (
                      <div className="rounded-2xl bg-[#111827] p-3 ring-1 ring-[#334155] transition hover:-translate-y-0.5 hover:ring-emerald-500/40 hover:bg-emerald-500/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-black text-white">{item.profiles?.full_name || item.profiles?.email || 'Colaborador'}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{item.profiles?.position || 'Guía'} · {item.profiles?.role === 'tour_leader' ? 'Tour Leader' : 'Colaborador'}</p>
                          </div>
                          {chatBasePath && item.profiles?.id ? (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-300">
                              <MessageCircle className="h-3 w-3" /> Chat
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )

                    if (chatBasePath && item.profiles?.id) {
                      return (
                        <Link key={item.id} href={`${chatBasePath}?contact=${item.profiles.id}`} className="block">
                          {content}
                        </Link>
                      )
                    }

                    return <div key={item.id}>{content}</div>
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-500">No hay colaboradores asignados.</p>
              )}
            </div>

            <div className="rounded-3xl border border-[#1e293b] bg-[#0b1220] p-4 sm:p-5">
              <p className="text-xs font-black uppercase tracking-widest text-sky-300">Archivos</p>
              <h5 className="mt-1 text-lg font-black text-white">Documentos del día</h5>
              {documents.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {documents.map((doc) => (
                    <a key={doc.id} href={doc.file_url} target="_blank" className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/20">
                      {doc.file_type?.startsWith('image/') ? '🖼️' : '📄'} {doc.title}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-500">No hay documentos para este día.</p>
              )}
            </div>

            <div className="grid gap-5">
              <div className="rounded-3xl border border-[#1e293b] bg-[#0b1220] p-4 sm:p-5">
                <p className="font-black text-white">🍴 Comidas</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{activeDay.food || 'No registrado'}</p>
              </div>
              <div className="rounded-3xl border border-[#1e293b] bg-[#0b1220] p-4 sm:p-5">
                <p className="font-black text-white">🏨 Alojamiento</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{activeDay.hotel || 'No registrado'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showResume ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 backdrop-blur sm:items-center sm:p-6">
          <div className="mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-[#1e293b] bg-[#0b1220] p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="badge-brand inline-flex">Resumen</p>
                <h4 className="mt-2 text-2xl font-black text-white">Itinerario completo</h4>
              </div>
              <button type="button" onClick={() => setShowResume(false)} className="btn-secondary py-2">Cerrar</button>
            </div>
            <div className="space-y-5">
              {orderedDays.map((day) => {
                const dayStops = [...(day.itinerary_stops || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                return (
                  <div key={day.id} className="rounded-3xl border border-[#1e293b] bg-[#030712] p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Día {day.day_number}</p>
                    <h5 className="mt-1 text-xl font-black text-white">{day.title || `Día ${day.day_number}`}</h5>
                    {day.route ? <p className="mt-1 text-sm font-bold text-slate-400">{day.route}</p> : null}
                    <div className="mt-4 space-y-3">
                      {dayStops.length ? dayStops.map((stop, index) => (
                        <div key={stop.id} className="rounded-2xl border border-[#334155] bg-[#111827] p-4">
                          <p className="font-black text-white">{index + 1}. {stop.place || stop.title || 'Stop'}</p>
                          {stop.duration ? <p className="mt-1 text-xs font-semibold text-slate-500">Parada: {stop.duration}</p> : null}
                          {stop.description ? <p className="mt-2 text-sm leading-6 text-slate-300">{stop.description}</p> : null}
                        </div>
                      )) : <p className="text-sm font-semibold text-slate-500">Sin stops.</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
