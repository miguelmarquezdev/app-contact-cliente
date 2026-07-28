'use client'

import { useMemo, useState } from 'react'
import { Clock, DollarSign, ImageIcon, Plus, Tags, Trash2 } from 'lucide-react'

type StopForm = {
  place: string
  duration: string
  description: string
  includes_ticket: boolean
}

export type TourBuilderData = {
  id?: string
  title?: string | null
  code?: string | null
  route?: string | null
  description?: string | null
  category?: string | null
  price_amount?: number | string | null
  price_currency?: string | null
  duration?: string | null
  image_url?: string | null
  featured?: boolean | null
  default_food_notes?: string | null
  meal_types?: string[] | null
  meal_observations?: Record<string, string> | null
  status?: string | null
  stops?: StopForm[]
}

const mealOptions = ['Desayuno', 'Almuerzo', 'Cena']

const categoryOptions = [
  { value: 'tailor_made', label: 'Tailor made' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'day_tours', label: 'Day tours' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'trekking', label: 'Trekking' }
]

function emptyStop(): StopForm {
  return { place: '', duration: '', description: '', includes_ticket: false }
}

function normalizeStops(stops?: StopForm[]) {
  return stops?.length ? stops.map((stop) => ({ ...emptyStop(), ...stop })) : [emptyStop()]
}

export function TourTemplateBuilder({
  action,
  initialData,
  submitLabel = 'Guardar tour plantilla',
}: {
  action: (formData: FormData) => void | Promise<void>
  initialData?: TourBuilderData
  submitLabel?: string
}) {
  const normalizedStops = useMemo(() => normalizeStops(initialData?.stops), [initialData?.stops])
  const [stops, setStops] = useState<StopForm[]>(normalizedStops)
  const [mealTypes, setMealTypes] = useState<string[]>(initialData?.meal_types || [])
  const [mealObservations, setMealObservations] = useState<Record<string, string>>(initialData?.meal_observations || {})

  const updateStop = (index: number, field: keyof StopForm, value: string | boolean) => {
    setStops((current) => current.map((stop, i) => i === index ? { ...stop, [field]: value } : stop))
  }

  const toggleMeal = (meal: string) => {
    setMealTypes((current) => {
      const exists = current.includes(meal)
      if (exists) return current.filter((item) => item !== meal)
      return [...current, meal]
    })
  }

  const updateMealObservation = (meal: string, value: string) => {
    setMealObservations((current) => ({ ...current, [meal]: value }))
  }

  return (
    <form action={action} className="card overflow-hidden">
      {initialData?.id ? <input type="hidden" name="tour_id" value={initialData.id} /> : null}
      <input type="hidden" name="meal_types_json" value={JSON.stringify(mealTypes)} />
      <input type="hidden" name="meal_observations_json" value={JSON.stringify(mealObservations)} />
      <input type="hidden" name="stops_json" value={JSON.stringify(stops)} />
      <input type="hidden" name="price_currency" value={initialData?.price_currency || 'USD'} />

      <div className="border-b border-slate-200 p-4 sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#1E40AF]">Servicio / catálogo</p>
        <h2 className="mt-1 text-xl font-black text-[#14264F] sm:text-2xl">{initialData?.id ? 'Editar tour' : 'Crear tour'}</h2>
        <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">Estos datos alimentan el catálogo del prospecto y también autollenan días del itinerario.</p>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
        <input name="title" defaultValue={initialData?.title || ''} className="input" placeholder="Nombre del tour: Machu Picchu Full Day" required />
        <input name="code" defaultValue={initialData?.code || ''} className="input" placeholder="Código interno opcional" />

        <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
          <label className="group block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500"><Tags className="h-3.5 w-3.5 text-[#1E40AF]" /> Categoría</span>
            <select name="category" defaultValue={initialData?.category || 'day_tours'} className="input">
              {categoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <label className="group block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500"><DollarSign className="h-3.5 w-3.5 text-[#1E40AF]" /> Precio desde</span>
            <input name="price_amount" defaultValue={initialData?.price_amount || ''} className="input" placeholder="350" inputMode="decimal" />
          </label>
          <label className="group block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500"><Clock className="h-3.5 w-3.5 text-[#1E40AF]" /> Duración</span>
            <input name="duration" defaultValue={initialData?.duration || ''} className="input" placeholder="Full day / 5 días" />
          </label>
        </div>

        <div className="md:col-span-2 grid gap-3 md:grid-cols-[1fr_120px]">
          <div className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500"><ImageIcon className="h-3.5 w-3.5 text-[#1E40AF]" /> Imagen del tour</span>
            <input type="hidden" name="existing_image_url" value={initialData?.image_url || ''} />
            <label className="flex min-h-[92px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition hover:border-[#1E40AF]/50 hover:bg-white">
              <input name="tour_image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" />
              <ImageIcon className="h-6 w-6 text-[#1E40AF]" />
              <span className="text-sm font-black text-[#14264F]">Subir imagen desde tu equipo</span>
              <span className="text-[11px] font-semibold text-slate-500">JPG, PNG o WEBP · máximo 8 MB</span>
            </label>
            {initialData?.image_url ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                <img src={initialData.image_url} alt="Imagen actual del tour" className="h-14 w-20 rounded-lg object-cover" />
                <p className="text-xs font-semibold text-slate-500">Imagen actual. Si subes otra, se reemplaza al guardar.</p>
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600 md:mt-6">
            <input type="checkbox" name="featured" defaultChecked={Boolean(initialData?.featured)} className="h-4 w-4" />
            Destacado
          </label>
        </div>

        <input name="route" defaultValue={initialData?.route || ''} className="input md:col-span-2" placeholder="Ruta: Cusco - Ollantaytambo - Aguas Calientes - Machu Picchu" />
        <textarea name="description" defaultValue={initialData?.description || ''} className="input min-h-24 md:col-span-2" placeholder="Descripción del tour. Se verá en catálogo y se llenará en la descripción del día si seleccionas este tour." />

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#14264F]">Comidas incluidas</h3>
              <p className="text-xs font-semibold text-slate-500">Selecciona una o varias. Sus observaciones se jalarán al itinerario.</p>
            </div>
            {mealTypes.length ? (
              <button type="button" onClick={() => setMealTypes([])} className="w-fit rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-500">Limpiar</button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {mealOptions.map((meal) => {
              const selected = mealTypes.includes(meal)
              return (
                <button key={meal} type="button" onClick={() => toggleMeal(meal)} aria-pressed={selected} className={`rounded-xl border p-3 text-left transition ${selected ? 'border-[#0EA5E9] bg-[#14264F]/10 text-[#0EA5E9]' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#14264F]/20'}`}>
                  <span className="block text-sm font-black">{selected ? '✓ ' : ''}{meal}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Tocar para {selected ? 'quitar' : 'agregar'}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {mealOptions.map((meal) => (
              <div key={meal} className={`${mealTypes.includes(meal) ? 'block' : 'hidden md:block opacity-50'}`}>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Observación {meal}</label>
                <textarea
                  value={mealObservations[meal] || ''}
                  onChange={(e) => updateMealObservation(meal, e.target.value)}
                  className="input min-h-20"
                  placeholder={`Ejemplo: ${meal} buffet incluido / no incluye bebida`}
                />
              </div>
            ))}
          </div>
        </div>

        <input type="hidden" name="status" value={initialData?.status || 'confirmed'} />

        <div className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#14264F]">Stops del tour</h3>
              <p className="text-xs font-semibold text-slate-500">Cuando elijas este tour en el itinerario, estos stops se cargarán solos.</p>
            </div>
            <button type="button" onClick={() => setStops((current) => [...current, emptyStop()])} className="btn-secondary py-2 text-xs">
              <Plus className="mr-1 inline h-4 w-4" /> Stop
            </button>
          </div>

          <div className="space-y-3">
            {stops.map((stop, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Stop {index + 1}</p>
                  {stops.length > 1 ? (
                    <button type="button" onClick={() => setStops((current) => current.filter((_, i) => i !== index))} className="text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={stop.place} onChange={(e) => updateStop(index, 'place', e.target.value)} className="input" placeholder="Lugar / parada" />
                  <input value={stop.duration} onChange={(e) => updateStop(index, 'duration', e.target.value)} className="input" placeholder="Duración" />
                  <textarea value={stop.description} onChange={(e) => updateStop(index, 'description', e.target.value)} className="input min-h-20 md:col-span-2" placeholder="Descripción del stop" />
                  <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-600 md:col-span-2">
                    <input type="checkbox" checked={stop.includes_ticket} onChange={(e) => updateStop(index, 'includes_ticket', e.target.checked)} />
                    Incluye ticket de ingreso
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary md:col-span-2">{submitLabel}</button>
      </div>
    </form>
  )
}
