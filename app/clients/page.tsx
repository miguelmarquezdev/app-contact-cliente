import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { ClientsAdminManager } from '@/components/clients-admin-manager'
import { createClientRecord, deleteClientRecord, updateClientRecord } from './actions'

type PageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })

  return (
    <PageShell>
      <div className="mb-6 hidden lg:block">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Pasajeros</p>
        <h1 className="text-3xl font-black text-white">Clientes</h1>
        <p className="mt-2 text-sm text-slate-500">Administra clientes con listado, buscador, vista de perfil, edición y eliminación.</p>
      </div>

      {params?.error ? (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {params.error}
        </div>
      ) : null}

      {params?.success ? (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
          {params.success}
        </div>
      ) : null}

      <ClientsAdminManager
        clients={clients || []}
        createAction={createClientRecord}
        updateAction={updateClientRecord}
        deleteAction={deleteClientRecord}
      />
    </PageShell>
  )
}
