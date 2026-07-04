'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, FileText, Route, Users } from 'lucide-react'
import { ItineraryDaysTabs, type ItineraryTabDay } from '@/components/itinerary-days-tabs'

type CollaboratorItinerary = {
  id: string
  title: string
  description: string | null
  days: ItineraryTabDay[]
}

function countStops(days: ItineraryTabDay[]) {
  return days.reduce((sum, day) => sum + (day.itinerary_stops?.length || 0), 0)
}

function countDocuments(days: ItineraryTabDay[]) {
  return days.reduce((sum, day) => sum + (day.itinerary_day_documents?.length || 0), 0)
}

export function CollaboratorItinerariesView({ itineraries }: { itineraries: CollaboratorItinerary[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [savedItineraries, setSavedItineraries] = useState<CollaboratorItinerary[]>(itineraries)

  useEffect(() => {
    if (itineraries.length) {
      setSavedItineraries(itineraries)
      localStorage.setItem('happy-manager-collaborator-itineraries', JSON.stringify(itineraries))
      return
    }

    const cached = localStorage.getItem('happy-manager-collaborator-itineraries')
    if (cached) {
      try {
        setSavedItineraries(JSON.parse(cached))
      } catch {
        setSavedItineraries(itineraries)
      }
    }
  }, [itineraries])

  const visibleItineraries = savedItineraries.length ? savedItineraries : itineraries

  const activeItinerary = useMemo(() => {
    if (!activeId) return null
    return visibleItineraries.find((item) => item.id === activeId) || null
  }, [activeId, visibleItineraries])

  if (!visibleItineraries.length) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
          <CalendarDays className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-black text-white">Todavía no tienes días asignados</h2>
        <p className="mt-2 text-sm text-slate-500">Cuando el administrador te asigne a un día del itinerario, aparecerá aquí.</p>
      </div>
    )
  }

  if (activeItinerary) {
    const days = [...activeItinerary.days].sort((a, b) => a.day_number - b.day_number)
    const stopCount = countStops(days)
    const documentCount = countDocuments(days)

    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setActiveId(null)} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a mis asignaciones
        </button>

        <div className="card overflow-hidden">
          <div className="border-b border-[#1e293b] bg-gradient-to-br from-emerald-500/10 via-[#0b1220] to-sky-500/10 p-5 sm:p-6">
            <p className="badge-brand inline-flex">Asignación de equipo</p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{activeItinerary.title}</h2>
            {activeItinerary.description ? <p className="mt-2 text-sm leading-6 text-slate-300">{activeItinerary.description}</p> : null}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]"><p className="text-xl font-black text-white">{days.length}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Días</p></div>
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]"><p className="text-xl font-black text-white">{stopCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stops</p></div>
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]"><p className="text-xl font-black text-white">{documentCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Docs</p></div>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            <ItineraryDaysTabs days={days} compact />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visibleItineraries.map((itinerary) => {
        const days = [...itinerary.days].sort((a, b) => a.day_number - b.day_number)
        const stopCount = countStops(days)
        const documentCount = countDocuments(days)
        return (
          <article key={itinerary.id} className="card overflow-hidden transition hover:border-emerald-500/35">
            <div className="p-5">
              <p className="badge-brand inline-flex">Mi asignación</p>
              <h2 className="mt-3 line-clamp-2 text-xl font-black text-white">{itinerary.title}</h2>
              {itinerary.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{itinerary.description}</p> : null}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-[#030712] p-3 ring-1 ring-[#1e293b]"><CalendarDays className="mx-auto mb-1 h-4 w-4 text-emerald-300" /><p className="font-black text-white">{days.length}</p><p className="text-[10px] font-bold uppercase text-slate-500">Días</p></div>
                <div className="rounded-2xl bg-[#030712] p-3 ring-1 ring-[#1e293b]"><Route className="mx-auto mb-1 h-4 w-4 text-sky-300" /><p className="font-black text-white">{stopCount}</p><p className="text-[10px] font-bold uppercase text-slate-500">Stops</p></div>
                <div className="rounded-2xl bg-[#030712] p-3 ring-1 ring-[#1e293b]"><FileText className="mx-auto mb-1 h-4 w-4 text-emerald-300" /><p className="font-black text-white">{documentCount}</p><p className="text-[10px] font-bold uppercase text-slate-500">Docs</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs font-bold text-sky-200">
                <Users className="h-4 w-4" /> Solo verás los días donde fuiste asignado.
              </div>
              <button type="button" onClick={() => setActiveId(itinerary.id)} className="btn-primary mt-5 w-full">
                Ver mis días
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
