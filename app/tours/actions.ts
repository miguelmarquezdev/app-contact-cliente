'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

function clean(value: unknown) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function parsePrice(value: unknown) {
  const raw = String(value || '').replace(',', '.').trim()
  if (!raw) return null
  const number = Number(raw)
  return Number.isFinite(number) ? number : null
}

async function uploadTourImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  existingUrl: string | null
) {
  const file = formData.get('tour_image')

  if (!(file instanceof File) || file.size === 0) {
    return existingUrl
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 8 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    console.error('Invalid tour image type:', file.type)
    return existingUrl
  }

  if (file.size > maxSize) {
    console.error('Tour image is too large:', file.size)
    return existingUrl
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'tour'

  const filePath = `tours/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}.${extension}`

  const { error } = await supabase.storage
    .from('tour-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    console.error('Error uploading tour image:', error)
    return existingUrl
  }

  const { data } = supabase.storage.from('tour-images').getPublicUrl(filePath)
  return data.publicUrl
}

type TourStopPayload = {
  place?: string
  duration?: string
  description?: string
  includes_ticket?: boolean
}

function parseStops(value: FormDataEntryValue | null): TourStopPayload[] {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseMealTypes(value: FormDataEntryValue | null): string[] {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : []
  } catch {
    return []
  }
}

function parseMealObservations(value: FormDataEntryValue | null): Record<string, string> {
  try {
    const parsed = JSON.parse(String(value || '{}'))
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, val]) => [String(key), String(val || '').trim()])
        .filter(([, val]) => val)
    )
  } catch {
    return {}
  }
}

function buildDefaultFoodNotes(mealTypes: string[], mealObservations: Record<string, string>) {
  return mealTypes
    .map((meal) => {
      const note = mealObservations[meal]
      return note ? `${meal}: ${note}` : meal
    })
    .join(' | ')
}

async function saveTourStops(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tourId: string,
  stops: TourStopPayload[]
) {
  const validStops = stops
    .map((stop, index) => ({
      tour_id: tourId,
      place: clean(stop.place),
      duration: clean(stop.duration),
      description: clean(stop.description),
      includes_ticket: Boolean(stop.includes_ticket),
      order_index: index + 1,
    }))
    .filter((stop) => stop.place)

  if (validStops.length) {
    const { error: stopsError } = await supabase.from('tour_template_stops').insert(validStops)
    if (stopsError) console.error('Error saving tour stops:', stopsError)
  }
}

export async function createTour(formData: FormData) {
  const supabase = await createClient()
  const title = clean(formData.get('title'))
  const code = clean(formData.get('code'))
  const route = clean(formData.get('route'))
  const description = clean(formData.get('description'))
  const category = clean(formData.get('category')) || 'day_tours'
  const price_amount = parsePrice(formData.get('price_amount'))
  const price_currency = clean(formData.get('price_currency')) || 'USD'
  const duration = clean(formData.get('duration'))
  const image_url = await uploadTourImage(supabase, formData, null)
  const featured = formData.get('featured') === 'on'
  const status = String(formData.get('status') || 'confirmed')
  const stops = parseStops(formData.get('stops_json'))
  const meal_types = parseMealTypes(formData.get('meal_types_json'))
  const meal_observations = parseMealObservations(formData.get('meal_observations_json'))
  const default_food_notes = buildDefaultFoodNotes(meal_types, meal_observations)

  if (!title) redirect('/tours')

  const { data: tour, error } = await supabase
    .from('tours')
    .insert({ title, code, route, description, category, price_amount, price_currency, duration, image_url, featured, default_food_notes, meal_types, meal_observations, status })
    .select('id')
    .single()

  if (error || !tour?.id) {
    console.error('Error creating tour template:', error)
    redirect('/tours')
  }

  await saveTourStops(supabase, tour.id, stops)

  revalidatePath('/tours')
  redirect('/tours')
}

export async function updateTour(formData: FormData) {
  const supabase = await createClient()
  const tourId = clean(formData.get('tour_id'))
  const title = clean(formData.get('title'))
  const code = clean(formData.get('code'))
  const route = clean(formData.get('route'))
  const description = clean(formData.get('description'))
  const category = clean(formData.get('category')) || 'day_tours'
  const price_amount = parsePrice(formData.get('price_amount'))
  const price_currency = clean(formData.get('price_currency')) || 'USD'
  const duration = clean(formData.get('duration'))
  const existingImageUrl = clean(formData.get('existing_image_url'))
  const image_url = await uploadTourImage(supabase, formData, existingImageUrl)
  const featured = formData.get('featured') === 'on'
  const status = String(formData.get('status') || 'confirmed')
  const stops = parseStops(formData.get('stops_json'))
  const meal_types = parseMealTypes(formData.get('meal_types_json'))
  const meal_observations = parseMealObservations(formData.get('meal_observations_json'))
  const default_food_notes = buildDefaultFoodNotes(meal_types, meal_observations)

  if (!tourId || !title) redirect('/tours')

  const { error } = await supabase
    .from('tours')
    .update({ title, code, route, description, category, price_amount, price_currency, duration, image_url, featured, default_food_notes, meal_types, meal_observations, status })
    .eq('id', tourId)

  if (error) {
    console.error('Error updating tour template:', error)
    redirect('/tours')
  }

  const { error: deleteStopsError } = await supabase.from('tour_template_stops').delete().eq('tour_id', tourId)
  if (deleteStopsError) console.error('Error deleting previous tour stops:', deleteStopsError)

  await saveTourStops(supabase, tourId, stops)

  revalidatePath('/tours')
  redirect('/tours')
}

export async function deleteTour(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('tour_id'))
  if (!id) redirect('/tours')

  const { error } = await supabase.from('tours').delete().eq('id', id)
  if (error) console.error('Error deleting tour:', error)

  revalidatePath('/tours')
  redirect('/tours')
}
