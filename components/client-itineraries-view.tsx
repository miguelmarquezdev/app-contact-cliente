'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, FileText, MessageCircle, Route } from 'lucide-react'
import { ItineraryDaysTabs, type ItineraryTabDay } from '@/components/itinerary-days-tabs'

type Assignment = {
  id: string
  note: string | null
  created_at: string
  itineraries: {
    id: string
    title: string
    description: string | null
    itinerary_days: ItineraryTabDay[] | null
  } | null
}

function countStops(days: ItineraryTabDay[]) {
  return days.reduce((sum, day) => sum + (day.itinerary_stops?.length || 0), 0)
}

function countDocuments(days: ItineraryTabDay[]) {
  return days.reduce((sum, day) => sum + (day.itinerary_day_documents?.length || 0), 0)
}

export function ClientItinerariesView({ assignments }: { assignments: Assignment[] }) {
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null)
  const [savedAssignments, setSavedAssignments] = useState<Assignment[]>(assignments)

  useEffect(() => {
    if (assignments.length) {
      setSavedAssignments(assignments)
      localStorage.setItem('happy-manager-client-itineraries', JSON.stringify(assignments))
      return
    }

    const cached = localStorage.getItem('happy-manager-client-itineraries')
    if (cached) {
      try {
        setSavedAssignments(JSON.parse(cached))
      } catch {
        setSavedAssignments(assignments)
      }
    }
  }, [assignments])

  const visibleAssignments = savedAssignments.length ? savedAssignments : assignments

  const activeAssignment = useMemo(() => {
    if (!activeAssignmentId) return null
    return visibleAssignments.find((item) => item.id === activeAssignmentId) || null
  }, [visibleAssignments, activeAssignmentId])

  if (!visibleAssignments.length) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
          <CalendarDays className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-black text-white">Todavía no tienes itinerarios asignados</h2>
        <p className="mt-2 text-sm text-slate-500">Cuando la agencia te envíe un itinerario, aparecerá en esta sección.</p>
      </div>
    )
  }

  if (activeAssignment?.itineraries) {
    const itinerary = activeAssignment.itineraries
    const days = [...(itinerary.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
    const stopCount = countStops(days)
    const documentCount = countDocuments(days)

    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setActiveAssignmentId(null)} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a mis itinerarios
        </button>

        <div className="card overflow-hidden">
          <div className="border-b border-[#1e293b] bg-gradient-to-br from-emerald-500/10 via-[#0b1220] to-sky-500/10 p-5 sm:p-6">
            <p className="badge-brand inline-flex">Itinerario recibido</p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{itinerary.title}</h2>
            {itinerary.description ? <p className="mt-2 text-sm leading-6 text-slate-300">{itinerary.description}</p> : null}
            {activeAssignment.note ? (
              <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200">
                Nota: {activeAssignment.note}
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]"><p className="text-xl font-black text-white">{days.length}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Días</p></div>
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]"><p className="text-xl font-black text-white">{stopCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stops</p></div>
              <div className="rounded-2xl bg-[#030712]/70 p-3 ring-1 ring-[#1e293b]"><p className="text-xl font-black text-white">{documentCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Docs</p></div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs font-semibold leading-5 text-sky-200 sm:text-sm">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> Toca un colaborador asignado para abrir el chat directo.
            </div>
          </div>

          <div className="p-3 sm:p-6">
            <ItineraryDaysTabs days={days} chatBasePath="/client/chat" compact />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visibleAssignments.map((assignment) => {
        const itinerary = assignment.itineraries
        const days = [...(itinerary?.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
        const stopCount = countStops(days)
        const documentCount = countDocuments(days)

        return (
          <article key={assignment.id} className="card overflow-hidden transition hover:border-emerald-500/35">
            <div className="p-5">
              <p className="badge-brand inline-flex">Recibido</p>
              <h2 className="mt-3 line-clamp-2 text-xl font-black text-white">{itinerary?.title || 'Itinerario'}</h2>
              {itinerary?.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{itinerary.description}</p> : null}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-[#030712] p-3 ring-1 ring-[#1e293b]"><CalendarDays className="mx-auto mb-1 h-4 w-4 text-emerald-300" /><p className="font-black text-white">{days.length}</p><p className="text-[10px] font-bold uppercase text-slate-500">Días</p></div>
                <div className="rounded-2xl bg-[#030712] p-3 ring-1 ring-[#1e293b]"><Route className="mx-auto mb-1 h-4 w-4 text-sky-300" /><p className="font-black text-white">{stopCount}</p><p className="text-[10px] font-bold uppercase text-slate-500">Stops</p></div>
                <div className="rounded-2xl bg-[#030712] p-3 ring-1 ring-[#1e293b]"><FileText className="mx-auto mb-1 h-4 w-4 text-emerald-300" /><p className="font-black text-white">{documentCount}</p><p className="text-[10px] font-bold uppercase text-slate-500">Docs</p></div>
              </div>
              {assignment.note ? <p className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-200">{assignment.note}</p> : null}
              <button type="button" onClick={() => setActiveAssignmentId(assignment.id)} className="btn-primary mt-5 w-full">
                Ver itinerario
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
