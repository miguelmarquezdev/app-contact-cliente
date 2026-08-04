import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { ItinerariesAdminManager } from '@/components/itineraries-admin-manager'
import { assignItineraryToClient, createFullItinerary, deleteItinerary, removeClientItinerary } from './actions'

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

type Day = {
  id: string
  day_number: number
  title: string
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
  updated_at?: string | null
  itinerary_days: Day[] | null
  client_itineraries?: {
    id: string
    note: string | null
    proposal_status?: string | null
    version_number?: number | null
    clients: { id: string; profiles: { full_name: string | null; email: string | null } | null } | null
  }[] | null
}

type ClientOption = {
  id: string
  lifecycle_status?: string | null
  proposal_status?: string | null
  profiles: { full_name: string | null; email: string | null } | null
}

type CollaboratorOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  position?: string | null
}

type TourTemplateStop = {
  id: string
  place: string
  duration: string | null
  description: string | null
  includes_ticket: boolean | null
  order_index: number | null
}

type TourTemplateOption = {
  id: string
  title: string
  route: string | null
  description: string | null
  default_food_notes: string | null
  meal_types?: string[] | null
  meal_observations?: Record<string, string> | null
  tour_template_stops: TourTemplateStop[] | null
}

type HotelOption = {
  id: string
  name: string
  location: string | null
  description: string | null
}

export default async function ItinerariesPage() {
  const supabase = await createClient()
  const { data: itineraries } = await supabase
    .from('itineraries')
    .select('id,title,description,image_url,created_at,updated_at,itinerary_days(id,day_number,title,route,tour_template_id,food,food_type,food_description,hotel,hotel_id,description,itinerary_stops(id,place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(id,title,file_url,file_type),itinerary_day_collaborators(id,profiles(id,full_name,email,role,position))),client_itineraries(id,note,proposal_status,version_number,clients(id,lifecycle_status,proposal_status,profiles(full_name,email)))')
    .order('created_at', { ascending: false })
    .returns<Itinerary[]>()

  const { data: clients } = await supabase
    .from('clients')
    .select('id,lifecycle_status,proposal_status,profiles(full_name,email)')
    .order('created_at', { ascending: false })
    .returns<ClientOption[]>()

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

  return (
    <PageShell>
      <div className="mb-6 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Itinerarios independientes</p>
          <h1 className="text-3xl font-black text-[#14264F]">Constructor de itinerarios</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Administra tus itinerarios como plantillas independientes: crea, revisa, envía a prospectos y edita cuando lo necesites.
          </p>
        </div>
      </div>

      <ItinerariesAdminManager
        itineraries={itineraries || []}
        clients={clients || []}
        collaborators={collaborators || []}
        tourTemplates={tourTemplates || []}
        hotels={hotels || []}
        createAction={createFullItinerary}
        assignAction={assignItineraryToClient}
        removeAssignmentAction={removeClientItinerary}
        deleteAction={deleteItinerary}
      />
    </PageShell>
  )
}
