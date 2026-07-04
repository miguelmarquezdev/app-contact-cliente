import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { ItineraryBuilder, type DayForm } from '@/components/itinerary-builder'
import { createClient } from '@/lib/supabase-server'
import { updateFullItinerary } from '../../actions'

type PageProps = {
  params: Promise<{ id: string }>
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
}

type CollaboratorOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  position?: string | null
}

export default async function EditItineraryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('id,title,description,itinerary_days(day_number,title,route,food,hotel,description,itinerary_stops(place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(title,file_url,file_path,file_type),itinerary_day_collaborators(collaborator_id))')
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

  const days: DayForm[] = [...(itinerary.itinerary_days || [])]
    .sort((a, b) => a.day_number - b.day_number)
    .map((day) => ({
      title: day.title || '',
      route: day.route || '',
      food: day.food || '',
      hotel: day.hotel || '',
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

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Editar itinerario</p>
          <h1 className="text-3xl font-black text-white">{itinerary.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Modifica el nombre, días, comidas, alojamiento, documentos, colaboradores y stops. Al guardar se actualiza todo el itinerario completo.
          </p>
        </div>
        <Link href="/itineraries" className="btn-secondary sm:w-auto">
          Volver
        </Link>
      </div>

      <ItineraryBuilder
        action={updateFullItinerary}
        submitLabel="Actualizar itinerario"
        collaborators={collaborators || []}
        initialData={{
          id: itinerary.id,
          title: itinerary.title,
          description: itinerary.description,
          days,
        }}
      />
    </PageShell>
  )
}
