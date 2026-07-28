'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, MessageCircle, Route, XCircle } from 'lucide-react'
import { ItineraryDaysTabs, type ItineraryTabDay } from '@/components/itinerary-days-tabs'

type Assignment = {
  id: string
  note: string | null
  proposal_status?: string | null
  requested_changes?: string | null
  rejection_reason?: string | null
  created_at: string
  version_number?: number | null
  sent_at?: string | null
  responded_at?: string | null
  accepted_at?: string | null
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

type ActionFn = (formData: FormData) => void | Promise<void>

function proposalLabel(status?: string | null) {
  if (status === 'changes_requested') return 'Cambios enviados'
  if (status === 'version_replaced') return 'Versión reemplazada'
  if (status === 'rejected') return 'Rechazado'
  if (status === 'accepted') return 'Aceptado'
  return 'Propuesta recibida'
}

function formatDate(value?: string | null) {
  if (!value) return 'Fecha no registrada'
  try {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return 'Fecha no registrada'
  }
}

function StatusChip({ status }: { status?: string | null }) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black'
  if (status === 'accepted') return <span className={`${base} bg-emerald-50 text-emerald-700`}><CheckCircle2 className="mr-1 h-3 w-3" /> Aceptado</span>
  if (status === 'rejected') return <span className={`${base} bg-red-50 text-red-600`}><XCircle className="mr-1 h-3 w-3" /> Rechazado</span>
  if (status === 'changes_requested') return <span className={`${base} bg-amber-50 text-amber-700`}>Cambios enviados</span>
  if (status === 'version_replaced') return <span className={`${base} bg-slate-100 text-slate-500`}>Reemplazada</span>
  return <span className={`${base} bg-[#14264F] text-white`}>Nueva propuesta</span>
}

export function ClientItinerariesView({ assignments, acceptAction, rejectAction, changesAction }: { assignments: Assignment[]; acceptAction: ActionFn; rejectAction: ActionFn; changesAction: ActionFn }) {
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
      <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#14264F]">
          <CalendarDays className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#14264F]">Todavía no tienes itinerarios</h2>
        <p className="mt-2 text-sm text-slate-500">Cuando la agencia te envíe una propuesta, aparecerá aquí.</p>
      </div>
    )
  }

  if (activeAssignment?.itineraries) {
    const itinerary = activeAssignment.itineraries
    const days = [...(itinerary.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
    const stopCount = countStops(days)
    const documentCount = countDocuments(days)

    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <button type="button" onClick={() => setActiveAssignmentId(null)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#14264F] shadow-sm ring-1 ring-slate-200 active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <section className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#14264F]">Itinerario</span>
              <span className="rounded-full bg-[#1E40AF]/10 px-3 py-1 text-[11px] font-black text-[#1E40AF]">Versión {activeAssignment.version_number || 1}</span>
              <StatusChip status={activeAssignment.proposal_status} />
            </div>

            <h2 className="mt-4 text-[1.7rem] font-black leading-tight text-[#14264F] sm:text-3xl">{itinerary.title}</h2>
            {itinerary.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{itinerary.description}</p> : null}
            <p className="mt-2 text-xs font-semibold text-slate-400">Enviado: {formatDate(activeAssignment.sent_at || activeAssignment.created_at)}</p>

            {activeAssignment.note ? (
              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
                {activeAssignment.note}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-black text-[#14264F]">{days.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Días</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-black text-[#14264F]">{stopCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stops</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-black text-[#14264F]">{documentCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docs</p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-xs font-semibold leading-5 text-[#1E40AF]">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> Toca un colaborador asignado para abrir el chat directo.
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">Respuesta de propuesta</p>
                  <p className="mt-1 text-sm font-bold text-[#14264F]">{proposalLabel(activeAssignment.proposal_status)}</p>
                </div>
                <StatusChip status={activeAssignment.proposal_status} />
              </div>

              {(!activeAssignment.proposal_status || activeAssignment.proposal_status === 'sent') ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <form action={acceptAction} className="rounded-2xl bg-white p-3 shadow-sm">
                    <input type="hidden" name="assignment_id" value={activeAssignment.id} />
                    <select name="payment_method" className="input mb-3" defaultValue="commitment">
                      <option value="commitment">Acepto y pagaré después</option>
                      <option value="cash">Acepto, pago en efectivo</option>
                      <option value="card">Acepto, pago con tarjeta</option>
                    </select>
                    <button className="btn-primary w-full">Aceptar propuesta</button>
                  </form>
                  <form action={changesAction} className="rounded-2xl bg-white p-3 shadow-sm">
                    <input type="hidden" name="assignment_id" value={activeAssignment.id} />
                    <textarea name="message" className="input mb-3 min-h-20" placeholder="¿Qué cambios necesitas?" required />
                    <button className="btn-secondary w-full">Solicitar cambios</button>
                  </form>
                  <form action={rejectAction} className="rounded-2xl bg-white p-3 shadow-sm">
                    <input type="hidden" name="assignment_id" value={activeAssignment.id} />
                    <textarea name="reason" className="input mb-3 min-h-20" placeholder="Motivo si no desea tomar la propuesta" required />
                    <button className="btn-danger w-full">Rechazar</button>
                  </form>
                </div>
              ) : null}

              {activeAssignment.proposal_status === 'changes_requested' ? (
                <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-700">
                  Tu solicitud de cambios ya fue enviada. Cuando exista una nueva versión, aparecerá arriba de tu lista.
                </p>
              ) : null}
              {activeAssignment.proposal_status === 'version_replaced' ? (
                <p className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm font-semibold leading-6 text-slate-600">
                  Esta versión fue reemplazada por una más nueva.
                </p>
              ) : null}
              {activeAssignment.requested_changes ? <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-semibold text-slate-600">Cambios solicitados: {activeAssignment.requested_changes}</p> : null}
              {activeAssignment.rejection_reason ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-600">Motivo: {activeAssignment.rejection_reason}</p> : null}
            </div>
          </div>

          <div className="bg-slate-50 px-3 py-4 sm:px-6 sm:py-6">
            <ItineraryDaysTabs days={days} chatBasePath="/client/chat" compact />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:bg-transparent sm:shadow-none xl:grid-cols-3">
      {visibleAssignments.map((assignment) => {
        const itinerary = assignment.itineraries
        const days = [...(itinerary?.itinerary_days || [])].sort((a, b) => a.day_number - b.day_number)
        const stopCount = countStops(days)
        const documentCount = countDocuments(days)

        return (
          <article key={assignment.id} className="bg-white px-3.5 py-3.5 transition active:bg-slate-50 sm:rounded-2xl sm:p-4 sm:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusChip status={assignment.proposal_status} />
                  <span className="rounded-full bg-[#1E40AF]/8 px-2 py-0.5 text-[10px] font-bold text-[#1E40AF]">V{assignment.version_number || 1}</span>
                </div>

                <h2 className="mt-2 line-clamp-1 text-[1rem] font-extrabold leading-tight text-[#14264F] sm:text-lg">{itinerary?.title || 'Itinerario'}</h2>
                {itinerary?.description ? <p className="mt-1 line-clamp-1 text-[12px] font-medium leading-5 text-slate-500">{itinerary.description}</p> : null}
              </div>

              <button
                type="button"
                onClick={() => setActiveAssignmentId(assignment.id)}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14264F] text-white shadow-sm active:scale-95"
                aria-label="Ver itinerario"
              >
                →
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <CalendarDays className="mx-auto mb-0.5 h-3.5 w-3.5 text-[#1E40AF]" />
                <p className="text-sm font-extrabold leading-none text-[#14264F]">{days.length}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Días</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <Route className="mx-auto mb-0.5 h-3.5 w-3.5 text-[#1E40AF]" />
                <p className="text-sm font-extrabold leading-none text-[#14264F]">{stopCount}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Stops</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <FileText className="mx-auto mb-0.5 h-3.5 w-3.5 text-[#1E40AF]" />
                <p className="text-sm font-extrabold leading-none text-[#14264F]">{documentCount}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Docs</p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[11px] font-semibold text-slate-400">Enviado: {formatDate(assignment.sent_at || assignment.created_at)}</p>
              <button type="button" onClick={() => setActiveAssignmentId(assignment.id)} className="hidden rounded-full bg-[#14264F] px-4 py-2 text-xs font-bold text-white sm:block">
                Ver
              </button>
            </div>

            {assignment.note ? <p className="mt-2 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium leading-5 text-slate-600">Mensaje: {assignment.note}</p> : null}
            {assignment.requested_changes ? <p className="mt-2 line-clamp-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-5 text-amber-700">Tus cambios: {assignment.requested_changes}</p> : null}
            {assignment.proposal_status === 'version_replaced' ? <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-500">Versión reemplazada.</p> : null}
          </article>
        )
      })}
    </div>
  )
}
