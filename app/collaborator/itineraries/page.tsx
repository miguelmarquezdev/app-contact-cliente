import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { CollaboratorItinerariesView } from '@/components/collaborator-itineraries-view'
import { createClient } from '@/lib/supabase-server'
import type { ItineraryTabDay } from '@/components/itinerary-days-tabs'

type ItineraryRecord = {
  id: string
  title: string
  description: string | null
}

type DayRecord = ItineraryTabDay & {
  itinerary_id: string
}

async function getCollaboratorAssignments(userId: string) {
  const supabase = await createClient()

  const { data: links } = await supabase
    .from('itinerary_day_collaborators')
    .select('day_id')
    .eq('collaborator_id', userId)

  const dayIds = [...new Set((links || []).map((item) => item.day_id).filter(Boolean))]
  if (!dayIds.length) return []

  const { data: days } = await supabase
    .from('itinerary_days')
    .select('id,itinerary_id,day_number,title,route,food,hotel,description,itinerary_stops(id,place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(id,title,file_url,file_type),itinerary_day_collaborators(id,profiles(id,full_name,email,role,position))')
    .in('id', dayIds)
    .order('day_number', { ascending: true })
    .returns<DayRecord[]>()

  const itineraryIds = [...new Set((days || []).map((day) => day.itinerary_id).filter(Boolean))]
  if (!itineraryIds.length) return []

  const { data: itineraries } = await supabase
    .from('itineraries')
    .select('id,title,description')
    .in('id', itineraryIds)
    .returns<ItineraryRecord[]>()

  return (itineraries || []).map((itinerary) => ({
    ...itinerary,
    days: (days || []).filter((day) => day.itinerary_id === itinerary.id)
  }))
}

export default async function CollaboratorItinerariesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const itineraries = user?.id ? await getCollaboratorAssignments(user.id) : []

  return (
    <PageShell>
      <div className="mb-5 hidden flex-col justify-between gap-4 lg:flex lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#1E40AF]">Panel colaborador</p>
          <h1 className="mt-1 text-3xl font-black text-[#14264F]">Mis itinerarios asignados</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Aquí verás solo los días donde el administrador te asignó como colaborador o tour leader.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-5 lg:hidden">
        <h1 className="text-[2rem] font-black leading-none text-slate-950">Mis días</h1>
        <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">Tus asignaciones y documentos.</p>
      </div>

      <CollaboratorItinerariesView itineraries={itineraries} />
    </PageShell>
  )
}
