'use client'

import { useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react'

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

export type TourTemplateStop = {
  id?: string
  place: string
  duration?: string | null
  description?: string | null
  includes_ticket?: boolean | null
  order_index?: number | null
}

export type TourTemplateOption = {
  id: string
  title: string
  route?: string | null
  description?: string | null
  default_food_notes?: string | null
  meal_types?: string[] | null
  meal_observations?: Record<string, string> | null
  category?: string | null
  price_amount?: number | null
  price_currency?: string | null
  duration?: string | null
  image_url?: string | null
  featured?: boolean | null
  tour_template_stops?: TourTemplateStop[] | null
}

export type HotelOption = {
  id: string
  name: string
  location?: string | null
  description?: string | null
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
  tour_template_id?: string
  food: string
  food_type?: string
  food_description?: string
  hotel: string
  hotel_id?: string
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
    tour_template_id: '',
    food: '',
    food_type: '',
    food_description: '',
    hotel: '',
    hotel_id: '',
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
  image_url?: string | null
  days?: DayForm[]
}

const foodTypes = ['Desayuno', 'Almuerzo', 'Cena']

function SaveItineraryButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button className="btn-primary min-w-[190px]" disabled={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span>
      ) : label}
    </button>
  )
}

export function ItineraryBuilder({
  action,
  initialData,
  collaborators = [],
  tourTemplates = [],
  hotels = [],
  submitLabel = 'Guardar itinerario completo',
  hiddenFields = {},
  simpleCreate = false,
}: {
  action: (formData: FormData) => void | Promise<void>
  initialData?: ItineraryBuilderData
  collaborators?: CollaboratorOption[]
  tourTemplates?: TourTemplateOption[]
  hotels?: HotelOption[]
  submitLabel?: string
  hiddenFields?: Record<string, string>
  simpleCreate?: boolean
}) {
  const normalizedInitialDays = useMemo(() => {
    const source = initialData?.days?.length ? initialData.days : [emptyDay()]
    return source.map((day) => ({
      ...emptyDay(),
      ...day,
      food_type: day.food_type || '',
      food_description: day.food_description || day.food || '',
      hotel_id: day.hotel_id || '',
      tour_template_id: day.tour_template_id || '',
    }))
  }, [initialData?.days])

  const [days, setDays] = useState<DayForm[]>(normalizedInitialDays)
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || '')

  const updateDay = (dayIndex: number, field: keyof Omit<DayForm, 'stops' | 'collaborator_ids' | 'existing_documents'>, value: string) => {
    setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, [field]: value } : day))
  }

  const selectTourForDay = (dayIndex: number, tourId: string) => {
    const selectedTour = tourTemplates.find((tour) => tour.id === tourId)
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) return day
      if (!selectedTour) {
        return { ...day, tour_template_id: '', route: '', title: '', description: '', stops: day.stops.length ? day.stops : [emptyStop()] }
      }
      const stops = [...(selectedTour.tour_template_stops || [])]
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((stop) => ({
          place: stop.place || '',
          duration: stop.duration || '',
          description: stop.description || '',
          includes_ticket: Boolean(stop.includes_ticket),
        }))

      const mealTypes = selectedTour.meal_types || []
      const mealObservations = selectedTour.meal_observations || {}
      const foodDescription = mealTypes.length
        ? mealTypes.map((meal) => {
            const note = mealObservations[meal]
            return note ? `${meal}: ${note}` : meal
          }).join(' | ')
        : selectedTour.default_food_notes || ''

      return {
        ...day,
        tour_template_id: selectedTour.id,
        title: day.title || selectedTour.title,
        route: selectedTour.route || selectedTour.title,
        description: selectedTour.description || day.description,
        food_type: mealTypes.join(', '),
        food_description: foodDescription,
        stops: stops.length ? stops : day.stops,
      }
    }))
  }

  const selectHotelForDay = (dayIndex: number, hotelId: string) => {
    const selectedHotel = hotels.find((hotel) => hotel.id === hotelId)
    setDays((current) => current.map((day, index) => index === dayIndex ? {
      ...day,
      hotel_id: hotelId,
      hotel: selectedHotel ? [selectedHotel.name, selectedHotel.location].filter(Boolean).join(' - ') : '',
    } : day))
  }

  const updateDayCollaborators = (dayIndex: number, values: string[]) => {
    setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, collaborator_ids: values } : day))
  }

  const toggleDayCollaborator = (dayIndex: number, collaboratorId: string) => {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) return day
      const exists = day.collaborator_ids.includes(collaboratorId)
      return { ...day, collaborator_ids: exists ? day.collaborator_ids.filter((id) => id !== collaboratorId) : [...day.collaborator_ids, collaboratorId] }
    }))
  }

  const addDay = () => setDays((current) => [...current, emptyDay()])
  const removeDay = (dayIndex: number) => setDays((current) => current.length === 1 ? current : current.filter((_, index) => index !== dayIndex))

  const updateStop = (dayIndex: number, stopIndex: number, field: keyof StopForm, value: string | boolean) => {
    setDays((current) => current.map((day, index) => index === dayIndex ? {
      ...day,
      stops: day.stops.map((stop, sIndex) => sIndex === stopIndex ? { ...stop, [field]: value } : stop),
    } : day))
  }

  const addStop = (dayIndex: number) => setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, stops: [...day.stops, emptyStop()] } : day))
  const removeStop = (dayIndex: number, stopIndex: number) => setDays((current) => current.map((day, index) => index === dayIndex ? { ...day, stops: day.stops.length === 1 ? day.stops : day.stops.filter((_, sIndex) => sIndex !== stopIndex) } : day))

  return (
    <form action={action} className="card overflow-hidden">
      {initialData?.id ? <input type="hidden" name="itinerary_id" value={initialData.id} /> : null}
      {Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-widest text-[#0EA5E9]">{simpleCreate ? "Creación rápida" : "Constructor completo"}</p>
        <h2 className="mt-1 text-2xl font-black text-[#14264F]">{simpleCreate ? "Crear itinerario base" : "Crear itinerario completo"}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">{simpleCreate ? 'Crea la estructura base del itinerario. Luego podrás editarlo para agregar documentos y equipo operativo.' : 'Selecciona tours base para autollenar ruta, descripción y stops; luego ajusta comida, hotel, documentos y equipo por día.'}</p>
        {simpleCreate ? (
          <div className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-xs font-bold leading-5 text-[#1E40AF]">
            Colaboradores, documentos y equipo se agregan después desde Editar, no durante la creación inicial.
          </div>
        ) : null}
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview itinerario" className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <input type="hidden" name="existing_image_url" value={initialData?.image_url || ''} />
            <label className="mt-3 block cursor-pointer rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-[#14264F] shadow-sm ring-1 ring-slate-100">
              Subir imagen
              <input
                name="itinerary_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) setImagePreview(URL.createObjectURL(file))
                }}
              />
            </label>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">JPG, PNG o WebP. Se verá en la lista de itinerarios.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Nombre del itinerario o paquete</label>
              <input name="title" defaultValue={initialData?.title || ''} className="input" placeholder="Ejemplo: Paquete Cusco 5 días" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Descripción general opcional</label>
              <input name="description" defaultValue={initialData?.description || ''} className="input" placeholder="Ejemplo: Itinerario para cliente privado" />
            </div>
          </div>
        </div>

        <input type="hidden" name="days_json" value={JSON.stringify(days)} />

        <div className="space-y-6">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#0EA5E9]">Día {dayIndex + 1}</p>
                  <h3 className="text-xl font-black text-[#14264F]">Información del día</h3>
                </div>
                {days.length > 1 ? <button type="button" onClick={() => removeDay(dayIndex)} className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">Quitar día</button> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Ruta o tour</label>
                  <select value={day.tour_template_id || ''} onChange={(e) => selectTourForDay(dayIndex, e.target.value)} className="input">
                    <option value="">Manual / sin tour base</option>
                    {tourTemplates.map((tour) => <option key={tour.id} value={tour.id}>{tour.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Título del día</label>
                  <input value={day.title} onChange={(e) => updateDay(dayIndex, 'title', e.target.value)} className="input" placeholder="Ejemplo: Machu Picchu" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Ruta del día</label>
                  <input value={day.route} onChange={(e) => updateDay(dayIndex, 'route', e.target.value)} className="input" placeholder="Cusco - Ollantaytambo - Aguas Calientes" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Comida</label>
                  <select value={day.food_type || ''} onChange={(e) => updateDay(dayIndex, 'food_type', e.target.value)} className="input">
                    <option value="">Sin comida seleccionada</option>
                    {foodTypes.map((food) => <option key={food} value={food}>{food}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Detalle de la comida</label>
                  <input value={day.food_description || ''} onChange={(e) => updateDay(dayIndex, 'food_description', e.target.value)} className="input" placeholder="Ejemplo: Desayuno en el hotel / almuerzo buffet incluido" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Hotel / alojamiento</label>
                  <select value={day.hotel_id || ''} onChange={(e) => selectHotelForDay(dayIndex, e.target.value)} className="input">
                    <option value="">Sin hotel / manual</option>
                    {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}{hotel.location ? ` — ${hotel.location}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Detalle alojamiento</label>
                  <input value={day.hotel} onChange={(e) => updateDay(dayIndex, 'hotel', e.target.value)} className="input" placeholder="Ejemplo: Hotel en Aguas Calientes / No incluye hotel" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Descripción del día</label>
                  <textarea value={day.description} onChange={(e) => updateDay(dayIndex, 'description', e.target.value)} className="input min-h-24" placeholder="Si seleccionas un tour base, aquí se jala su descripción. También puedes editarla." />
                </div>

{!simpleCreate ? (
              <>
                <div className="md:col-span-2">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Colaboradores para este día</label>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Toca para seleccionar. Mejor para celular y tablet.</p>
                    </div>
                    {day.collaborator_ids.length ? <button type="button" onClick={() => updateDayCollaborators(dayIndex, [])} className="w-fit rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-500">Limpiar selección</button> : null}
                  </div>

                  {collaborators.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {collaborators.map((collaborator) => {
                        const selected = day.collaborator_ids.includes(collaborator.id)
                        const name = collaborator.full_name || collaborator.email || 'Colaborador'
                        const roleLabel = collaborator.role === 'tour_leader' ? 'Tour Leader' : 'Colaborador'
                        const positionLabel = collaborator.position || 'Guía'
                        return (
                          <button key={collaborator.id} type="button" onClick={() => toggleDayCollaborator(dayIndex, collaborator.id)} aria-pressed={selected} className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-[#0EA5E9] bg-[#14264F]/10' : 'border-slate-200 bg-slate-50 hover:border-[#0EA5E9]/30'}`}>
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${selected ? 'bg-[#0EA5E9] text-slate-950' : 'bg-white text-slate-500'}`}>{selected ? '✓' : name.slice(0, 1).toUpperCase()}</span>
                            <span className="min-w-0"><span className="block truncate text-sm font-black text-[#14264F]">{name}</span><span className="block text-xs font-bold text-slate-500">{positionLabel} · {roleLabel}</span></span>
                          </button>
                        )
                      })}
                    </div>
                  ) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">Primero registra colaboradores o tour leaders.</div>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Documentos necesarios para este día</label>
                  <input type="file" name={`day_documents_${dayIndex}`} multiple accept="application/pdf,image/png,image/jpeg,image/webp" className="block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-semibold text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">Formatos permitidos: PDF, JPG, PNG o WEBP. Máximo recomendado: 10 MB por archivo.</p>
                  {day.existing_documents.length ? <div className="mt-3 flex flex-wrap gap-2">{day.existing_documents.map((doc, index) => <a key={`${doc.file_url}-${index}`} href={doc.file_url} target="_blank" className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">📎 {doc.title}</a>)}</div> : null}
                </div>

              </>
              ) : null}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-black text-[#14264F]">Stops del Día {dayIndex + 1}</h4>
                  <button type="button" onClick={() => addStop(dayIndex)} className="btn-secondary py-2 text-xs"><Plus className="mr-1 inline h-4 w-4" /> Agregar stop</button>
                </div>
                <div className="space-y-4">
                  {day.stops.map((stop, stopIndex) => (
                    <div key={stopIndex} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Stop {stopIndex + 1}</p>
                        {day.stops.length > 1 ? <button type="button" onClick={() => removeStop(dayIndex, stopIndex)} className="text-red-300"><Trash2 className="h-4 w-4" /></button> : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={stop.place} onChange={(e) => updateStop(dayIndex, stopIndex, 'place', e.target.value)} className="input" placeholder="Lugar" />
                        <input value={stop.duration} onChange={(e) => updateStop(dayIndex, stopIndex, 'duration', e.target.value)} className="input" placeholder="Duración" />
                        <textarea value={stop.description} onChange={(e) => updateStop(dayIndex, stopIndex, 'description', e.target.value)} className="input min-h-20 md:col-span-2" placeholder="Descripción" />
                        <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm font-bold text-slate-600 md:col-span-2"><input type="checkbox" checked={stop.includes_ticket} onChange={(e) => updateStop(dayIndex, stopIndex, 'includes_ticket', e.target.checked)} /> Incluye ticket de ingreso</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={addDay} className="btn-secondary"><Plus className="mr-2 inline h-4 w-4" /> Agregar otro día</button>
          <SaveItineraryButton label={submitLabel} />
        </div>
      </div>
    </form>
  )
}
