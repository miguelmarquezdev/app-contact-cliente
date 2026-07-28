import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { ClientsAdminManager } from '@/components/clients-admin-manager'
import { createClientRecord, createNewProposalVersion, deleteClientRecord, updateClientRecord } from './actions'

type PageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*, profiles(*), client_itineraries(id,note,proposal_status,version_number,requested_changes,rejection_reason,created_at,sent_at,responded_at,accepted_at,itineraries(id,title))')
    .order('created_at', { ascending: false })

  return (
    <PageShell>
      <div className="mb-6 hidden lg:block">
        <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Pipeline</p>
        <h1 className="text-3xl font-black text-[#14264F]">Prospectos</h1>
        <p className="mt-2 text-sm text-slate-500">Administra prospectos, propuestas, aceptación, rechazo y pagos.</p>
      </div>

      {params?.error ? (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {params.error}
        </div>
      ) : null}

      {params?.success ? (
        <div className="mb-5 rounded-2xl border border-[#14264F]/10 bg-[#14264F]/10 px-4 py-3 text-sm font-semibold text-[#0EA5E9]">
          {params.success}
        </div>
      ) : null}

      <ClientsAdminManager
        clients={clients || []}
        createAction={createClientRecord}
        updateAction={updateClientRecord}
        deleteAction={deleteClientRecord}
        createVersionAction={createNewProposalVersion}
      />
    </PageShell>
  )
}
