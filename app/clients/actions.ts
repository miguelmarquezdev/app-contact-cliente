'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

function goWithError(message: string) {
  redirect(`/clients?error=${encodeURIComponent(message)}`)
}

const DEFAULT_OPERATION_TASKS = [
  'Crear expediente operativo del viaje',
  'Solicitar documentos finales del cliente',
  'Confirmar reservas de hoteles y servicios',
  'Confirmar tickets, trenes o ingresos necesarios',
  'Asignar guía, conductor y colaboradores',
  'Abrir chats operativos con el equipo asignado',
  'Revisar checklist final antes de la operación'
]

async function ensureOperationTasks(supabaseAdmin: ReturnType<typeof createAdminClient>, clientId: string, createdBy?: string | null) {
  const { count } = await supabaseAdmin
    .from('operation_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)

  if ((count || 0) > 0) return

  await supabaseAdmin.from('operation_tasks').insert(
    DEFAULT_OPERATION_TASKS.map((title, index) => ({
      client_id: clientId,
      title,
      priority: index <= 1 ? 'high' : 'normal',
      status: 'pending',
      created_by: createdBy || null,
    }))
  )
}

export async function createClientRecord(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const full_name = clean(formData.get('full_name'))
  const email = clean(formData.get('email')).toLowerCase()
  const password = clean(formData.get('password'))
  const phone = clean(formData.get('phone'))
  const country = clean(formData.get('country'))
  const passport_number = clean(formData.get('passport_number'))
  const travel_needs = clean(formData.get('travel_needs'))

  if (!full_name || !email || !password) {
    redirect('/clients?error=Faltan nombre, correo o contraseña')
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: 'client'
    }
  })

  if (userError || !userData.user) {
    redirect(`/clients?error=${encodeURIComponent(userError?.message || 'No se pudo crear el usuario')}`)
  }

  const userId = userData.user.id

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    full_name,
    email,
    phone,
    role: 'client',
    status: 'active'
  })

  if (profileError) {
    redirect(`/clients?error=${encodeURIComponent(profileError.message)}`)
  }

  const { error: clientError } = await supabaseAdmin.from('clients').insert({
    profile_id: userId,
    country,
    passport_number,
    travel_needs,
    lifecycle_status: 'prospect',
    proposal_status: travel_needs ? 'needs_registered' : 'new',
    payment_status: 'pending',
    payment_currency: 'USD',
    reservation_policy_accepted: false,
    operation_stage: 'commercial'
  })

  if (clientError) {
    redirect(`/clients?error=${encodeURIComponent(clientError.message)}`)
  }

  revalidatePath('/clients')
  redirect('/clients?success=Prospecto creado con acceso')
}

export async function updateClientRecord(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const clientId = clean(formData.get('client_id'))
  const profileId = clean(formData.get('profile_id'))
  const full_name = clean(formData.get('full_name'))
  const email = clean(formData.get('email')).toLowerCase()
  const password = clean(formData.get('password'))
  const phone = clean(formData.get('phone'))
  const country = clean(formData.get('country'))
  const passport_number = clean(formData.get('passport_number'))
  const travel_needs = clean(formData.get('travel_needs'))
  const notes_internal = clean(formData.get('notes_internal'))
  const rejection_reason = clean(formData.get('rejection_reason'))
  const lifecycle_status = clean(formData.get('lifecycle_status')) || 'prospect'
  const proposal_status = clean(formData.get('proposal_status')) || 'new'
  const payment_status = clean(formData.get('payment_status')) || 'pending'
  const payment_method = clean(formData.get('payment_method'))
  const payment_provider = clean(formData.get('payment_provider'))
  const payment_amount_raw = clean(formData.get('payment_amount'))
  const payment_amount = payment_amount_raw ? Number(payment_amount_raw) : null
  const payment_currency = clean(formData.get('payment_currency')) || 'USD'
  const payment_reference = clean(formData.get('payment_reference'))
  const reservation_policy_accepted = formData.get('reservation_policy_accepted') === 'on'
  const status = clean(formData.get('status')) || 'active'

  if (!clientId || !profileId || !full_name || !email) {
    redirect('/clients?error=Faltan datos para actualizar el cliente')
  }

  const authUpdate: { email: string; password?: string; user_metadata: { full_name: string; role: string } } = {
    email,
    user_metadata: { full_name, role: 'client' }
  }

  if (password) authUpdate.password = password

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profileId, authUpdate)
  if (authError) goWithError(authError.message)

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name, email, phone, status })
    .eq('id', profileId)

  if (profileError) goWithError(profileError.message)

  const canConvertToClient =
    lifecycle_status === 'client' ||
    (
      reservation_policy_accepted &&
      payment_status === 'confirmed' &&
      ['accepted', 'payment_registered', 'documents_requested', 'reservations_confirmed', 'collaborators_assigned', 'operating', 'completed'].includes(proposal_status)
    )

  const nextLifecycleStatus = canConvertToClient ? 'client' : 'prospect'
  const nextProposalStatus = canConvertToClient && proposal_status === 'accepted' ? 'payment_registered' : proposal_status
  const now = new Date().toISOString()

  const { error: clientError } = await supabaseAdmin
    .from('clients')
    .update({
      country,
      passport_number,
      travel_needs,
      notes_internal,
      rejection_reason,
      lifecycle_status: nextLifecycleStatus,
      proposal_status: nextProposalStatus,
      payment_status,
      payment_method,
      payment_provider,
      payment_amount,
      payment_currency,
      payment_reference,
      reservation_policy_accepted,
      operation_stage: nextLifecycleStatus === 'client' ? (nextProposalStatus === 'operating' ? 'operating' : nextProposalStatus === 'completed' ? 'completed' : 'preparation') : 'commercial',
      accepted_at: nextLifecycleStatus === 'client' ? now : null,
      file_created_at: nextLifecycleStatus === 'client' ? now : null,
      operation_started_at: nextLifecycleStatus === 'client' ? now : null,
      rejected_at: proposal_status === 'rejected' ? now : null,
      updated_at: now,
    })
    .eq('id', clientId)

  if (clientError) goWithError(clientError.message)

  if (canConvertToClient) {
    await ensureOperationTasks(supabaseAdmin, clientId, profileId)
  }

  if (payment_status !== 'pending' && payment_amount && payment_amount > 0) {
    await supabaseAdmin.from('payments').insert({
      client_id: clientId,
      amount: payment_amount,
      currency: payment_currency,
      method: payment_method || 'manual',
      provider: payment_provider || 'manual',
      status: payment_status,
      reference: payment_reference,
      notes: notes_internal,
      registered_by: profileId,
    })
  }

  revalidatePath('/clients')
  redirect('/clients?success=Expediente actualizado')
}

export async function deleteClientRecord(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const clientId = clean(formData.get('client_id'))
  const profileId = clean(formData.get('profile_id'))

  if (!clientId || !profileId) {
    redirect('/clients?error=Faltan datos para eliminar el cliente')
  }

  await supabaseAdmin.from('client_itineraries').delete().eq('client_id', clientId)
  await supabaseAdmin.from('clients').delete().eq('id', clientId)
  await supabaseAdmin.from('profiles').delete().eq('id', profileId)

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId)
  if (authError) goWithError(authError.message)

  revalidatePath('/clients')
  redirect('/clients?success=Prospecto/cliente eliminado')
}

export async function createNewProposalVersion(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const clientId = clean(formData.get('client_id'))
  const assignmentId = clean(formData.get('assignment_id'))
  const adminNote = clean(formData.get('admin_note')) || 'Hola, revisamos tus cambios y estamos preparando una nueva versión de tu propuesta.'
  const changeNotes = clean(formData.get('change_notes')) || adminNote

  if (!clientId || !assignmentId) {
    redirect('/clients?error=Faltan datos para crear la nueva versión')
  }

  const { data: currentAssignment, error: assignmentError } = await supabaseAdmin
    .from('client_itineraries')
    .select('id, client_id, itinerary_id, version_number')
    .eq('id', assignmentId)
    .eq('client_id', clientId)
    .single()

  if (assignmentError || !currentAssignment?.itinerary_id) {
    redirect(`/clients?error=${encodeURIComponent(assignmentError?.message || 'No se encontró la propuesta anterior')}`)
  }

  const { data: sourceItinerary, error: itineraryError } = await supabaseAdmin
    .from('itineraries')
    .select('id,title,description,image_url,itinerary_days(id,day_number,title,route,tour_template_id,food,food_type,food_description,hotel,hotel_id,description,itinerary_stops(id,place,title,duration,description,includes_ticket,order_index),itinerary_day_documents(id,title,file_url,file_path,file_type),itinerary_day_collaborators(id,collaborator_id))')
    .eq('id', currentAssignment.itinerary_id)
    .single()

  if (itineraryError || !sourceItinerary) {
    redirect(`/clients?error=${encodeURIComponent(itineraryError?.message || 'No se pudo leer el itinerario base')}`)
  }

  const nextVersion = Number(currentAssignment.version_number || 1) + 1
  const cleanTitle = String(sourceItinerary.title || 'Itinerario').replace(/\s·\sV\d+$/i, '')

  const { data: newItinerary, error: newItineraryError } = await supabaseAdmin
    .from('itineraries')
    .insert({
      title: `${cleanTitle} · V${nextVersion}`,
      description: sourceItinerary.description,
      image_url: sourceItinerary.image_url || null,
    })
    .select('id')
    .single()

  if (newItineraryError || !newItinerary?.id) {
    redirect(`/clients?error=${encodeURIComponent(newItineraryError?.message || 'No se pudo crear la nueva versión')}`)
  }

  const days = Array.isArray(sourceItinerary.itinerary_days) ? [...sourceItinerary.itinerary_days].sort((a: any, b: any) => Number(a.day_number || 0) - Number(b.day_number || 0)) : []

  for (const day of days as any[]) {
    const { data: createdDay, error: dayError } = await supabaseAdmin
      .from('itinerary_days')
      .insert({
        itinerary_id: newItinerary.id,
        day_number: day.day_number,
        title: day.title,
        route: day.route,
        tour_template_id: day.tour_template_id,
        food: day.food,
        food_type: day.food_type,
        food_description: day.food_description,
        hotel: day.hotel,
        hotel_id: day.hotel_id,
        description: day.description,
      })
      .select('id')
      .single()

    if (dayError || !createdDay?.id) continue

    const stops = Array.isArray(day.itinerary_stops) ? [...day.itinerary_stops].sort((a: any, b: any) => Number(a.order_index || 0) - Number(b.order_index || 0)) : []
    if (stops.length) {
      await supabaseAdmin.from('itinerary_stops').insert(stops.map((stop: any, index: number) => ({
        day_id: createdDay.id,
        place: stop.place,
        title: stop.title || stop.place,
        duration: stop.duration,
        description: stop.description,
        includes_ticket: Boolean(stop.includes_ticket),
        order_index: index + 1,
      })))
    }

    const documents = Array.isArray(day.itinerary_day_documents) ? day.itinerary_day_documents : []
    if (documents.length) {
      await supabaseAdmin.from('itinerary_day_documents').insert(documents.map((doc: any) => ({
        day_id: createdDay.id,
        title: doc.title,
        file_url: doc.file_url,
        file_path: doc.file_path || null,
        file_type: doc.file_type || null,
      })))
    }

    const collaborators = Array.isArray(day.itinerary_day_collaborators) ? day.itinerary_day_collaborators : []
    if (collaborators.length) {
      await supabaseAdmin.from('itinerary_day_collaborators').insert(collaborators.map((item: any) => ({
        day_id: createdDay.id,
        collaborator_id: item.collaborator_id,
      })).filter((item: any) => item.collaborator_id))
    }
  }

  const { data: version, error: versionError } = await supabaseAdmin
    .from('proposal_versions')
    .insert({
      client_id: clientId,
      itinerary_id: newItinerary.id,
      previous_assignment_id: assignmentId,
      version_number: nextVersion,
      status: 'draft',
      admin_note: adminNote,
      change_notes: changeNotes,
    })
    .select('id')
    .single()

  if (versionError || !version?.id) {
    redirect(`/clients?error=${encodeURIComponent(versionError?.message || 'No se pudo preparar la versión editable')}`)
  }

  await supabaseAdmin
    .from('clients')
    .update({ proposal_status: 'internal_review', lifecycle_status: 'prospect', updated_at: new Date().toISOString() })
    .eq('id', clientId)

  revalidatePath('/clients')
  revalidatePath('/itineraries')
  redirect(`/itineraries/${newItinerary.id}/edit?proposal_version_id=${version.id}`)
}


export async function completeOperationTask(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const taskId = clean(formData.get('task_id'))
  const clientId = clean(formData.get('client_id'))
  const nextStatus = clean(formData.get('next_status')) || 'done'

  if (!taskId || !clientId) {
    redirect('/clients?error=Faltan datos para actualizar la tarea')
  }

  const { error } = await supabaseAdmin
    .from('operation_tasks')
    .update({
      status: nextStatus,
      completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .eq('client_id', clientId)

  if (error) goWithError(error.message)

  revalidatePath('/clients')
  redirect('/clients?success=Tarea operativa actualizada')
}
