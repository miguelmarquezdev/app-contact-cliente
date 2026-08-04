'use client'

import { useMemo, useState } from 'react'
import { Loader2, Send, X } from 'lucide-react'

type ClientOption = {
  id: string
  lifecycle_status?: string | null
  proposal_status?: string | null
  profiles: { full_name: string | null; email: string | null } | null
}

type Assignment = {
  id: string
  note: string | null
  proposal_status?: string | null
  version_number?: number | null
  clients: { id: string; lifecycle_status?: string | null; proposal_status?: string | null; profiles: { full_name: string | null; email: string | null } | null } | { id: string; lifecycle_status?: string | null; proposal_status?: string | null; profiles: { full_name: string | null; email: string | null } | null }[] | null
}

type Props = {
  itineraryId: string
  clients: ClientOption[]
  initialAssignments?: Assignment[] | null
}

function normalizeClient(client: Assignment['clients']) {
  return Array.isArray(client) ? client[0] || null : client || null
}

function clientLabel(client: Assignment['clients']) {
  const value = normalizeClient(client)
  return value?.profiles?.full_name || value?.profiles?.email || 'Prospecto'
}

export function ItineraryProposalPanel({ itineraryId, clients, initialAssignments = [] }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments || [])
  const [clientId, setClientId] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [removingId, setRemovingId] = useState('')

  const assignedClientIds = useMemo(() => new Set(assignments.map((item) => normalizeClient(item.clients)?.id).filter(Boolean)), [assignments])
  const availableClients = clients.filter((client) => !assignedClientIds.has(client.id))

  const sendProposal = () => {
    if (!clientId) {
      setError('Selecciona un prospecto o cliente')
      return
    }

    setError('')
    setMessage('')
    setSending(true)
    ;(async () => {
      try {
        const response = await fetch('/api/itineraries/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itinerary_id: itineraryId, client_id: clientId, note })
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || 'No se pudo enviar la propuesta')

        setAssignments((current) => {
          const next = current.filter((item) => item.id !== payload.assignment.id)
          return [payload.assignment, ...next]
        })
        setClientId('')
        setNote('')
        setMessage('Propuesta enviada sin recargar la página')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al enviar')
      } finally {
        setSending(false)
      }
    })()
  }

  const removeAssignment = (assignmentId: string) => {
    setError('')
    setMessage('')
    setRemovingId(assignmentId)
    ;(async () => {
      try {
        const response = await fetch('/api/itineraries/remove-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignment_id: assignmentId })
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || 'No se pudo quitar la propuesta')

        setAssignments((current) => current.filter((item) => item.id !== assignmentId))
        setMessage('Propuesta quitada')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al quitar')
      } finally {
        setRemovingId('')
      }
    })()
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1E40AF]">
        <Send className="h-4 w-4" /> Enviar propuesta
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="input" required>
          <option value="">Seleccionar prospecto</option>
          {availableClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.profiles?.full_name || client.profiles?.email || 'Prospecto sin nombre'} — {client.lifecycle_status === 'client' ? 'Cliente' : 'Prospecto'}
            </option>
          ))}
        </select>
        <input value={note} onChange={(event) => setNote(event.target.value)} className="input" placeholder="Nota opcional para el prospecto" />
        <button type="button" onClick={sendProposal} disabled={sending || Boolean(removingId)} className="btn-primary min-w-[130px]">
          {sending ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</span>
          ) : 'Enviar'}
        </button>
      </div>

      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p> : null}
      {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{message}</p> : null}

      {assignments.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-100">
              <span>{clientLabel(assignment.clients)}</span>
              <button type="button" onClick={() => removeAssignment(assignment.id)} disabled={sending || Boolean(removingId)} className="inline-flex items-center gap-1 text-red-600">
                {removingId === assignment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                {removingId === assignment.id ? 'Quitando...' : 'Quitar'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-slate-500">Aún no fue enviado a ningún prospecto.</p>
      )}
    </div>
  )
}
