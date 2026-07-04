import { PageShell } from '@/components/page-shell'
import { RealtimeChat } from '@/components/realtime-chat'
import { createClient } from '@/lib/supabase-server'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name,email,role').eq('id', user?.id).single()

  const roles = profile?.role === 'admin'
    ? ['admin', 'tour_leader', 'collaborator', 'client']
    : ['admin', 'tour_leader', 'collaborator', 'client']

  const { data: contacts } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, position')
    .in('role', roles)
    .neq('id', user?.id || '')
    .eq('status', 'active')
    .order('full_name', { ascending: true })

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Comunicación</p>
        <h1 className="text-3xl font-black text-white">Chat</h1>
        <p className="mt-2 text-sm text-slate-500">Selecciona el colaborador, cliente o usuario del equipo y conversa en tiempo real.</p>
      </div>

      <RealtimeChat
        currentUserId={user?.id || ''}
        currentUserName={profile?.full_name || profile?.email || 'Usuario'}
        contacts={contacts || []}
        title="Chat operativo"
      />
    </PageShell>
  )
}
