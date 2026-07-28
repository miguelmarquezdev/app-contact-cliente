'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

function clean(value: unknown) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

export async function createHotel(formData: FormData) {
  const supabase = await createClient()
  const name = clean(formData.get('name'))
  const location = clean(formData.get('location'))
  const description = clean(formData.get('description'))
  const contact = clean(formData.get('contact'))
  const status = String(formData.get('status') || 'active')

  if (!name) redirect('/hotels')

  const { error } = await supabase.from('hotels').insert({ name, location, description, contact, status })
  if (error) console.error('Error creating hotel:', error)

  revalidatePath('/hotels')
  redirect('/hotels')
}

export async function deleteHotel(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('hotel_id'))
  if (!id) redirect('/hotels')

  const { error } = await supabase.from('hotels').delete().eq('id', id)
  if (error) console.error('Error deleting hotel:', error)

  revalidatePath('/hotels')
  redirect('/hotels')
}
