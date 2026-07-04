import { PageShell } from '@/components/page-shell'
import { RealtimeChat } from '@/components/realtime-chat'
import { createClient } from '@/lib/supabase-server'

export default async function ClientChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name,email').eq('id', user?.id).single()

  const { data: contacts } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, position')
    .in('role', ['admin', 'tour_leader', 'collaborator'])
    .eq('status', 'active')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Soporte</p>
        <h1 className="text-3xl font-black text-white">Chat con el equipo</h1>
        <p className="mt-2 text-sm text-slate-500">Selecciona el colaborador o tour leader con quien deseas comunicarte.</p>
      </div>

      <RealtimeChat
        currentUserId={user?.id || ''}
        currentUserName={profile?.full_name || profile?.email || 'Cliente'}
        contacts={contacts || []}
        title="Chat del cliente"
      />
    </PageShell>
  )
}
