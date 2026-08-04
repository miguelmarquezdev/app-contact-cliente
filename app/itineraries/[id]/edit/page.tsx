import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { ItineraryBuilder, type DayForm } from '@/components/itinerary-builder'
import { createClient } from '@/lib/supabase-server'
import { updateFullItinerary } from '../../actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ proposal_version_id?: string }>
}

type Stop = {
  place: string | null
  title: string | null
  duration: string | null
  description: string | null
  includes_ticket: boolean | null
  order_index: number | null
}

type DayDocument = {
  title: string
  file_url: string
  file_path: string | null
  file_type: string | null
}

type DayCollaborator = {
  collaborator_id: string
}

type Day = {
  day_number: number
  title: string | null
  route: string | null
  tour_template_id?: string | null
  food: string | null
  food_type?: string | null
  food_description?: string | null
  hotel: string | null
  hotel_id?: string | null
  description: string | null
  itinerary_stops: Stop[] | null
  itinerary_day_documents: DayDocument[] | null
  itinerary_day_collaborators: DayCollaborator[] | null
}

type Itinerary = {
  id: string
  title: string
  description: string | null
  image_url?: string | null
  itinerary_days: Day[] | null
}

type CollaboratorOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  position?: string | null
}

type TourTemplateStop = { id: string; place: string; duration: string | null; description: string | null; includes_ticket: boolean | null; order_index: number | null }
type TourTemplateOption = { id: string; title: string; route: string | null; description: string | null; default_food_notes: string | null; meal_types?: string[] | null; meal_observations?: Record<string, string> | null; category?: string | null; price_amount?: number | null; price_currency?: string | null; duration?: string | null; image_url?: string | null; featured?: boolean | null; tour_template_stops: TourTemplateStop[] | null }
type HotelOption = { id: string; name: string; location: string | null; description: string | null }

export default async function EditItineraryPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('id,title,description,image_url,itinerary_days(day_number,title,route,tour_template_id,food,food_type,food_description,hotel,hotel_id,description,itinerary_stops(place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(title,file_url,file_path,file_type),itinerary_day_collaborators(collaborator_id))')
    .eq('id', id)
    .single<Itinerary>()

  if (!itinerary) notFound()

  const { data: collaborators } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,position')
    .in('role', ['tour_leader', 'collaborator'])
    .eq('status', 'active')
    .order('full_name', { ascending: true })
    .returns<CollaboratorOption[]>()

  const { data: tourTemplates } = await supabase
    .from('tours')
    .select('id,title,route,description,default_food_notes,meal_types,meal_observations,category,price_amount,price_currency,duration,image_url,featured,tour_template_stops(id,place,duration,description,includes_ticket,order_index)')
    .order('title', { ascending: true })
    .returns<TourTemplateOption[]>()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id,name,location,description')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .returns<HotelOption[]>()

  const days: DayForm[] = [...(itinerary.itinerary_days || [])]
    .sort((a, b) => a.day_number - b.day_number)
    .map((day) => ({
      title: day.title || '',
      route: day.route || '',
      tour_template_id: day.tour_template_id || '',
      food: day.food || '',
      food_type: day.food_type || '',
      food_description: day.food_description || day.food || '',
      hotel: day.hotel || '',
      hotel_id: day.hotel_id || '',
      description: day.description || '',
      collaborator_ids: [...(day.itinerary_day_collaborators || [])].map((item) => item.collaborator_id).filter(Boolean),
      existing_documents: [...(day.itinerary_day_documents || [])].map((doc) => ({
        title: doc.title,
        file_url: doc.file_url,
        file_path: doc.file_path,
        file_type: doc.file_type,
      })),
      stops: [...(day.itinerary_stops || [])]
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((stop) => ({
          place: stop.place || stop.title || '',
          duration: stop.duration || '',
          description: stop.description || '',
          includes_ticket: Boolean(stop.includes_ticket),
        })),
    }))

  const proposalVersionId = query?.proposal_version_id || ''

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Editar itinerario</p>
          <h1 className="text-3xl font-black text-[#14264F]">{itinerary.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {proposalVersionId ? 'Edita esta nueva versión. Al guardar se enviará automáticamente al prospecto y reemplazará la versión anterior.' : 'Modifica el nombre, días, comidas, alojamiento, documentos, colaboradores y stops. Al guardar se actualiza todo el itinerario completo.'}
          </p>
        </div>
        <Link href="/itineraries" className="btn-secondary sm:w-auto">
          Volver
        </Link>
      </div>

      <ItineraryBuilder
        action={updateFullItinerary}
        submitLabel={proposalVersionId ? 'Guardar y enviar nueva versión' : 'Actualizar itinerario'}
        hiddenFields={proposalVersionId ? { proposal_version_id: proposalVersionId } : {}}
        collaborators={collaborators || []}
        tourTemplates={tourTemplates || []}
        hotels={hotels || []}
        initialData={{
          id: itinerary.id,
          title: itinerary.title,
          description: itinerary.description,
          image_url: itinerary.image_url,
          days,
        }}
      />
    </PageShell>
  )
}
