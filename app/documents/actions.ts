'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export async function createDocumentLink(formData: FormData) {
  const supabase = await createClient()
  const tour_id = String(formData.get('tour_id') || '')
  const title = String(formData.get('title') || '')
  const file_url = String(formData.get('file_url') || '')
  const visibility = String(formData.get('visibility') || 'internal')

  await supabase.from('documents').insert({ tour_id, title, file_url, visibility })
  revalidatePath('/documents')
  redirect('/documents')
}
