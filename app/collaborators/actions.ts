'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

function goWithError(message: string) {
  redirect(`/collaborators?error=${encodeURIComponent(message)}`)
}

export async function createCollaborator(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const full_name = clean(formData.get('full_name'))
  const email = clean(formData.get('email')).toLowerCase()
  const password = clean(formData.get('password'))
  const phone = clean(formData.get('phone'))
  const role = clean(formData.get('role')) || 'collaborator'
  const position = clean(formData.get('position')) || 'Guía'

  if (!full_name || !email || !password) {
    redirect('/collaborators?error=Faltan usuario, correo o contraseña')
  }

  if (!['tour_leader', 'collaborator'].includes(role)) {
    redirect('/collaborators?error=Rol inválido')
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role,
      position
    }
  })

  if (userError || !userData.user) {
    redirect(`/collaborators?error=${encodeURIComponent(userError?.message || 'No se pudo crear el usuario')}`)
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: userData.user.id,
    full_name,
    email,
    phone,
    role,
    position,
    status: 'active'
  })

  if (profileError) {
    redirect(`/collaborators?error=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/collaborators')
  redirect('/collaborators?success=Colaborador creado con acceso')
}

export async function updateCollaborator(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const profileId = clean(formData.get('profile_id'))
  const full_name = clean(formData.get('full_name'))
  const email = clean(formData.get('email')).toLowerCase()
  const password = clean(formData.get('password'))
  const phone = clean(formData.get('phone'))
  const role = clean(formData.get('role')) || 'collaborator'
  const position = clean(formData.get('position')) || 'Guía'
  const status = clean(formData.get('status')) || 'active'

  if (!profileId || !full_name || !email) {
    redirect('/collaborators?error=Faltan datos para actualizar')
  }

  if (!['tour_leader', 'collaborator'].includes(role)) {
    redirect('/collaborators?error=Rol inválido')
  }

  const authUpdate: { email: string; password?: string; user_metadata: { full_name: string; role: string; position: string } } = {
    email,
    user_metadata: { full_name, role, position }
  }

  if (password) authUpdate.password = password

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profileId, authUpdate)
  if (authError) goWithError(authError.message)

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name, email, phone, role, position, status })
    .eq('id', profileId)

  if (profileError) goWithError(profileError.message)

  revalidatePath('/collaborators')
  redirect('/collaborators?success=Colaborador actualizado')
}

export async function deleteCollaborator(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const profileId = clean(formData.get('profile_id'))
  if (!profileId) redirect('/collaborators?error=Falta ID para eliminar')

  await supabaseAdmin.from('tour_collaborators').delete().eq('collaborator_id', profileId)
  await supabaseAdmin.from('tours').update({ tour_leader_id: null }).eq('tour_leader_id', profileId)
  await supabaseAdmin.from('profiles').delete().eq('id', profileId)

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId)
  if (authError) goWithError(authError.message)

  revalidatePath('/collaborators')
  redirect('/collaborators?success=Colaborador eliminado')
}
