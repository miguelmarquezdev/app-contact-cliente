'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, Mail, Pencil, Phone, Plus, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  status: string | null
  created_at?: string | null
}

type ClientItem = {
  id: string
  profile_id: string
  country: string | null
  passport_number: string | null
  created_at?: string | null
  profiles: Profile | null
}

type ActionFn = (formData: FormData) => void | Promise<void>

type Mode =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'detail'; clientId: string }
  | { type: 'edit'; clientId: string }

function statusLabel(status?: string | null) {
  return status === 'inactive' ? 'Inactivo' : 'Activo'
}

function formatDate(value?: string | null) {
  if (!value) return 'No registrado'
  try {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return 'No registrado'
  }
}

function DeleteClientButton({ client, action }: { client: ClientItem; action: ActionFn }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm('¿Seguro que deseas eliminar este cliente? También se eliminará su acceso.')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="client_id" value={client.id} />
      <input type="hidden" name="profile_id" value={client.profile_id} />
      <button className="btn-danger w-full py-2.5 sm:w-auto" title="Eliminar cliente">
        <Trash2 className="mr-2 inline h-4 w-4" /> Eliminar
      </button>
    </form>
  )
}

export function ClientsAdminManager({
  clients,
  createAction,
  updateAction,
  deleteAction,
}: {
  clients: ClientItem[]
  createAction: ActionFn
  updateAction: ActionFn
  deleteAction: ActionFn
}) {
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [query, setQuery] = useState('')

  useEffect(() => {
    const openCreate = () => setMode({ type: 'create' })
    window.addEventListener('app:create', openCreate)
    return () => window.removeEventListener('app:create', openCreate)
  }, [])

  useEffect(() => {
    const handleSearch = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      setQuery(customEvent.detail || '')
    }
    window.addEventListener('app:search', handleSearch)
    return () => window.removeEventListener('app:search', handleSearch)
  }, [])

  const filteredClients = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return clients
    return clients.filter((client) => {
      const profile = client.profiles
      const haystack = [
        profile?.full_name,
        profile?.email,
        profile?.phone,
        client.country,
        client.passport_number,
        profile?.status,
      ].join(' ').toLowerCase()
      return haystack.includes(value)
    })
  }, [clients, query])

  const selectedClient = mode.type !== 'list' && mode.type !== 'create'
    ? clients.find((client) => client.id === mode.clientId)
    : null

  if (mode.type === 'create') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a clientes
          </button>
          <p className="text-sm font-semibold text-slate-500">Crea el acceso del cliente para su panel.</p>
        </div>

        <form action={createAction} className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <p className="badge-brand inline-flex">Nuevo cliente</p>
            <h2 className="mt-3 text-2xl font-black text-white">Registrar cliente con credenciales</h2>
            <p className="mt-2 text-sm text-slate-500">El cliente podrá ingresar a su panel, ver itinerarios recibidos y chatear.</p>
          </div>
          <input name="full_name" className="input" placeholder="Usuario / nombre completo" required />
          <input name="email" className="input" type="email" placeholder="Correo electrónico" required />
          <input name="password" className="input" type="password" placeholder="Contraseña" minLength={6} required />
          <input name="phone" className="input" placeholder="WhatsApp" />
          <input name="country" className="input" placeholder="País" />
          <input name="passport_number" className="input" placeholder="Pasaporte opcional" />
          <div className="md:col-span-2 xl:col-span-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary">Cancelar</button>
            <button className="btn-primary">Crear cliente con acceso</button>
          </div>
        </form>
      </div>
    )
  }

  if (mode.type === 'detail' && selectedClient) {
    const profile = selectedClient.profiles
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setMode({ type: 'edit', clientId: selectedClient.id })} className="btn-secondary py-2.5">
              <Pencil className="mr-2 inline h-4 w-4" /> Editar
            </button>
            <DeleteClientButton client={selectedClient} action={deleteAction} />
          </div>
        </div>

        <section className="card overflow-hidden mobile-compact-list">
          <div className="border-b border-[#1e293b] bg-gradient-to-r from-emerald-500/10 via-[#0b1220] to-sky-500/10 p-6">
            <p className="badge-brand inline-flex">Perfil de cliente</p>
            <h2 className="mt-3 text-3xl font-black text-white">{profile?.full_name || 'Cliente sin nombre'}</h2>
            <p className="mt-2 text-sm text-slate-400">Cliente registrado desde {formatDate(selectedClient.created_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300 ring-1 ring-emerald-500/20">{statusLabel(profile?.status)}</span>
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-300 ring-1 ring-sky-500/20">Cliente</span>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#1e293b] bg-[#030712]/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Contacto</p>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-3 text-slate-300"><Mail className="h-4 w-4 text-sky-300" /> {profile?.email || 'Sin correo'}</p>
                <p className="flex items-center gap-3 text-slate-300"><Phone className="h-4 w-4 text-emerald-300" /> {profile?.phone || 'Sin WhatsApp'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-[#1e293b] bg-[#030712]/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Datos de viaje</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><p className="text-slate-500">País</p><p className="font-bold text-white">{selectedClient.country || 'No registrado'}</p></div>
                <div><p className="text-slate-500">Pasaporte</p><p className="font-bold text-white">{selectedClient.passport_number || 'No registrado'}</p></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (mode.type === 'edit' && selectedClient) {
    const profile = selectedClient.profiles
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setMode({ type: 'detail', clientId: selectedClient.id })} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver al perfil
        </button>

        <form action={updateAction} className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="client_id" value={selectedClient.id} />
          <input type="hidden" name="profile_id" value={selectedClient.profile_id} />
          <div className="md:col-span-2 xl:col-span-3">
            <p className="badge-accent inline-flex">Editar cliente</p>
            <h2 className="mt-3 text-2xl font-black text-white">{profile?.full_name || 'Cliente'}</h2>
            <p className="mt-2 text-sm text-slate-500">Puedes actualizar sus datos y cambiar contraseña si lo necesita.</p>
          </div>
          <input name="full_name" className="input" defaultValue={profile?.full_name || ''} placeholder="Nombre completo" required />
          <input name="email" className="input" type="email" defaultValue={profile?.email || ''} placeholder="Correo" required />
          <input name="password" className="input" type="password" placeholder="Nueva contraseña opcional" minLength={6} />
          <input name="phone" className="input" defaultValue={profile?.phone || ''} placeholder="WhatsApp" />
          <input name="country" className="input" defaultValue={selectedClient.country || ''} placeholder="País" />
          <input name="passport_number" className="input" defaultValue={selectedClient.passport_number || ''} placeholder="Pasaporte" />
          <select name="status" className="input" defaultValue={profile?.status || 'active'}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
          <div className="md:col-span-2 xl:col-span-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMode({ type: 'detail', clientId: selectedClient.id })} className="btn-secondary">Cancelar</button>
            <button className="btn-primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">

            <section className="card hidden p-5 sm:p-6 lg:block">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Pasajeros</p>
            <h2 className="mt-1 text-2xl font-black text-white">Lista de clientes</h2>
            <p className="mt-2 text-sm text-slate-500">Busca, revisa, edita o elimina clientes con acceso al portal.</p>
          </div>
          <button type="button" onClick={() => setMode({ type: 'create' })} className="btn-primary w-full sm:w-fit">
            <Plus className="mr-2 inline h-4 w-4" /> Crear nuevo cliente
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#1e293b] bg-[#030712] px-4 py-3">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
            placeholder="Buscar por nombre, correo, WhatsApp, país o pasaporte..."
          />
        </div>
      </section>

      <section className="card overflow-hidden mobile-compact-list">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_120px_260px] gap-4 border-b border-[#1e293b] px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 lg:grid">
          <span>Cliente</span>
          <span>Contacto</span>
          <span>Datos</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>

        {!filteredClients.length ? (
          <div className="p-8 text-center">
            <UserRound className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-lg font-black text-white">No hay clientes</h3>
            <p className="mt-2 text-sm text-slate-500">Crea o busca con otro término.</p>
          </div>
        ) : null}

        <div className="divide-y divide-[#1e293b]">
          {filteredClients.map((client) => {
            const profile = client.profiles
            return (
              <article key={client.id} className="mobile-compact-row grid gap-4 p-5 transition hover:bg-[#111827]/45 lg:grid-cols-[1.4fr_1fr_1fr_120px_260px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-white">{profile?.full_name || 'Cliente sin nombre'}</h3>
                      <p className="truncate text-xs font-semibold text-slate-500">Registrado: {formatDate(client.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="mobile-list-secondary text-sm text-slate-300">
                  <p className="truncate font-semibold">{profile?.email || 'Sin correo'}</p>
                  <p className="mt-1 truncate text-slate-500">{profile?.phone || 'Sin WhatsApp'}</p>
                </div>
                <div className="mobile-list-extra text-sm text-slate-300">
                  <p className="truncate font-semibold">{client.country || 'Sin país'}</p>
                  <p className="mt-1 truncate text-slate-500">{client.passport_number || 'Sin pasaporte'}</p>
                </div>
                <div className="mobile-list-status">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${profile?.status === 'inactive' ? 'bg-red-500/10 text-red-300 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20'}`}>
                    {statusLabel(profile?.status)}
                  </span>
                </div>
                <div className="mobile-card-actions flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <button type="button" onClick={() => setMode({ type: 'detail', clientId: client.id })} className="btn-secondary py-2.5">
                    <Eye className="mr-2 inline h-4 w-4" /> Ver
                  </button>
                  <button type="button" onClick={() => setMode({ type: 'edit', clientId: client.id })} className="btn-secondary py-2.5">
                    <Pencil className="mr-2 inline h-4 w-4" /> Editar
                  </button>
                  <DeleteClientButton client={client} action={deleteAction} />
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
