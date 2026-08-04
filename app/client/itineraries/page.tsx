import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { ClientItinerariesView } from '@/components/client-itineraries-view'
import { acceptProposal, rejectProposal, requestProposalChanges } from './actions'
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
    image_url?: string | null
    itinerary_days: Day[] | null
  } | null
}

export default async function ClientItinerariesPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user?.id).single()

  const { data: assignments } = client?.id
    ? await supabase
        .from('client_itineraries')
        .select('id,note,proposal_status,version_number,requested_changes,rejection_reason,created_at,sent_at,responded_at,accepted_at,itineraries(id,title,description,image_url,itinerary_days(id,day_number,title,route,food,hotel,description,itinerary_stops(id,place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(id,title,file_url,file_type),itinerary_day_collaborators(id,profiles(id,full_name,email,role,position))))')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .returns<Assignment[]>()
    : { data: [] as Assignment[] }

  return (
    <PageShell>
      <div className="mb-5 hidden flex-col justify-between gap-4 lg:flex lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#1E40AF]">Portal del cliente</p>
          <h1 className="mt-1 text-3xl font-black text-[#14264F]">Mis itinerarios</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Revisa tus viajes recibidos, documentos del día y conversa con el equipo asignado.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-5 lg:hidden">
        <h1 className="text-[2rem] font-black leading-none text-slate-950">Mis viajes</h1>
        <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">Tus propuestas, versiones y documentos.</p>
      </div>

      {params?.error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{params.error}</div> : null}
      {params?.success ? <div className="mb-5 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-[#1E40AF]">{params.success}</div> : null}
      <ClientItinerariesView assignments={assignments || []} acceptAction={acceptProposal} rejectAction={rejectProposal} changesAction={requestProposalChanges} />
    </PageShell>
  )
}
