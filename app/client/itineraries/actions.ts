'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

async function getCurrentClientId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, clientId: null }
  const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
  return { supabase, clientId: client?.id || null }
}

export async function requestProposalChanges(formData: FormData) {
  const { supabase, clientId } = await getCurrentClientId()
  const assignmentId = clean(formData.get('assignment_id'))
  const message = clean(formData.get('message'))

  if (!clientId || !assignmentId || !message) redirect('/client/itineraries?error=Escribe qué cambios necesitas')

  await supabase
    .from('client_itineraries')
    .update({ proposal_status: 'changes_requested', requested_changes: message, responded_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('client_id', clientId)

  await supabase
    .from('clients')
    .update({ proposal_status: 'changes_requested', lifecycle_status: 'prospect', updated_at: new Date().toISOString() })
    .eq('id', clientId)

  revalidatePath('/client/itineraries')
  redirect('/client/itineraries?success=Cambios enviados a la agencia')
}

export async function rejectProposal(formData: FormData) {
  const { supabase, clientId } = await getCurrentClientId()
  const assignmentId = clean(formData.get('assignment_id'))
  const reason = clean(formData.get('reason'))

  if (!clientId || !assignmentId || !reason) redirect('/client/itineraries?error=Escribe el motivo del rechazo')

  await supabase
    .from('client_itineraries')
    .update({ proposal_status: 'rejected', rejection_reason: reason, responded_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('client_id', clientId)

  await supabase
    .from('clients')
    .update({ proposal_status: 'rejected', lifecycle_status: 'prospect', rejection_reason: reason, rejected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', clientId)

  revalidatePath('/client/itineraries')
  redirect('/client/itineraries?success=Respuesta registrada')
}

export async function acceptProposal(formData: FormData) {
  const { supabase, clientId } = await getCurrentClientId()
  const assignmentId = clean(formData.get('assignment_id'))
  const paymentMethod = clean(formData.get('payment_method')) || 'commitment'

  if (!clientId || !assignmentId) redirect('/client/itineraries?error=No se pudo aceptar la propuesta')

  await supabase
    .from('client_itineraries')
    .update({ proposal_status: 'accepted', accepted_at: new Date().toISOString(), responded_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('client_id', clientId)

  await supabase
    .from('clients')
    .update({
      proposal_status: 'accepted',
      lifecycle_status: 'client',
      payment_status: paymentMethod === 'commitment' ? 'pending' : 'partial',
      payment_method: paymentMethod,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  revalidatePath('/client/itineraries')
  revalidatePath('/client/dashboard')
  redirect('/client/itineraries?success=Propuesta aceptada. Ya figuras como cliente.')
}
