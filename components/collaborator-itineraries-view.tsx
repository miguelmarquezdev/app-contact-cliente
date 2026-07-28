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
      <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#14264F]">
          <CalendarDays className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#14264F]">Todavía no tienes días asignados</h2>
        <p className="mt-2 text-sm text-slate-500">Cuando el administrador te asigne a un día del itinerario, aparecerá aquí.</p>
      </div>
    )
  }

  if (activeItinerary) {
    const days = [...activeItinerary.days].sort((a, b) => a.day_number - b.day_number)
    const stopCount = countStops(days)
    const documentCount = countDocuments(days)

    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <button type="button" onClick={() => setActiveId(null)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#14264F] shadow-sm ring-1 ring-slate-200 active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <section className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm">
          <div className="p-5 sm:p-7">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#14264F]">Asignación</span>
            <h2 className="mt-4 text-[1.7rem] font-black leading-tight text-[#14264F] sm:text-3xl">{activeItinerary.title}</h2>
            {activeItinerary.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{activeItinerary.description}</p> : null}

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-xl font-black text-[#14264F]">{days.length}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Días</p></div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-xl font-black text-[#14264F]">{stopCount}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stops</p></div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-xl font-black text-[#14264F]">{documentCount}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docs</p></div>
            </div>
          </div>

          <div className="bg-slate-50 px-3 py-4 sm:px-6 sm:py-6">
            <ItineraryDaysTabs days={days} compact />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visibleItineraries.map((itinerary) => {
        const days = [...itinerary.days].sort((a, b) => a.day_number - b.day_number)
        const stopCount = countStops(days)
        const documentCount = countDocuments(days)
        return (
          <article key={itinerary.id} className="rounded-2xl bg-white p-4 shadow-sm transition active:scale-[.99]">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#14264F]">Mi asignación</span>
            <h2 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-[#14264F]">{itinerary.title}</h2>
            {itinerary.description ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{itinerary.description}</p> : null}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-slate-50 p-3"><CalendarDays className="mx-auto mb-1 h-4 w-4 text-[#1E40AF]" /><p className="font-black text-[#14264F]">{days.length}</p><p className="text-[10px] font-bold uppercase text-slate-400">Días</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><Route className="mx-auto mb-1 h-4 w-4 text-[#1E40AF]" /><p className="font-black text-[#14264F]">{stopCount}</p><p className="text-[10px] font-bold uppercase text-slate-400">Stops</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><FileText className="mx-auto mb-1 h-4 w-4 text-[#1E40AF]" /><p className="font-black text-[#14264F]">{documentCount}</p><p className="text-[10px] font-bold uppercase text-slate-400">Docs</p></div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-sky-50 p-3 text-xs font-bold text-[#1E40AF]">
              <Users className="h-4 w-4" /> Solo verás los días donde fuiste asignado.
            </div>
            <button type="button" onClick={() => setActiveId(itinerary.id)} className="btn-primary mt-5 w-full">
              Ver mis días
            </button>
          </article>
        )
      })}
    </div>
  )
}
