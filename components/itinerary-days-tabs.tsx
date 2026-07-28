'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FileText, MessageCircle, X } from 'lucide-react'

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
      <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
        Este itinerario todavía no tiene días registrados.
      </div>
    )
  }

  const activeDay = orderedDays.find((day) => day.id === activeDayId) || orderedDays[0]
  const stops = [...(activeDay.itinerary_stops || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  const collaborators = activeDay.itinerary_day_collaborators || []
  const documents = activeDay.itinerary_day_documents || []

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Vista por días</p>
            <h4 className="mt-1 text-lg font-black text-[#14264F]">Selecciona un día</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowResume(true)}
            className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-[#14264F] active:scale-95"
          >
            Resumen
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
                className={`${compact ? 'min-w-[112px]' : 'min-w-[150px]'} rounded-2xl px-3 py-3 text-left transition ${
                  isActive
                    ? 'bg-[#14264F] text-white shadow-sm'
                    : 'bg-slate-100 text-[#14264F]'
                }`}
              >
                <span className={isActive ? 'text-[11px] font-black uppercase tracking-widest text-sky-200' : 'text-[11px] font-black uppercase tracking-widest text-slate-400'}>
                  Día {day.day_number}
                </span>
                <span className="mt-1 block truncate text-sm font-black">{day.title || `Día ${day.day_number}`}</span>
                {!compact && day.route ? <span className={isActive ? 'mt-1 block truncate text-xs font-semibold text-sky-100' : 'mt-1 block truncate text-xs font-semibold text-slate-500'}>{day.route}</span> : null}
              </button>
            )
          })}
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-[#14264F]">Día {activeDay.day_number}</span>
            <h4 className="mt-3 text-[1.35rem] font-black leading-tight text-[#14264F] sm:text-2xl">{activeDay.title || `Día ${activeDay.day_number}`}</h4>
            {activeDay.route ? <p className="mt-1 text-sm font-semibold text-slate-500">Ruta: {activeDay.route}</p> : null}
            {activeDay.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{activeDay.description}</p> : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-lg font-black text-[#14264F]">{stops.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stops</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-lg font-black text-[#14264F]">{documents.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docs</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-lg font-black text-[#14264F]">{collaborators.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipo</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Recorrido</p>
            <h5 className="text-lg font-black text-[#14264F]">Stops del día</h5>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">{stops.length}</span>
        </div>

        <div className="relative space-y-3">
          {stops.length ? stops.map((stop, index) => (
            <div key={stop.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14264F] text-xs font-black text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h6 className="text-base font-black text-[#14264F]">{stop.place || stop.title || `Stop ${index + 1}`}</h6>
                  {stop.includes_ticket ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Entrada incluida</span>
                  ) : null}
                </div>
                {stop.duration ? <p className="mt-1 text-xs font-semibold text-slate-500">Parada: {stop.duration}</p> : null}
                {stop.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{stop.description}</p> : null}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Este día todavía no tiene stops.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Equipo</p>
          <h5 className="mt-1 text-lg font-black text-[#14264F]">Colaboradores</h5>
          {collaborators.length ? (
            <div className="mt-4 space-y-2">
              {collaborators.map((item) => {
                const content = (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 transition active:scale-[.99]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#14264F]">{item.profiles?.full_name || item.profiles?.email || 'Colaborador'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{item.profiles?.position || 'Guía'} · {item.profiles?.role === 'tour_leader' ? 'Tour Leader' : 'Colaborador'}</p>
                    </div>
                    {chatBasePath && item.profiles?.id ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#1E40AF]/10 px-3 py-1 text-[11px] font-black text-[#1E40AF]">
                        <MessageCircle className="h-3 w-3" /> Chat
                      </span>
                    ) : null}
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

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Archivos</p>
          <h5 className="mt-1 text-lg font-black text-[#14264F]">Documentos del día</h5>
          {documents.length ? (
            <div className="mt-4 space-y-2">
              {documents.map((doc) => (
                <a key={doc.id} href={doc.file_url} target="_blank" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-black text-[#14264F]">
                  <FileText className="h-4 w-4 text-[#1E40AF]" />
                  <span className="min-w-0 truncate">{doc.title}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-500">No hay documentos para este día.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="font-black text-[#14264F]">🍴 Comidas</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{activeDay.food || 'No registrado'}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="font-black text-[#14264F]">🏨 Alojamiento</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{activeDay.hotel || 'No registrado'}</p>
        </div>
      </section>

      {showResume ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-[1.35rem] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Resumen</p>
                <h4 className="mt-1 text-2xl font-black text-[#14264F]">Itinerario completo</h4>
              </div>
              <button type="button" onClick={() => setShowResume(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#14264F]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {orderedDays.map((day) => {
                const dayStops = [...(day.itinerary_stops || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                return (
                  <div key={day.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Día {day.day_number}</p>
                    <h5 className="mt-1 text-lg font-black text-[#14264F]">{day.title || `Día ${day.day_number}`}</h5>
                    {day.route ? <p className="mt-1 text-sm font-bold text-slate-500">{day.route}</p> : null}
                    <div className="mt-4 space-y-2">
                      {dayStops.length ? dayStops.map((stop, index) => (
                        <div key={stop.id} className="rounded-2xl bg-white p-3">
                          <p className="text-sm font-black text-[#14264F]">{index + 1}. {stop.place || stop.title || 'Stop'}</p>
                          {stop.duration ? <p className="mt-1 text-xs font-semibold text-slate-500">Parada: {stop.duration}</p> : null}
                          {stop.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{stop.description}</p> : null}
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
