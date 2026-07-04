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
  food: string | null
  hotel: string | null
  description: string | null
  itinerary_stops: Stop[] | null
  itinerary_day_documents: DayDocument[] | null
  itinerary_day_collaborators: DayCollaborator[] | null
}

type Itinerary = {
  id: string
  title: string
  description: string | null
  itinerary_days: Day[] | null
  client_itineraries?: {
    id: string
    note: string | null
    clients: { id: string; profiles: { full_name: string | null; email: string | null } | null } | null
  }[] | null
}

type ClientOption = {
  id: string
  profiles: { full_name: string | null; email: string | null } | null
}

type CollaboratorOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  position?: string | null
}

export default async function ItinerariesPage() {
  const supabase = await createClient()
  const { data: itineraries } = await supabase
    .from('itineraries')
    .select('id,title,description,created_at,itinerary_days(id,day_number,title,route,food,hotel,description,itinerary_stops(id,place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(id,title,file_url,file_type),itinerary_day_collaborators(id,profiles(id,full_name,email,role,position))),client_itineraries(id,note,clients(id,profiles(full_name,email)))')
    .order('created_at', { ascending: false })
    .returns<Itinerary[]>()

  const { data: clients } = await supabase
    .from('clients')
    .select('id,profiles(full_name,email)')
    .order('created_at', { ascending: false })
    .returns<ClientOption[]>()

  const { data: collaborators } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,position')
    .in('role', ['tour_leader', 'collaborator'])
    .eq('status', 'active')
    .order('full_name', { ascending: true })
    .returns<CollaboratorOption[]>()

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Itinerarios independientes</p>
          <h1 className="text-3xl font-black text-white">Constructor de itinerarios</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Administra tus itinerarios como plantillas independientes: crea, revisa, envía a clientes y edita cuando lo necesites.
          </p>
        </div>
      </div>

      <ItinerariesAdminManager
        itineraries={itineraries || []}
        clients={clients || []}
        collaborators={collaborators || []}
        createAction={createFullItinerary}
        assignAction={assignItineraryToClient}
        removeAssignmentAction={removeClientItinerary}
        deleteAction={deleteItinerary}
      />
    </PageShell>
  )
}
