import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const targetUserId = String(body?.target_user_id || '')

  if (!targetUserId) {
    return NextResponse.json({ error: 'Selecciona un contacto válido' }, { status: 400 })
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'No puedes crear un chat contigo mismo' }, { status: 400 })
  }

  const [directUserA, directUserB] = [user.id, targetUserId].sort()

  const { data: existingRoom, error: findError } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('direct_user_a', directUserA)
    .eq('direct_user_b', directUserB)
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (existingRoom?.id) {
    await supabase.from('chat_participants').upsert([
      { chat_room_id: existingRoom.id, user_id: user.id },
      { chat_room_id: existingRoom.id, user_id: targetUserId }
    ], { onConflict: 'chat_room_id,user_id' })

    return NextResponse.json({ room_id: existingRoom.id })
  }

  const { data: newRoom, error: createError } = await supabase
    .from('chat_rooms')
    .insert({
      type: 'direct',
      title: 'Chat directo',
      direct_user_a: directUserA,
      direct_user_b: directUserB
    })
    .select('id')
    .single()

  if (createError || !newRoom?.id) {
    return NextResponse.json({ error: createError?.message || 'No se pudo crear la sala' }, { status: 500 })
  }

  const { error: participantError } = await supabase.from('chat_participants').upsert([
    { chat_room_id: newRoom.id, user_id: user.id },
    { chat_room_id: newRoom.id, user_id: targetUserId }
  ], { onConflict: 'chat_room_id,user_id' })

  if (participantError) {
    return NextResponse.json({ error: participantError.message }, { status: 500 })
  }

  return NextResponse.json({ room_id: newRoom.id })
}
