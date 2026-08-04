import { PageShell } from '@/components/page-shell'
import { RealtimeChat } from '@/components/realtime-chat'
import { createClient } from '@/lib/supabase-server'

type Contact = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url?: string | null
  role: string | null
  position?: string | null
}

type ClientAssignment = {
  clients: {
    profile_id: string
    lifecycle_status?: string | null
    profiles: Contact | Contact[] | null
  } | null
}

export default async function CollaboratorChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name,email,role').eq('id', user?.id).single()

  const { data: teamContacts } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, position')
    .in('role', ['admin', 'tour_leader', 'collaborator'])
    .eq('status', 'active')
    .neq('id', user?.id || '')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })
    .returns<Contact[]>()

  const { data: links } = user?.id
    ? await supabase.from('itinerary_day_collaborators').select('day_id').eq('collaborator_id', user.id)
    : { data: [] }

  const dayIds = [...new Set((links || []).map((item) => item.day_id).filter(Boolean))]

  const { data: days } = dayIds.length
    ? await supabase.from('itinerary_days').select('itinerary_id').in('id', dayIds)
    : { data: [] }

  const itineraryIds = [...new Set((days || []).map((item) => item.itinerary_id).filter(Boolean))]

  const { data: clientAssignments } = itineraryIds.length
    ? await supabase
        .from('client_itineraries')
        .select('clients(profile_id,lifecycle_status,profiles(id,full_name,email,avatar_url,role,position))')
        .in('itinerary_id', itineraryIds)
        .returns<ClientAssignment[]>()
    : { data: [] as ClientAssignment[] }

  const clientContacts = (clientAssignments || [])
    .filter((item) => item.clients?.lifecycle_status === 'client')
    .map((item) => Array.isArray(item.clients?.profiles) ? item.clients?.profiles[0] : item.clients?.profiles)
    .filter(Boolean) as Contact[]

  const contactsMap = new Map<string, Contact>()
  ;[...(teamContacts || []), ...clientContacts].forEach((contact) => {
    if (contact.id && contact.id !== user?.id) contactsMap.set(contact.id, contact)
  })

  const contacts = Array.from(contactsMap.values())

  return (
    <PageShell full>
      <RealtimeChat
        currentUserId={user?.id || ''}
        currentUserName={profile?.full_name || profile?.email || 'Colaborador'}
        contacts={contacts}
        title="Chat colaborador"
      />
    </PageShell>
  )
}
