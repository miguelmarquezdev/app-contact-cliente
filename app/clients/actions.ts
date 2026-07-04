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

export async function createClientRecord(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const full_name = clean(formData.get('full_name'))
  const email = clean(formData.get('email')).toLowerCase()
  const password = clean(formData.get('password'))
  const phone = clean(formData.get('phone'))
  const country = clean(formData.get('country'))
  const passport_number = clean(formData.get('passport_number'))

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
    passport_number
  })

  if (clientError) {
    redirect(`/clients?error=${encodeURIComponent(clientError.message)}`)
  }

  revalidatePath('/clients')
  redirect('/clients?success=Cliente creado con acceso')
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

  const { error: clientError } = await supabaseAdmin
    .from('clients')
    .update({ country, passport_number })
    .eq('id', clientId)

  if (clientError) goWithError(clientError.message)

  revalidatePath('/clients')
  redirect('/clients?success=Cliente actualizado')
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
  redirect('/clients?success=Cliente eliminado')
}
