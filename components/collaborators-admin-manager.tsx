'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Eye, Mail, Pencil, Phone, Plus, Search, Trash2, UserCog } from 'lucide-react'

type CollaboratorItem = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  position: string | null
  status: string | null
  created_at?: string | null
}

type ActionFn = (formData: FormData) => void | Promise<void>

type Mode =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'detail'; userId: string }
  | { type: 'edit'; userId: string }

function roleLabel(role?: string | null) {
  return role === 'tour_leader' ? 'Tour Leader' : 'Colaborador'
}

function statusLabel(status?: string | null) {
  return status === 'inactive' ? 'Inactivo' : 'Activo'
}

const POSITION_OPTIONS = ['Guía', 'Conductor', 'Counter', 'Operaciones', 'Reservas', 'Ventas', 'Soporte']

function positionLabel(position?: string | null) {
  return position || 'Guía'
}

function formatDate(value?: string | null) {
  if (!value) return 'No registrado'
  try {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return 'No registrado'
  }
}

function DeleteCollaboratorButton({ user, action }: { user: CollaboratorItem; action: ActionFn }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm('¿Seguro que deseas eliminar este colaborador? También se eliminará su acceso.')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="profile_id" value={user.id} />
      <button className="btn-danger w-full py-2.5 sm:w-auto" title="Eliminar colaborador">
        <Trash2 className="mr-2 inline h-4 w-4" /> Eliminar
      </button>
    </form>
  )
}

export function CollaboratorsAdminManager({
  collaborators,
  createAction,
  updateAction,
  deleteAction,
}: {
  collaborators: CollaboratorItem[]
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

  const filteredCollaborators = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return collaborators
    return collaborators.filter((user) => {
      const haystack = [user.full_name, user.email, user.phone, user.role, user.status, user.position, roleLabel(user.role), positionLabel(user.position)]
        .join(' ')
        .toLowerCase()
      return haystack.includes(value)
    })
  }, [collaborators, query])

  const selectedUser = mode.type !== 'list' && mode.type !== 'create'
    ? collaborators.find((user) => user.id === mode.userId)
    : null

  if (mode.type === 'create') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a colaboradores
          </button>
          <p className="text-sm font-semibold text-slate-500">Crea un acceso para guía, operador, conductor o tour leader.</p>
        </div>

        <form action={createAction} className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <p className="badge-brand inline-flex">Nuevo colaborador</p>
            <h2 className="mt-3 text-2xl font-black text-[#14264F]">Registrar colaborador con credenciales</h2>
            <p className="mt-2 text-sm text-slate-500">Podrá ingresar al panel colaborador y ver sus días asignados.</p>
          </div>
          <input name="full_name" className="input" placeholder="Usuario / nombre completo" required />
          <input name="email" className="input" type="email" placeholder="Correo electrónico" required />
          <input name="password" className="input" type="password" placeholder="Contraseña" minLength={6} required />
          <input name="phone" className="input" placeholder="WhatsApp" />
          <select name="role" className="input" defaultValue="collaborator">
            <option value="collaborator">Colaborador</option>
            <option value="tour_leader">Tour Leader</option>
          </select>
          <select name="position" className="input" defaultValue="Guía">
            {POSITION_OPTIONS.map((position) => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
          <div className="md:col-span-2 xl:col-span-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary">Cancelar</button>
            <button className="btn-primary">Crear colaborador con acceso</button>
          </div>
        </form>
      </div>
    )
  }

  if (mode.type === 'detail' && selectedUser) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setMode({ type: 'edit', userId: selectedUser.id })} className="btn-secondary py-2.5">
              <Pencil className="mr-2 inline h-4 w-4" /> Editar
            </button>
            <DeleteCollaboratorButton user={selectedUser} action={deleteAction} />
          </div>
        </div>

        <section className="card overflow-hidden mobile-compact-list">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-[#0b1220] to-sky-500/10 p-6">
            <p className="badge-brand inline-flex">Perfil del equipo</p>
            <h2 className="mt-3 text-3xl font-black text-[#14264F]">{selectedUser.full_name || 'Colaborador sin nombre'}</h2>
            <p className="mt-2 text-sm text-slate-500">Acceso creado desde {formatDate(selectedUser.created_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#0EA5E9]/10 px-3 py-1 text-xs font-black text-[#1E40AF] ring-1 ring-sky-500/20">{roleLabel(selectedUser.role)}</span>
              <span className="rounded-full bg-[#14264F]/5 px-3 py-1 text-xs font-black text-[#1E40AF] ring-1 ring-violet-500/20">{positionLabel(selectedUser.position)}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${selectedUser.status === 'inactive' ? 'bg-red-500/10 text-red-300 ring-red-500/20' : 'bg-[#14264F]/10 text-[#0EA5E9] ring-emerald-500/20'}`}>{statusLabel(selectedUser.status)}</span>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Contacto</p>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-3 text-slate-600"><Mail className="h-4 w-4 text-[#1E40AF]" /> {selectedUser.email || 'Sin correo'}</p>
                <p className="flex items-center gap-3 text-slate-600"><Phone className="h-4 w-4 text-[#0EA5E9]" /> {selectedUser.phone || 'Sin WhatsApp'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Rol y acceso</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><p className="text-slate-500">Rol</p><p className="font-bold text-[#14264F]">{roleLabel(selectedUser.role)}</p></div>
                <div><p className="text-slate-500">Puesto</p><p className="font-bold text-[#14264F]">{positionLabel(selectedUser.position)}</p></div>
                <div><p className="text-slate-500">Estado</p><p className="font-bold text-[#14264F]">{statusLabel(selectedUser.status)}</p></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (mode.type === 'edit' && selectedUser) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setMode({ type: 'detail', userId: selectedUser.id })} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver al perfil
        </button>

        <form action={updateAction} className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="profile_id" value={selectedUser.id} />
          <div className="md:col-span-2 xl:col-span-3">
            <p className="badge-accent inline-flex">Editar colaborador</p>
            <h2 className="mt-3 text-2xl font-black text-[#14264F]">{selectedUser.full_name || 'Colaborador'}</h2>
            <p className="mt-2 text-sm text-slate-500">Actualiza sus datos, rol o contraseña opcional.</p>
          </div>
          <input name="full_name" className="input" defaultValue={selectedUser.full_name || ''} placeholder="Nombre completo" required />
          <input name="email" className="input" type="email" defaultValue={selectedUser.email || ''} placeholder="Correo" required />
          <input name="password" className="input" type="password" placeholder="Nueva contraseña opcional" minLength={6} />
          <input name="phone" className="input" defaultValue={selectedUser.phone || ''} placeholder="WhatsApp" />
          <select name="role" className="input" defaultValue={selectedUser.role || 'collaborator'}>
            <option value="collaborator">Colaborador</option>
            <option value="tour_leader">Tour Leader</option>
          </select>
          <select name="position" className="input" defaultValue={selectedUser.position || 'Guía'}>
            {POSITION_OPTIONS.map((position) => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
          <select name="status" className="input" defaultValue={selectedUser.status || 'active'}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
          <div className="md:col-span-2 xl:col-span-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMode({ type: 'detail', userId: selectedUser.id })} className="btn-secondary">Cancelar</button>
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
            <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Equipo</p>
            <h2 className="mt-1 text-2xl font-black text-[#14264F]">Lista de colaboradores</h2>
            <p className="mt-2 text-sm text-slate-500">Busca, revisa, edita o elimina colaboradores y tour leaders.</p>
          </div>
          <button type="button" onClick={() => setMode({ type: 'create' })} className="btn-primary w-full sm:w-fit">
            <Plus className="mr-2 inline h-4 w-4" /> Crear nuevo colaborador
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#14264F] outline-none placeholder:text-slate-600"
            placeholder="Buscar por nombre, correo, WhatsApp o rol..."
          />
        </div>
      </section>

      <section className="card overflow-hidden mobile-compact-list">
        <div className="hidden grid-cols-[1.35fr_1fr_130px_140px_110px_250px] gap-4 border-b border-slate-200 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 lg:grid">
          <span>Colaborador</span>
          <span>Contacto</span>
          <span>Rol</span>
          <span>Puesto</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>

        {!filteredCollaborators.length ? (
          <div className="p-8 text-center">
            <UserCog className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-lg font-black text-[#14264F]">No hay colaboradores</h3>
            <p className="mt-2 text-sm text-slate-500">Crea uno nuevo o busca con otro término.</p>
          </div>
        ) : null}

        <div className="divide-y divide-[#1e293b]">
          {filteredCollaborators.map((user) => (
            <article key={user.id} className="mobile-compact-row grid gap-4 p-5 transition hover:bg-slate-50/45 lg:grid-cols-[1.35fr_1fr_130px_140px_110px_250px] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0EA5E9]/10 text-[#1E40AF] ring-1 ring-sky-500/20">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-[#14264F]">{user.full_name || 'Colaborador sin nombre'}</h3>
                    <p className="truncate text-xs font-semibold text-slate-500">Creado: {formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="mobile-list-secondary text-sm text-slate-600">
                <p className="truncate font-semibold">{user.email || 'Sin correo'}</p>
                <p className="mt-1 truncate text-slate-500">{user.phone || 'Sin WhatsApp'}</p>
              </div>
              <div className="mobile-list-extra">
                <span className="rounded-full bg-[#0EA5E9]/10 px-3 py-1 text-xs font-black text-[#1E40AF] ring-1 ring-sky-500/20">
                  {roleLabel(user.role)}
                </span>
              </div>
              <div className="mobile-list-position">
                <span className="rounded-full bg-[#14264F]/5 px-3 py-1 text-xs font-black text-[#1E40AF] ring-1 ring-violet-500/20">
                  {positionLabel(user.position)}
                </span>
              </div>
              <div className="mobile-list-status">
                <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${user.status === 'inactive' ? 'bg-red-500/10 text-red-300 ring-red-500/20' : 'bg-[#14264F]/10 text-[#0EA5E9] ring-emerald-500/20'}`}>
                  {statusLabel(user.status)}
                </span>
              </div>
              <div className="mobile-card-actions flex flex-col gap-2 sm:flex-row lg:justify-end">
                <button type="button" onClick={() => setMode({ type: 'detail', userId: user.id })} className="btn-secondary py-2.5">
                  <Eye className="mr-2 inline h-4 w-4" /> Ver
                </button>
                <button type="button" onClick={() => setMode({ type: 'edit', userId: user.id })} className="btn-secondary py-2.5">
                  <Pencil className="mr-2 inline h-4 w-4" /> Editar
                </button>
                <DeleteCollaboratorButton user={user} action={deleteAction} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
