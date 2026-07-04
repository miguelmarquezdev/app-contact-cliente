import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { CollaboratorsAdminManager } from '@/components/collaborators-admin-manager'
import { createCollaborator, deleteCollaborator, updateCollaborator } from './actions'

type PageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>
}

export default async function CollaboratorsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: collaborators } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['tour_leader', 'collaborator'])
    .order('created_at', { ascending: false })

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Equipo</p>
        <h1 className="text-3xl font-black text-white">Colaboradores</h1>
        <p className="mt-2 text-sm text-slate-500">Administra guías, operadores, conductores, asistentes y tour leaders.</p>
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

      <CollaboratorsAdminManager
        collaborators={collaborators || []}
        createAction={createCollaborator}
        updateAction={updateCollaborator}
        deleteAction={deleteCollaborator}
      />
    </PageShell>
  )
}
