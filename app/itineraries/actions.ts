'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

type StopPayload = {
  place?: string
  duration?: string
  description?: string
  includes_ticket?: boolean
}

type ExistingDayDocumentPayload = {
  title?: string
  file_url?: string
  file_path?: string | null
  file_type?: string | null
}

type DayPayload = {
  title?: string
  route?: string
  food?: string
  hotel?: string
  description?: string
  collaborator_ids?: string[]
  existing_documents?: ExistingDayDocumentPayload[]
  stops?: StopPayload[]
}

function clean(value: unknown) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function parseDays(value: FormDataEntryValue | null): DayPayload[] {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

async function uploadDayDocuments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  itineraryId: string,
  dayId: string,
  dayIndex: number,
  userId?: string | null
) {
  const files = formData.getAll(`day_documents_${dayIndex}`).filter((item): item is File => item instanceof File && item.size > 0)

  for (const file of files) {
    const fileName = safeFileName(file.name || `documento-dia-${dayIndex + 1}`)
    const filePath = `${itineraryId}/${dayId}/${Date.now()}-${crypto.randomUUID()}-${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('itinerary-day-documents')
      .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })

    if (uploadError) {
      console.error('Error uploading day document:', uploadError)
      continue
    }

    const { data: publicUrl } = supabase.storage
      .from('itinerary-day-documents')
      .getPublicUrl(filePath)

    const { error: documentError } = await supabase.from('itinerary_day_documents').insert({
      day_id: dayId,
      title: file.name || `Documento Día ${dayIndex + 1}`,
      file_url: publicUrl.publicUrl,
      file_path: filePath,
      file_type: file.type || null,
      uploaded_by: userId || null,
    })

    if (documentError) console.error('Error saving day document:', documentError)
  }
}

async function saveDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itineraryId: string,
  days: DayPayload[],
  formData: FormData,
  userId?: string | null
) {
  for (const [dayIndex, day] of days.entries()) {
    const dayTitle = clean(day.title) || `Día ${dayIndex + 1}`

    const { data: createdDay, error: dayError } = await supabase
      .from('itinerary_days')
      .insert({
        itinerary_id: itineraryId,
        day_number: dayIndex + 1,
        title: dayTitle,
        route: clean(day.route),
        food: clean(day.food),
        hotel: clean(day.hotel),
        description: clean(day.description),
      })
      .select('id')
      .single()

    if (dayError || !createdDay?.id) {
      console.error('Error creating itinerary day:', dayError)
      continue
    }

    const collaboratorIds = Array.isArray(day.collaborator_ids) ? day.collaborator_ids.filter(Boolean) : []
    if (collaboratorIds.length) {
      const { error: collaboratorsError } = await supabase.from('itinerary_day_collaborators').insert(
        collaboratorIds.map((collaboratorId) => ({
          day_id: createdDay.id,
          collaborator_id: collaboratorId,
        }))
      )
      if (collaboratorsError) console.error('Error assigning day collaborators:', collaboratorsError)
    }

    const existingDocuments = Array.isArray(day.existing_documents) ? day.existing_documents : []
    const validExistingDocuments = existingDocuments
      .map((doc) => ({
        day_id: createdDay.id,
        title: clean(doc.title) || 'Documento',
        file_url: clean(doc.file_url),
        file_path: clean(doc.file_path),
        file_type: clean(doc.file_type),
        uploaded_by: userId || null,
      }))
      .filter((doc) => doc.file_url)

    if (validExistingDocuments.length) {
      const { error: documentsError } = await supabase.from('itinerary_day_documents').insert(validExistingDocuments)
      if (documentsError) console.error('Error preserving existing documents:', documentsError)
    }

    await uploadDayDocuments(supabase, formData, itineraryId, createdDay.id, dayIndex, userId)

    const stops = Array.isArray(day.stops) ? day.stops : []
    const validStops = stops
      .map((stop, stopIndex) => ({
        day_id: createdDay.id,
        place: clean(stop.place),
        title: clean(stop.place),
        duration: clean(stop.duration),
        description: clean(stop.description),
        includes_ticket: Boolean(stop.includes_ticket),
        order_index: stopIndex + 1,
      }))
      .filter((stop) => stop.place || stop.description || stop.duration)

    if (validStops.length) {
      const { error: stopsError } = await supabase.from('itinerary_stops').insert(validStops)
      if (stopsError) console.error('Error creating stops:', stopsError)
    }
  }
}

export async function createFullItinerary(formData: FormData) {
  const supabase = await createClient()
  const title = clean(formData.get('title'))
  const description = clean(formData.get('description'))
  const { data: { user } } = await supabase.auth.getUser()
  const days = parseDays(formData.get('days_json'))

  if (!title) redirect('/itineraries')

  const { data: itinerary, error: itineraryError } = await supabase
    .from('itineraries')
    .insert({ title, description })
    .select('id')
    .single()

  if (itineraryError || !itinerary?.id) {
    console.error('Error creating itinerary:', itineraryError)
    redirect('/itineraries')
  }

  await saveDays(supabase, itinerary.id, days, formData, user?.id)

  revalidatePath('/itineraries')
  redirect('/itineraries')
}

export async function updateFullItinerary(formData: FormData) {
  const supabase = await createClient()
  const itineraryId = clean(formData.get('itinerary_id'))
  const title = clean(formData.get('title'))
  const description = clean(formData.get('description'))
  const { data: { user } } = await supabase.auth.getUser()
  const days = parseDays(formData.get('days_json'))

  if (!itineraryId || !title) redirect('/itineraries')

  const { error: itineraryError } = await supabase
    .from('itineraries')
    .update({ title, description })
    .eq('id', itineraryId)

  if (itineraryError) {
    console.error('Error updating itinerary:', itineraryError)
    redirect(`/itineraries/${itineraryId}/edit`)
  }

  const { error: deleteDaysError } = await supabase
    .from('itinerary_days')
    .delete()
    .eq('itinerary_id', itineraryId)

  if (deleteDaysError) {
    console.error('Error deleting previous days:', deleteDaysError)
    redirect(`/itineraries/${itineraryId}/edit`)
  }

  await saveDays(supabase, itineraryId, days, formData, user?.id)

  revalidatePath('/itineraries')
  revalidatePath(`/itineraries/${itineraryId}/edit`)
  redirect('/itineraries')
}

export async function deleteItinerary(formData: FormData) {
  const supabase = await createClient()
  const itineraryId = clean(formData.get('itinerary_id'))

  if (!itineraryId) redirect('/itineraries')

  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', itineraryId)

  if (error) console.error('Error deleting itinerary:', error)

  revalidatePath('/itineraries')
  redirect('/itineraries')
}


export async function assignItineraryToClient(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const itineraryId = clean(formData.get('itinerary_id'))
  const clientId = clean(formData.get('client_id'))
  const note = clean(formData.get('note'))

  if (!itineraryId || !clientId) redirect('/itineraries?error=Selecciona un cliente')

  const { error } = await supabase
    .from('client_itineraries')
    .upsert({
      itinerary_id: itineraryId,
      client_id: clientId,
      assigned_by: user?.id || null,
      note,
    }, { onConflict: 'client_id,itinerary_id' })

  if (error) {
    console.error('Error assigning itinerary:', error)
    redirect(`/itineraries?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/itineraries')
  redirect('/itineraries?success=Itinerario enviado al cliente')
}

export async function removeClientItinerary(formData: FormData) {
  const supabase = await createClient()
  const assignmentId = clean(formData.get('assignment_id'))

  if (!assignmentId) redirect('/itineraries')

  const { error } = await supabase
    .from('client_itineraries')
    .delete()
    .eq('id', assignmentId)

  if (error) console.error('Error removing client itinerary:', error)

  revalidatePath('/itineraries')
  redirect('/itineraries?success=Itinerario quitado del cliente')
}
