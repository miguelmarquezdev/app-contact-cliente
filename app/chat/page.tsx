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

type ClientContactRow = {
  profiles: Contact | Contact[] | null
}

function normalizeProfile(value: Contact | Contact[] | null | undefined) {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name,email,role').eq('id', user?.id).single()

  const { data: teamContacts } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, position')
    .in('role', ['admin', 'tour_leader', 'collaborator'])
    .neq('id', user?.id || '')
    .eq('status', 'active')
    .order('full_name', { ascending: true })
    .returns<Contact[]>()

  const { data: clientRows } = await supabase
    .from('clients')
    .select('profiles(id, full_name, email, avatar_url, role, position)')
    .eq('lifecycle_status', 'client')
    .returns<ClientContactRow[]>()

  const clientContacts = (clientRows || [])
    .map((row) => normalizeProfile(row.profiles))
    .filter((item): item is Contact => Boolean(item?.id && item.id !== user?.id))

  const contactsMap = new Map<string, Contact>()
  ;[...(teamContacts || []), ...clientContacts].forEach((contact) => {
    if (contact.id && contact.id !== user?.id) contactsMap.set(contact.id, contact)
  })

  const contacts = Array.from(contactsMap.values())

  return (
    <PageShell full>
      <RealtimeChat
        currentUserId={user?.id || ''}
        currentUserName={profile?.full_name || profile?.email || 'Usuario'}
        contacts={contacts}
        title="Chat operativo"
      />
    </PageShell>
  )
}
