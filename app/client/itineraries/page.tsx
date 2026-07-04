import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { ClientItinerariesView } from '@/components/client-itineraries-view'
import { createClient } from '@/lib/supabase-server'

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

type Assignment = {
  id: string
  note: string | null
  created_at: string
  itineraries: {
    id: string
    title: string
    description: string | null
    itinerary_days: Day[] | null
  } | null
}

export default async function ClientItinerariesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user?.id).single()

  const { data: assignments } = client?.id
    ? await supabase
        .from('client_itineraries')
        .select('id,note,created_at,itineraries(id,title,description,itinerary_days(id,day_number,title,route,food,hotel,description,itinerary_stops(id,place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(id,title,file_url,file_type),itinerary_day_collaborators(id,profiles(id,full_name,email,role,position))))')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .returns<Assignment[]>()
    : { data: [] as Assignment[] }

  return (
    <PageShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Portal del cliente</p>
          <h1 className="mt-1 text-3xl font-black text-white">Mis itinerarios</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Revisa tus viajes recibidos, documentos del día y conversa con el equipo asignado.
          </p>
        </div>
        <LogoutButton />
      </div>

      <ClientItinerariesView assignments={assignments || []} />
    </PageShell>
  )
}
