'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

export async function updateCollaboratorProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const full_name = clean(formData.get('full_name'))
  const phone = clean(formData.get('phone'))

  await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)

  revalidatePath('/collaborator/profile')
  redirect('/collaborator/profile?success=Datos actualizados')
}
