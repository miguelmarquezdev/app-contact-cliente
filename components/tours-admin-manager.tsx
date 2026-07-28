'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, ImageIcon, MapPinned, Pencil, Plus, Route, Search, Trash2, Utensils } from 'lucide-react'
import { TourTemplateBuilder, type TourBuilderData } from '@/components/tour-template-builder'

type TourStop = {
  id: string
  place: string
  duration: string | null
  description: string | null
  includes_ticket: boolean | null
  order_index: number | null
}

type TourTemplate = {
  id: string
  title: string
  code: string | null
  route: string | null
  description: string | null
  category?: string | null
  price_amount?: number | null
  price_currency?: string | null
  duration?: string | null
  image_url?: string | null
  featured?: boolean | null
  default_food_notes: string | null
  meal_types?: string[] | null
  meal_observations?: Record<string, string> | null
  status: string | null
  created_at?: string | null
  tour_template_stops: TourStop[] | null
}

type ActionFn = (formData: FormData) => void | Promise<void>

type Mode =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'detail'; tourId: string }
  | { type: 'edit'; tourId: string }

function formatStops(tour: TourTemplate) {
  return [...(tour.tour_template_stops || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
}


function categoryLabel(value?: string | null) {
  const map: Record<string, string> = {
    tailor_made: 'Tailor made',
    luxury: 'Luxury',
    adventure: 'Adventure',
    day_tours: 'Day tours',
    cultural: 'Cultural',
    trekking: 'Trekking'
  }
  return map[value || ''] || value || 'Sin categoría'
}

function formatPrice(tour: TourTemplate) {
  if (tour.price_amount === null || tour.price_amount === undefined) return 'Consultar'
  return `Desde ${tour.price_currency || 'USD'} ${Number(tour.price_amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function tourToBuilderData(tour: TourTemplate): TourBuilderData {
  return {
    id: tour.id,
    title: tour.title,
    code: tour.code,
    route: tour.route,
    description: tour.description,
    category: tour.category || 'day_tours',
    price_amount: tour.price_amount ?? '',
    price_currency: tour.price_currency || 'USD',
    duration: tour.duration || '',
    image_url: tour.image_url || '',
    featured: Boolean(tour.featured),
    default_food_notes: tour.default_food_notes,
    meal_types: tour.meal_types || [],
    meal_observations: tour.meal_observations || {},
    status: tour.status || 'confirmed',
    stops: formatStops(tour).map((stop) => ({
      place: stop.place || '',
      duration: stop.duration || '',
      description: stop.description || '',
      includes_ticket: Boolean(stop.includes_ticket),
    })),
  }
}

function DeleteTourButton({ tour, action }: { tour: TourTemplate; action: ActionFn }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm('¿Seguro que deseas eliminar este tour base?')) event.preventDefault()
      }}
    >
      <input type="hidden" name="tour_id" value={tour.id} />
      <button className="btn-danger w-full py-2.5 sm:w-auto" title="Eliminar tour">
        <Trash2 className="mr-2 inline h-4 w-4" /> Eliminar
      </button>
    </form>
  )
}

function MealBadges({ mealTypes = [] }: { mealTypes?: string[] | null }) {
  if (!mealTypes?.length) return <span className="text-xs font-semibold text-slate-500">Sin comidas</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {mealTypes.map((meal) => (
        <span key={meal} className="rounded-full bg-[#14264F]/10 px-2.5 py-1 text-[11px] font-black text-[#0EA5E9] ring-1 ring-emerald-500/20">{meal}</span>
      ))}
    </div>
  )
}

export function ToursAdminManager({
  tours,
  createAction,
  updateAction,
  deleteAction,
}: {
  tours: TourTemplate[]
  createAction: ActionFn
  updateAction: ActionFn
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

  const filteredTours = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return tours
    return tours.filter((tour) => [
      tour.title,
      tour.code,
      tour.route,
      tour.description,
      tour.default_food_notes,
      tour.category,
      tour.duration,
      tour.price_currency,
      String(tour.price_amount || ''),
      ...(tour.meal_types || []),
      ...formatStops(tour).map((stop) => `${stop.place} ${stop.description || ''}`),
    ].join(' ').toLowerCase().includes(value))
  }, [query, tours])

  const selectedTour = mode.type !== 'list' && mode.type !== 'create'
    ? tours.find((tour) => tour.id === mode.tourId)
    : null

  if (mode.type === 'create') {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a tours
        </button>
        <TourTemplateBuilder action={createAction} />
      </div>
    )
  }

  if (mode.type === 'edit' && selectedTour) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setMode({ type: 'detail', tourId: selectedTour.id })} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver al tour
        </button>
        <TourTemplateBuilder action={updateAction} initialData={tourToBuilderData(selectedTour)} submitLabel="Guardar cambios del tour" />
      </div>
    )
  }

  if (mode.type === 'detail' && selectedTour) {
    const stops = formatStops(selectedTour)
    const mealObservations = selectedTour.meal_observations || {}
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setMode({ type: 'edit', tourId: selectedTour.id })} className="btn-secondary py-2.5">
              <Pencil className="mr-2 inline h-4 w-4" /> Editar
            </button>
            <DeleteTourButton tour={selectedTour} action={deleteAction} />
          </div>
        </div>

        <section className="card overflow-hidden">
          <div className="grid gap-0 border-b border-slate-200 bg-white lg:grid-cols-[360px_1fr]">
            <div className="relative min-h-[210px] bg-slate-100">
              {selectedTour.image_url ? (
                <img src={selectedTour.image_url} alt={selectedTour.title} className="h-full min-h-[210px] w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-[210px] items-center justify-center bg-gradient-to-br from-[#14264F] to-[#1E40AF] text-white">
                  <ImageIcon className="h-12 w-12 opacity-80" />
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-[#14264F] shadow-sm">{categoryLabel(selectedTour.category)}</span>
            </div>
            <div className="p-5 sm:p-6">
              <p className="badge-brand inline-flex">Tour base</p>
              <h2 className="mt-3 text-2xl font-black text-[#14264F] sm:text-3xl">{selectedTour.title}</h2>
              {selectedTour.route ? <p className="mt-2 text-sm font-bold text-[#1E40AF]">{selectedTour.route}</p> : null}
              {selectedTour.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{selectedTour.description}</p> : null}
              <div className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-base font-black text-[#14264F]">{formatPrice(selectedTour)}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Precio</p></div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-base font-black text-[#14264F]">{selectedTour.duration || '-'}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duración</p></div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-base font-black text-[#14264F]">{stops.length}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stops</p></div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-base font-black text-[#14264F]">{selectedTour.meal_types?.length || 0}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Comidas</p></div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <div className="mb-4 flex items-center gap-2 text-[#14264F]"><Utensils className="h-5 w-5 text-[#0EA5E9]" /><h3 className="font-black">Comidas del tour</h3></div>
              <MealBadges mealTypes={selectedTour.meal_types} />
              <div className="mt-4 space-y-3">
                {(selectedTour.meal_types || []).map((meal) => (
                  <div key={meal} className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-[#0EA5E9]">{meal}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{mealObservations[meal] || 'Sin observación'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <div className="mb-4 flex items-center gap-2 text-[#14264F]"><Route className="h-5 w-5 text-[#1E40AF]" /><h3 className="font-black">Stops del tour</h3></div>
              <div className="space-y-3">
                {stops.length ? stops.map((stop, index) => (
                  <div key={stop.id} className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-black text-[#14264F]">{index + 1}. {stop.place}</p>
                    {stop.duration ? <p className="mt-1 text-xs font-bold text-slate-500">{stop.duration}</p> : null}
                    {stop.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{stop.description}</p> : null}
                    {stop.includes_ticket ? <p className="mt-2 text-xs font-black text-[#0EA5E9]">Entrada incluida</p> : null}
                  </div>
                )) : <p className="text-sm font-semibold text-slate-500">Este tour aún no tiene stops.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card hidden p-5 sm:p-6 lg:block">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Tours base</p>
            <h2 className="mt-1 text-2xl font-black text-[#14264F]">Lista de tours</h2>
            <p className="mt-2 text-sm text-slate-500">Crea, revisa, edita o elimina tours que luego autollenan tus itinerarios.</p>
          </div>
          <button type="button" onClick={() => setMode({ type: 'create' })} className="btn-primary w-full sm:w-fit">
            <Plus className="mr-2 inline h-4 w-4" /> Crear nuevo tour
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#14264F] outline-none placeholder:text-slate-600"
            placeholder="Buscar por tour, ruta, comida o stop..."
          />
        </div>
      </section>

      <section className="card overflow-hidden mobile-compact-list">
        <div className="hidden grid-cols-[1.35fr_.85fr_.75fr_.9fr_250px] gap-4 border-b border-slate-200 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 lg:grid">
          <span>Tour</span>
          <span>Categoría</span>
          <span>Precio</span>
          <span>Duración / stops</span>
          <span className="text-right">Acciones</span>
        </div>

        {!filteredTours.length ? (
          <div className="p-8 text-center">
            <MapPinned className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-lg font-black text-[#14264F]">No hay tours</h3>
            <p className="mt-2 text-sm text-slate-500">Crea o busca con otro término.</p>
          </div>
        ) : null}

        <div className="divide-y divide-slate-100">
          {filteredTours.map((tour) => {
            const stops = formatStops(tour)
            return (
              <article key={tour.id} className="mobile-compact-row mobile-tour-row grid gap-4 p-5 transition hover:bg-slate-50/45 lg:grid-cols-[1.35fr_.85fr_.75fr_.9fr_250px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                      {tour.image_url ? <img src={tour.image_url} alt={tour.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[#1E40AF]"><Route className="h-5 w-5" /></div>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-black leading-tight text-[#14264F]">{tour.title}</h3>
                      <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-slate-500">{tour.route || tour.code || 'Tour base'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:hidden">
                        <span className="rounded-md bg-[#14264F]/5 px-2 py-1 text-[10px] font-black uppercase text-[#14264F]">{categoryLabel(tour.category)}</span>
                        <span className="rounded-md bg-[#1E40AF]/8 px-2 py-1 text-[10px] font-black uppercase text-[#1E40AF]">{formatPrice(tour)}</span>
                        {tour.duration ? <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{tour.duration}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mobile-list-secondary hidden text-sm text-slate-600 lg:block">
                  <span className="rounded-md bg-[#14264F]/5 px-2.5 py-1 text-xs font-black text-[#14264F]">{categoryLabel(tour.category)}</span>
                </div>
                <div className="mobile-list-extra hidden lg:block">
                  <p className="text-sm font-black text-[#14264F]">{formatPrice(tour)}</p>
                </div>
                <div className="mobile-list-status hidden lg:block">
                  <p className="text-sm font-bold text-slate-600">{tour.duration || '-'}</p>
                  <span className="mt-1 inline-flex rounded-md bg-[#0EA5E9]/10 px-2 py-1 text-[11px] font-black text-[#1E40AF]">{stops.length} stops</span>
                </div>
                <div className="mobile-card-actions flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <button type="button" onClick={() => setMode({ type: 'detail', tourId: tour.id })} className="btn-secondary py-2.5">
                    <Eye className="mr-2 inline h-4 w-4" /> Ver
                  </button>
                  <button type="button" onClick={() => setMode({ type: 'edit', tourId: tour.id })} className="btn-secondary py-2.5">
                    <Pencil className="mr-2 inline h-4 w-4" /> Editar
                  </button>
                  <DeleteTourButton tour={tour} action={deleteAction} />
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
