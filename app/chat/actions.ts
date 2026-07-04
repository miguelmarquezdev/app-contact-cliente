'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export async function createRoom(formData: FormData) {
  const supabase = await createClient()
  const tour_id = String(formData.get('tour_id') || '')
  const type = String(formData.get('type') || 'client')
  await supabase.from('chat_rooms').insert({ tour_id, type })
  revalidatePath('/chat')
  redirect('/chat')
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const chat_room_id = String(formData.get('chat_room_id') || '')
  const message = String(formData.get('message') || '')
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('chat_messages').insert({ chat_room_id, sender_id: user?.id, message })
  revalidatePath('/chat')
  redirect('/chat')
}
