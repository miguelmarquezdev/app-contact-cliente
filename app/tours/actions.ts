'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export async function createTour(formData: FormData) {
  const supabase = await createClient()
  const title = String(formData.get('title') || '')
  const code = String(formData.get('code') || '')
  const start_date = String(formData.get('start_date') || '') || null
  const end_date = String(formData.get('end_date') || '') || null
  const status = String(formData.get('status') || 'pending')

  await supabase.from('tours').insert({ title, code, start_date, end_date, status })
  revalidatePath('/tours')
  redirect('/tours')
}
