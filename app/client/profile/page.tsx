import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase-server'
import { updateClientProfile } from './actions'

export default async function ClientProfilePage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  const { data: client } = await supabase.from('clients').select('*').eq('profile_id', user?.id).single()

  return (
    <PageShell>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Portal del cliente</p>
          <h1 className="mt-1 text-3xl font-black text-white">Mi perfil</h1>
          <p className="mt-2 text-slate-500">El cliente puede actualizar sus datos básicos.</p>
        </div>
        <LogoutButton />
      </div>

      {params?.success ? <div className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">{params.success}</div> : null}

      <form action={updateClientProfile} className="card max-w-3xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">Nombre completo</label>
            <input name="full_name" defaultValue={profile?.full_name || ''} className="input" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">Correo electrónico</label>
            <input value={profile?.email || ''} className="input bg-[#111827]" disabled />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">WhatsApp / Teléfono</label>
            <input name="phone" defaultValue={profile?.phone || ''} className="input" placeholder="+51 999 999 999" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">País</label>
            <input name="country" defaultValue={client?.country || ''} className="input" placeholder="Perú, Estados Unidos, Brasil..." />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">Pasaporte</label>
            <input name="passport_number" defaultValue={client?.passport_number || ''} className="input" placeholder="Opcional" />
          </div>
        </div>
        <button className="btn-primary mt-6">Guardar mis datos</button>
      </form>
    </PageShell>
  )
}
