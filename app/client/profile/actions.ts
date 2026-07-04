'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const full_name = clean(formData.get('full_name'))
  const phone = clean(formData.get('phone'))
  const country = clean(formData.get('country'))
  const passport_number = clean(formData.get('passport_number'))

  await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (client?.id) {
    await supabase
      .from('clients')
      .update({ country, passport_number })
      .eq('id', client.id)
  }

  revalidatePath('/client/profile')
  redirect('/client/profile?success=Datos actualizados')
}
