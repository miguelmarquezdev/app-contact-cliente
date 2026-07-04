'use client'

import { useState } from 'react'

export type ExistingDayDocument = {
  title: string
  file_url: string
  file_path?: string | null
  file_type?: string | null
}

export type CollaboratorOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  position?: string | null
}

export type StopForm = {
  place: string
  duration: string
  description: string
  includes_ticket: boolean
}

export type DayForm = {
  title: string
  route: string
  food: string
  hotel: string
  description: string
  collaborator_ids: string[]
  existing_documents: ExistingDayDocument[]
  stops: StopForm[]
}

function emptyStop(): StopForm {
  return { place: '', duration: '', description: '', includes_ticket: false }
}

function emptyDay(): DayForm {
  return {
    title: '',
    route: '',
    food: '',
    hotel: '',
    description: '',
    collaborator_ids: [],
    existing_documents: [],
    stops: [emptyStop()],
  }
}

export type ItineraryBuilderData = {
  id?: string
  title?: string | null
  description?: string | null
  days?: DayForm[]
}

export function ItineraryBuilder({
  action,
  initialData,
  collaborators = [],
  submitLabel = 'Guardar itinerario completo',
}: {
  action: (formData: FormData) => void | Promise<void>
  initialData?: ItineraryBuilderData
  collaborators?: CollaboratorOption[]
  submitLabel?: string
}) {
  const [days, setDays] = useState<DayForm[]>(initialData?.days?.length ? initialData.days : [emptyDay()])

  const updateDay = (dayIndex: number, field: keyof Omit<DayForm, 'stops' | 'collaborator_ids' | 'existing_documents'>, value: string) => {
    setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, [field]: value } : day))
  }

  const updateDayCollaborators = (dayIndex: number, values: string[]) => {
    setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, collaborator_ids: values } : day))
  }

  const toggleDayCollaborator = (dayIndex: number, collaboratorId: string) => {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) return day
      const exists = day.collaborator_ids.includes(collaboratorId)
      return {
        ...day,
        collaborator_ids: exists
          ? day.collaborator_ids.filter((id) => id !== collaboratorId)
          : [...day.collaborator_ids, collaboratorId],
      }
    }))
  }

  const addDay = () => setDays((current) => [...current, emptyDay()])

  const removeDay = (dayIndex: number) => {
    setDays((current) => current.length === 1 ? current : current.filter((_, index) => index !== dayIndex))
  }

  const updateStop = (dayIndex: number, stopIndex: number, field: keyof StopForm, value: string | boolean) => {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) return day
      return {
        ...day,
        stops: day.stops.map((stop, sIndex) => sIndex === stopIndex ? { ...stop, [field]: value } : stop),
      }
    }))
  }

  const addStop = (dayIndex: number) => {
    setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, stops: [...day.stops, emptyStop()] } : day))
  }

  const removeStop = (dayIndex: number, stopIndex: number) => {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) return day
      if (day.stops.length === 1) return day
      return { ...day, stops: day.stops.filter((_, sIndex) => sIndex !== stopIndex) }
    }))
  }

  return (
    <form action={action} className="card overflow-hidden">
      {initialData?.id ? <input type="hidden" name="itinerary_id" value={initialData.id} /> : null}
      <div className="border-b border-[#1e293b] p-6">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Constructor completo</p>
        <h2 className="mt-1 text-2xl font-black text-white">Crear itinerario completo</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Crea el nombre del itinerario, agrega días, comida, alojamiento, documentos, colaboradores y stops. Al final guardas todo junto.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">Nombre del itinerario, tour o paquete</label>
            <input name="title" defaultValue={initialData?.title || ''} className="input" placeholder="Ejemplo: Machu Picchu Full Day" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">Descripción general opcional</label>
            <input name="description" defaultValue={initialData?.description || ''} className="input" placeholder="Ejemplo: Itinerario para cliente privado" />
          </div>
        </div>

        <input type="hidden" name="days_json" value={JSON.stringify(days)} />

        <div className="space-y-6">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="rounded-3xl border border-[#1e293b] bg-[#030712] p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Día {dayIndex + 1}</p>
                  <h3 className="text-xl font-black text-white">Información del día</h3>
                </div>
                {days.length > 1 ? (
                  <button type="button" onClick={() => removeDay(dayIndex)} className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-600">
                    Quitar día
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200">Título del día</label>
                  <input value={day.title} onChange={(e) => updateDay(dayIndex, 'title', e.target.value)} className="input" placeholder="Ejemplo: Machu Picchu" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200">Ruta</label>
                  <input value={day.route} onChange={(e) => updateDay(dayIndex, 'route', e.target.value)} className="input" placeholder="Cusco - Ollantaytambo - Aguas Calientes" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200">Comida del día</label>
                  <textarea value={day.food} onChange={(e) => updateDay(dayIndex, 'food', e.target.value)} className="input min-h-24" placeholder="Ejemplo: Desayuno incluido. No incluye almuerzo." />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200">Alojamiento del día</label>
                  <textarea value={day.hotel} onChange={(e) => updateDay(dayIndex, 'hotel', e.target.value)} className="input min-h-24" placeholder="Ejemplo: Hotel en Aguas Calientes / No incluye hotel." />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-200">Descripción del día</label>
                  <textarea value={day.description} onChange={(e) => updateDay(dayIndex, 'description', e.target.value)} className="input min-h-24" placeholder="Describe este día antes de los stops." />
                </div>

                <div className="md:col-span-2">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <label className="block text-sm font-bold text-slate-200">Colaboradores para este día</label>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Toca para seleccionar. Mejor para celular y tablet.</p>
                    </div>
                    {day.collaborator_ids.length ? (
                      <button
                        type="button"
                        onClick={() => updateDayCollaborators(dayIndex, [])}
                        className="w-fit rounded-full border border-slate-700 px-3 py-1.5 text-xs font-black text-slate-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
                      >
                        Limpiar selección
                      </button>
                    ) : null}
                  </div>

                  {collaborators.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {collaborators.map((collaborator) => {
                        const selected = day.collaborator_ids.includes(collaborator.id)
                        const name = collaborator.full_name || collaborator.email || 'Colaborador'
                        const roleLabel = collaborator.role === 'tour_leader' ? 'Tour Leader' : 'Colaborador'
                        const positionLabel = collaborator.position || 'Guía'

                        return (
                          <button
                            key={collaborator.id}
                            type="button"
                            onClick={() => toggleDayCollaborator(dayIndex, collaborator.id)}
                            aria-pressed={selected}
                            className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_0_4px_rgba(16,185,129,.10)]' : 'border-[#334155] bg-[#111827] hover:border-sky-400/60 hover:bg-sky-500/10'}`}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${selected ? 'bg-emerald-400 text-slate-950' : 'bg-[#030712] text-slate-400 group-hover:text-sky-300'}`}>
                              {selected ? '✓' : name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-white">{name}</span>
                              <span className={`${selected ? 'text-emerald-300' : 'text-slate-500 group-hover:text-sky-300'} block text-xs font-bold`}>
                                {positionLabel} · {roleLabel}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#334155] bg-[#111827] p-4 text-sm font-semibold text-slate-500">
                      Primero registra colaboradores o tour leaders para poder asignarlos a este día.
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-200">Documentos necesarios para este día</label>
                  <input
                    type="file"
                    name={`day_documents_${dayIndex}`}
                    multiple
                    accept="application/pdf,image/*"
                    className="block w-full rounded-2xl border border-dashed border-slate-300 bg-[#0b1220] px-4 py-4 text-sm font-semibold text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                  />
                  <p className="mt-2 text-xs font-semibold text-slate-500">Puedes subir PDFs, JPG, PNG o fotos del ticket/documento.</p>
                  {day.existing_documents.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {day.existing_documents.map((doc, index) => (
                        <a key={`${doc.file_url}-${index}`} href={doc.file_url} target="_blank" className="rounded-full bg-[#0b1220] px-3 py-2 text-xs font-bold text-slate-200 ring-1 ring-slate-200">
                          📎 {doc.title}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-black text-white">Stops del Día {dayIndex + 1}</h4>
                  <button type="button" onClick={() => addStop(dayIndex)} className="btn-secondary">
                    + Agregar stop
                  </button>
                </div>

                {day.stops.map((stop, stopIndex) => (
                  <div key={stopIndex} className="rounded-3xl bg-[#0b1220] p-5 shadow-sm ring-1 ring-slate-100">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <p className="font-black text-white">Stop {stopIndex + 1}</p>
                      {day.stops.length > 1 ? (
                        <button type="button" onClick={() => removeStop(dayIndex, stopIndex)} className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600">
                          Quitar stop
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-200">Lugar</label>
                        <input value={stop.place} onChange={(e) => updateStop(dayIndex, stopIndex, 'place', e.target.value)} className="input" placeholder="Ejemplo: Tren a Aguas Calientes" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-200">Duración</label>
                        <input value={stop.duration} onChange={(e) => updateStop(dayIndex, stopIndex, 'duration', e.target.value)} className="input" placeholder="Ejemplo: 1 hora y 30 minutos" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-bold text-slate-200">Descripción</label>
                        <textarea value={stop.description} onChange={(e) => updateStop(dayIndex, stopIndex, 'description', e.target.value)} className="input min-h-24" placeholder="Describe este stop." />
                      </div>
                      <label className="flex items-center gap-3 rounded-2xl border border-[#1e293b] bg-[#030712] px-4 py-3 text-sm font-bold text-slate-200 md:col-span-2">
                        <input checked={stop.includes_ticket} onChange={(e) => updateStop(dayIndex, stopIndex, 'includes_ticket', e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                        Incluye ticket de ingreso
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#1e293b] pt-6 sm:flex-row">
          <button type="button" onClick={addDay} className="btn-secondary sm:w-auto">
            + Agregar otro día
          </button>
          <button className="btn-primary sm:ml-auto sm:w-auto">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
