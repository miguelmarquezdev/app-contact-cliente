import { PageShell } from '@/components/page-shell'
import { RealtimeChat } from '@/components/realtime-chat'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export default async function ClientChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name,email,avatar_url').eq('id', user?.id).single()
  const { data: client } = await supabase.from('clients').select('lifecycle_status').eq('profile_id', user?.id).single()

  if (client?.lifecycle_status !== 'client') {
    return (
      <PageShell>
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#14264F]">Chat aún no disponible</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            El chat operativo se habilita cuando tu propuesta queda aceptada, las políticas están aprobadas y el pago fue confirmado.
          </p>
          <Link href="/client/itineraries" className="btn-primary mt-5 inline-flex">Ver mis propuestas</Link>
        </div>
      </PageShell>
    )
  }

  const { data: contacts } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, position')
    .in('role', ['admin', 'tour_leader', 'collaborator'])
    .eq('status', 'active')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })

  return (
    <PageShell full>
      <RealtimeChat
        currentUserId={user?.id || ''}
        currentUserName={profile?.full_name || profile?.email || 'Cliente'}
        contacts={contacts || []}
        title="Chat del cliente"
      />
    </PageShell>
  )
}
