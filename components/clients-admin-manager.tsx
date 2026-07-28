'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BadgeDollarSign, CheckCircle2, Clock3, Eye, Mail, MessageSquareText, Pencil, Phone, Plus, Search, Trash2, UserRound } from 'lucide-react'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  status: string | null
  created_at?: string | null
}


type ClientProposalAssignment = {
  id: string
  note?: string | null
  proposal_status?: string | null
  version_number?: number | null
  requested_changes?: string | null
  rejection_reason?: string | null
  created_at?: string | null
  sent_at?: string | null
  responded_at?: string | null
  accepted_at?: string | null
  itineraries?: { id: string; title: string | null } | null
}

type ClientItem = {
  id: string
  profile_id: string
  country: string | null
  passport_number: string | null
  notes_internal?: string | null
  travel_needs?: string | null
  lifecycle_status?: string | null
  proposal_status?: string | null
  rejection_reason?: string | null
  payment_status?: string | null
  payment_method?: string | null
  payment_provider?: string | null
  payment_amount?: number | null
  payment_currency?: string | null
  payment_reference?: string | null
  created_at?: string | null
  profiles: Profile | null
  client_itineraries?: ClientProposalAssignment[] | null
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

function lifecycleLabel(status?: string | null) {
  if (status === 'client') return 'Cliente'
  return 'Prospecto'
}

function proposalLabel(status?: string | null) {
  const labels: Record<string, string> = {
    new: 'Nuevo',
    needs_registered: 'Necesidades registradas',
    proposal_created: 'Propuesta creada',
    internal_review: 'Revisión interna',
    proposal_sent: 'Propuesta enviada',
    changes_requested: 'Solicita cambios',
    version_replaced: 'Nueva versión enviada',
    rejected: 'Rechazado',
    accepted: 'Aceptado',
    payment_registered: 'Pago registrado',
    documents_requested: 'Documentos solicitados',
    reservations_confirmed: 'Reservas confirmadas',
    collaborators_assigned: 'Equipo asignado',
    operating: 'En operación',
    completed: 'Viaje completado',
    review_requested: 'Reseña solicitada',
    closed: 'Expediente cerrado',
  }
  return labels[status || 'new'] || 'Nuevo'
}

function paymentLabel(status?: string | null) {
  if (status === 'confirmed') return 'Pago confirmado'
  if (status === 'partial') return 'Pago parcial'
  return 'Pago pendiente'
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
        if (!confirm('¿Seguro que deseas eliminar este prospecto/cliente? También se eliminará su acceso.')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="client_id" value={client.id} />
      <input type="hidden" name="profile_id" value={client.profile_id} />
      <button className="btn-danger w-full py-2.5 sm:w-auto" title="Eliminar">
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
  createVersionAction,
}: {
  clients: ClientItem[]
  createAction: ActionFn
  updateAction: ActionFn
  deleteAction: ActionFn
  createVersionAction: ActionFn
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
        client.travel_needs,
        client.lifecycle_status,
        client.proposal_status,
        client.payment_status,
        ...(client.client_itineraries || []).flatMap((assignment) => [assignment.requested_changes, assignment.rejection_reason, assignment.note, assignment.itineraries?.title]),
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
        <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary w-fit">
          <ArrowLeft className="mr-2 inline h-4 w-4" /> Volver a prospectos
        </button>

        <form action={createAction} className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <p className="badge-brand inline-flex">Nuevo prospecto</p>
            <h2 className="mt-3 text-2xl font-black text-[#14264F]">Registrar prospecto con acceso</h2>
            <p className="mt-2 text-sm text-slate-500">Primero es prospecto. Si acepta la propuesta, el sistema lo convierte en cliente.</p>
          </div>
          <input name="full_name" className="input" placeholder="Usuario / nombre completo" required />
          <input name="email" className="input" type="email" placeholder="Correo electrónico" required />
          <input name="password" className="input" type="password" placeholder="Contraseña" minLength={6} required />
          <input name="phone" className="input" placeholder="WhatsApp" />
          <input name="country" className="input" placeholder="País" />
          <input name="passport_number" className="input" placeholder="Pasaporte opcional" />
          <textarea name="travel_needs" className="input min-h-28 md:col-span-2 xl:col-span-3" placeholder="Necesidades del viaje: fechas, cantidad de pasajeros, tipo de servicio, hotel, intereses, presupuesto..." />
          <div className="md:col-span-2 xl:col-span-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMode({ type: 'list' })} className="btn-secondary">Cancelar</button>
            <button className="btn-primary">Crear prospecto</button>
          </div>
        </form>
      </div>
    )
  }

  if (mode.type === 'detail' && selectedClient) {
    const profile = selectedClient.profiles
    const isClient = selectedClient.lifecycle_status === 'client'
    const proposalResponses = (selectedClient.client_itineraries || [])
      .filter((assignment) => assignment.requested_changes || assignment.rejection_reason || assignment.proposal_status === 'accepted')
      .sort((a, b) => new Date(b.responded_at || b.accepted_at || b.created_at || '').getTime() - new Date(a.responded_at || a.accepted_at || a.created_at || '').getTime())
    const pendingChangeRequests = proposalResponses.filter((assignment) => assignment.proposal_status === 'changes_requested' && assignment.requested_changes)
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

        {pendingChangeRequests.length ? (
          <section className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5 shadow-[0_0_40px_rgba(251,191,36,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-200 ring-1 ring-amber-400/25">
                  <MessageSquareText className="h-3.5 w-3.5" /> Solicitud de cambios pendiente
                </p>
                <h3 className="mt-3 text-xl font-black text-[#14264F]">El prospecto pidió modificar la propuesta</h3>
                <p className="mt-1 text-sm font-semibold text-amber-100/80">Revisa el mensaje, abre una copia editable del itinerario, modifica lo necesario y recién al guardar se enviará la nueva versión.</p>
              </div>
              <button type="button" onClick={() => setMode({ type: 'edit', clientId: selectedClient.id })} className="btn-secondary shrink-0">
                Actualizar estado
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {pendingChangeRequests.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-amber-400/20 bg-white/80 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-200">
                    <span>{assignment.itineraries?.title || 'Itinerario enviado'}</span>
                    <span className="rounded-full bg-[#14264F]/5 px-2 py-1 text-[#1E40AF] ring-1 ring-violet-500/20">Versión {assignment.version_number || 1}</span>
                    <span className="inline-flex items-center gap-1 text-slate-500 normal-case tracking-normal"><Clock3 className="h-3 w-3" /> {formatDate(assignment.responded_at || assignment.created_at)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-900">{assignment.requested_changes}</p>
                  <form action={createVersionAction} className="mt-4 rounded-2xl border border-[#14264F]/10 bg-[#14264F]/10 p-3">
                    <input type="hidden" name="client_id" value={selectedClient.id} />
                    <input type="hidden" name="assignment_id" value={assignment.id} />
                    <label className="text-xs font-black uppercase tracking-widest text-[#0EA5E9]">Mensaje para el prospecto</label>
                    <textarea
                      name="admin_note"
                      className="input mt-2 min-h-20"
                      defaultValue={`Hola, revisamos tus cambios y te enviamos una nueva versión de la propuesta ${assignment.itineraries?.title ? `para ${assignment.itineraries.title}` : ''}.`}
                    />
                    <textarea
                      name="change_notes"
                      className="input mt-2 min-h-20"
                      placeholder="Notas internas de esta versión: qué se cambió, hotel, fechas, servicios, precio..."
                      defaultValue={assignment.requested_changes || ''}
                    />
                    <button className="btn-primary mt-3 w-full sm:w-auto">Crear versión editable</button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="card overflow-hidden mobile-compact-list">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-[#0b1220] to-violet-500/10 p-6">
            <p className="badge-brand inline-flex">{lifecycleLabel(selectedClient.lifecycle_status)}</p>
            <h2 className="mt-3 text-2xl font-black text-[#14264F] sm:text-3xl">{profile?.full_name || 'Prospecto sin nombre'}</h2>
            <p className="mt-2 text-sm text-slate-500">Registrado desde {formatDate(selectedClient.created_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#14264F]/10 px-3 py-1 text-xs font-black text-[#0EA5E9] ring-1 ring-emerald-500/20">{statusLabel(profile?.status)}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${isClient ? 'bg-[#0EA5E9]/10 text-[#1E40AF] ring-sky-500/20' : 'bg-[#14264F]/5 text-[#1E40AF] ring-violet-500/20'}`}>{lifecycleLabel(selectedClient.lifecycle_status)}</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">{proposalLabel(selectedClient.proposal_status)}</span>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Contacto</p>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-3 text-slate-600"><Mail className="h-4 w-4 text-[#1E40AF]" /> {profile?.email || 'Sin correo'}</p>
                <p className="flex items-center gap-3 text-slate-600"><Phone className="h-4 w-4 text-[#0EA5E9]" /> {profile?.phone || 'Sin WhatsApp'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Datos de viaje</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><p className="text-slate-500">País</p><p className="font-bold text-[#14264F]">{selectedClient.country || 'No registrado'}</p></div>
                <div><p className="text-slate-500">Pasaporte</p><p className="font-bold text-[#14264F]">{selectedClient.passport_number || 'No registrado'}</p></div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Necesidades del viaje</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{selectedClient.travel_needs || 'Todavía no se registraron necesidades.'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Respuestas del prospecto</p>
              {proposalResponses.length ? (
                <div className="mt-4 space-y-3">
                  {proposalResponses.map((assignment) => {
                    const status = assignment.proposal_status || 'sent'
                    const isChanges = status === 'changes_requested'
                    const isRejected = status === 'rejected'
                    const message = assignment.requested_changes || assignment.rejection_reason || (status === 'accepted' ? 'El prospecto aceptó la propuesta.' : '')
                    return (
                      <div key={assignment.id} className={`rounded-2xl border p-4 ${isChanges ? 'border-amber-400/25 bg-amber-400/10' : isRejected ? 'border-red-500/25 bg-red-500/10' : 'border-[#14264F]/10 bg-[#14264F]/10'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${isChanges ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25' : isRejected ? 'bg-red-500/15 text-red-200 ring-1 ring-red-500/25' : 'bg-[#14264F]/15 text-[#0EA5E9] ring-1 ring-emerald-500/25'}`}>{proposalLabel(status)}</span>
                          <span className="text-xs font-bold text-slate-500">{assignment.itineraries?.title || 'Itinerario enviado'} · Versión {assignment.version_number || 1}</span>
                          <span className="text-xs font-semibold text-slate-600">{formatDate(assignment.responded_at || assignment.accepted_at || assignment.created_at)}</span>
                        </div>
                        {message ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-900">{message}</p> : null}
                        {assignment.note ? <p className="mt-3 text-xs font-semibold text-slate-500">Nota enviada: {assignment.note}</p> : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-500">Aún no hay respuestas del prospecto sobre las propuestas enviadas.</p>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pago / compromiso</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-slate-500">Estado</p><p className="font-bold text-[#14264F]">{paymentLabel(selectedClient.payment_status)}</p></div>
                <div><p className="text-slate-500">Monto</p><p className="font-bold text-[#14264F]">{selectedClient.payment_amount ? `${selectedClient.payment_currency || 'USD'} ${selectedClient.payment_amount}` : 'Sin monto'}</p></div>
                <div><p className="text-slate-500">Método</p><p className="font-bold text-[#14264F]">{selectedClient.payment_method || 'Pendiente'}</p></div>
                <div><p className="text-slate-500">Proveedor</p><p className="font-bold text-[#14264F]">{selectedClient.payment_provider || 'Manual'}</p></div>
              </div>
              {selectedClient.payment_reference ? <p className="mt-3 text-xs font-semibold text-slate-500">Referencia: {selectedClient.payment_reference}</p> : null}
            </div>
            {selectedClient.rejection_reason ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-widest text-red-300">Motivo de rechazo</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-red-100">{selectedClient.rejection_reason}</p>
              </div>
            ) : null}
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
            <p className="badge-accent inline-flex">Editar expediente</p>
            <h2 className="mt-3 text-2xl font-black text-[#14264F]">{profile?.full_name || 'Prospecto'}</h2>
            <p className="mt-2 text-sm text-slate-500">Controla el flujo comercial: propuesta, aceptación, pago, operación y cierre.</p>
          </div>
          {(selectedClient.client_itineraries || []).some((assignment) => assignment.requested_changes || assignment.rejection_reason) ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 md:col-span-2 xl:col-span-3">
              <p className="text-xs font-black uppercase tracking-widest text-amber-200">Mensajes recibidos del prospecto</p>
              <div className="mt-3 space-y-2">
                {(selectedClient.client_itineraries || []).filter((assignment) => assignment.requested_changes || assignment.rejection_reason).map((assignment) => (
                  <p key={assignment.id} className="whitespace-pre-line rounded-xl bg-white/70 p-3 text-sm text-slate-900">
                    <span className="block text-xs font-black uppercase tracking-widest text-slate-500">{assignment.itineraries?.title || 'Itinerario'} · {proposalLabel(assignment.proposal_status)}</span>
                    {assignment.requested_changes || assignment.rejection_reason}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          <input name="full_name" className="input" defaultValue={profile?.full_name || ''} placeholder="Nombre completo" required />
          <input name="email" className="input" type="email" defaultValue={profile?.email || ''} placeholder="Correo" required />
          <input name="password" className="input" type="password" placeholder="Nueva contraseña opcional" minLength={6} />
          <input name="phone" className="input" defaultValue={profile?.phone || ''} placeholder="WhatsApp" />
          <input name="country" className="input" defaultValue={selectedClient.country || ''} placeholder="País" />
          <input name="passport_number" className="input" defaultValue={selectedClient.passport_number || ''} placeholder="Pasaporte" />
          <select name="lifecycle_status" className="input" defaultValue={selectedClient.lifecycle_status || 'prospect'}>
            <option value="prospect">Prospecto</option>
            <option value="client">Cliente</option>
          </select>
          <select name="proposal_status" className="input" defaultValue={selectedClient.proposal_status || 'new'}>
            <option value="new">Nuevo prospecto</option>
            <option value="needs_registered">Necesidades registradas</option>
            <option value="proposal_created">Itinerario y cotización creada</option>
            <option value="internal_review">Revisión interna</option>
            <option value="proposal_sent">Propuesta enviada</option>
            <option value="changes_requested">Solicita cambios</option>
            <option value="rejected">Rechazado</option>
            <option value="accepted">Aceptado</option>
            <option value="payment_registered">Pago o compromiso registrado</option>
            <option value="documents_requested">Documentos solicitados</option>
            <option value="reservations_confirmed">Reservas confirmadas</option>
            <option value="collaborators_assigned">Colaboradores asignados</option>
            <option value="operating">Ejecutando itinerario</option>
            <option value="completed">Viaje completado</option>
            <option value="review_requested">Opinión / reseña solicitada</option>
            <option value="closed">Expediente cerrado</option>
          </select>
          <select name="payment_status" className="input" defaultValue={selectedClient.payment_status || 'pending'}>
            <option value="pending">Pago pendiente</option>
            <option value="partial">Pago parcial</option>
            <option value="confirmed">Pago confirmado</option>
          </select>
          <select name="payment_method" className="input" defaultValue={selectedClient.payment_method || ''}>
            <option value="">Método de pago</option>
            <option value="card">Tarjeta</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="commitment">Compromiso de pago</option>
          </select>
          <select name="payment_provider" className="input" defaultValue={selectedClient.payment_provider || ''}>
            <option value="">Proveedor / pasarela</option>
            <option value="culqi">Culqi</option>
            <option value="izipay">Izipay</option>
            <option value="niubiz">Niubiz</option>
            <option value="manual">Manual / efectivo</option>
          </select>
          <input name="payment_amount" className="input" type="number" step="0.01" min="0" defaultValue={selectedClient.payment_amount || ''} placeholder="Monto recibido" />
          <select name="payment_currency" className="input" defaultValue={selectedClient.payment_currency || 'USD'}>
            <option value="USD">USD</option>
            <option value="PEN">PEN</option>
          </select>
          <input name="payment_reference" className="input" defaultValue={selectedClient.payment_reference || ''} placeholder="Referencia / operación / nota" />
          <select name="status" className="input" defaultValue={profile?.status || 'active'}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
          <textarea name="travel_needs" className="input min-h-28 md:col-span-2 xl:col-span-3" defaultValue={selectedClient.travel_needs || ''} placeholder="Necesidades del viaje" />
          <textarea name="rejection_reason" className="input min-h-24 md:col-span-2 xl:grid-cols-3 xl:col-span-3" defaultValue={selectedClient.rejection_reason || ''} placeholder="Motivo del rechazo si aplica" />
          <textarea name="notes_internal" className="input min-h-24 md:col-span-2 xl:col-span-3" defaultValue={selectedClient.notes_internal || ''} placeholder="Notas internas" />
          <div className="md:col-span-2 xl:col-span-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMode({ type: 'detail', clientId: selectedClient.id })} className="btn-secondary">Cancelar</button>
            <button className="btn-primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    )
  }

  const prospectCount = clients.filter((client) => client.lifecycle_status !== 'client').length
  const customerCount = clients.filter((client) => client.lifecycle_status === 'client').length

  return (
    <div className="space-y-6">
      <section className="card hidden p-5 sm:p-6 lg:block">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Prospectos y clientes</p>
            <h2 className="mt-1 text-2xl font-black text-[#14264F]">Pipeline comercial</h2>
            <p className="mt-2 text-sm text-slate-500">Registra necesidades, envía propuestas, controla respuesta y confirma pagos.</p>
          </div>
          <button type="button" onClick={() => setMode({ type: 'create' })} className="btn-primary w-full sm:w-fit">
            <Plus className="mr-2 inline h-4 w-4" /> Crear prospecto
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{prospectCount}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Prospectos</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{customerCount}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Clientes</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-black text-[#14264F]">{clients.filter((c) => c.payment_status === 'confirmed').length}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pagos confirmados</p></div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#14264F] outline-none placeholder:text-slate-600"
            placeholder="Buscar por nombre, correo, estado, país, necesidades..."
          />
        </div>
      </section>

      <section className="card overflow-hidden mobile-compact-list">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_120px_260px] gap-4 border-b border-slate-200 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 lg:grid">
          <span>Prospecto / cliente</span>
          <span>Contacto</span>
          <span>Flujo</span>
          <span>Pago</span>
          <span className="text-right">Acciones</span>
        </div>

        {!filteredClients.length ? (
          <div className="p-8 text-center">
            <UserRound className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-lg font-black text-[#14264F]">No hay prospectos</h3>
            <p className="mt-2 text-sm text-slate-500">Crea o busca con otro término.</p>
          </div>
        ) : null}

        <div className="divide-y divide-[#1e293b]">
          {filteredClients.map((client) => {
            const profile = client.profiles
            const isClient = client.lifecycle_status === 'client'
            const proposal = client.proposal_status || 'new'
            return (
              <article key={client.id} className="mobile-compact-row grid gap-4 p-4 transition hover:bg-slate-50/45 lg:grid-cols-[1.4fr_1fr_1fr_120px_260px] lg:items-center lg:p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isClient ? 'bg-[#0EA5E9]/10 text-[#1E40AF] ring-sky-500/20' : 'bg-[#14264F]/5 text-[#1E40AF] ring-violet-500/20'} ring-1`}>
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-[#14264F] sm:text-base">{profile?.full_name || 'Sin nombre'}</h3>
                      <p className="truncate text-[11px] font-semibold text-slate-500">{lifecycleLabel(client.lifecycle_status)} · {proposalLabel(proposal)}</p>
                      {(client.client_itineraries || []).some((assignment) => assignment.proposal_status === 'changes_requested' && assignment.requested_changes) ? (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-200 ring-1 ring-amber-400/20"><MessageSquareText className="h-3 w-3" /> Ver cambios</p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mobile-list-secondary text-sm text-slate-600">
                  <p className="truncate font-semibold">{profile?.email || 'Sin correo'}</p>
                  <p className="mt-1 truncate text-slate-500">{profile?.phone || 'Sin WhatsApp'}</p>
                </div>
                <div className="mobile-list-extra text-sm text-slate-600">
                  <p className="truncate font-semibold">{client.country || 'Sin país'}</p>
                  <p className="mt-1 truncate text-slate-500">{client.travel_needs || 'Sin necesidades registradas'}</p>
                </div>
                <div className="mobile-list-status">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ring-1 ${client.payment_status === 'confirmed' ? 'bg-[#14264F]/10 text-[#0EA5E9] ring-emerald-500/20' : 'bg-slate-500/10 text-slate-600 ring-slate-500/20'}`}>
                    {client.payment_status === 'confirmed' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <BadgeDollarSign className="mr-1 h-3 w-3" />}{paymentLabel(client.payment_status)}
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
