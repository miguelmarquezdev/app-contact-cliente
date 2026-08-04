'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

function combineName(firstName: string, lastName: string, fallback: string) {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim()
  return full || fallback
}

async function uploadAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
  existingUrl: string | null
) {
  const file = formData.get('avatar_file')

  if (!(file instanceof File) || file.size === 0) {
    return existingUrl
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    console.error('Invalid avatar type:', file.type)
    return existingUrl
  }

  if (file.size > maxSize) {
    console.error('Avatar too large:', file.size)
    return existingUrl
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${userId}/avatar-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('profile-avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (error) {
    console.error('Error uploading avatar:', error)
    return existingUrl
  }

  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(filePath)
  return data.publicUrl
}

export async function updateCollaboratorProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fallbackName = clean(formData.get('full_name'))
  const first_name = clean(formData.get('first_name'))
  const last_name = clean(formData.get('last_name'))
  const full_name = combineName(first_name, last_name, fallbackName)
  const phone = clean(formData.get('phone'))
  const existingAvatarUrl = clean(formData.get('existing_avatar_url')) || null
  const avatar_url = await uploadAvatar(supabase, user.id, formData, existingAvatarUrl)

  await supabase
    .from('profiles')
    .update({ full_name, phone, avatar_url })
    .eq('id', user.id)

  revalidatePath('/collaborator/profile')
  revalidatePath('/collaborator/dashboard')
  revalidatePath('/collaborator/chat')
  revalidatePath('/chat')
  revalidatePath('/clients')
  revalidatePath('/collaborators')
  redirect('/collaborator/profile?success=Datos actualizados')
}
