import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const assignmentId = String(body?.assignment_id || '').trim()

  if (!assignmentId) return NextResponse.json({ error: 'Falta la propuesta' }, { status: 400 })

  const { error } = await supabase
    .from('client_itineraries')
    .delete()
    .eq('id', assignmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
