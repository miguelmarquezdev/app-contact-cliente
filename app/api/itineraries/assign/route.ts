import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const itineraryId = String(body?.itinerary_id || '').trim()
  const clientId = String(body?.client_id || '').trim()
  const note = String(body?.note || '').trim() || null

  if (!itineraryId || !clientId) {
    return NextResponse.json({ error: 'Selecciona itinerario y prospecto' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('client_itineraries')
    .select('id')
    .eq('itinerary_id', itineraryId)
    .eq('client_id', clientId)
    .maybeSingle()

  const payload = {
    itinerary_id: itineraryId,
    client_id: clientId,
    assigned_by: user.id,
    note,
    proposal_status: 'sent',
    sent_at: new Date().toISOString(),
  }

  const { data: saved, error } = existing?.id
    ? await supabase.from('client_itineraries').update(payload).eq('id', existing.id).select('id').single()
    : await supabase.from('client_itineraries').insert(payload).select('id').single()

  if (error || !saved?.id) {
    return NextResponse.json({ error: error?.message || 'No se pudo enviar la propuesta' }, { status: 500 })
  }

  await supabase
    .from('clients')
    .update({ proposal_status: 'proposal_sent', updated_at: new Date().toISOString() })
    .eq('id', clientId)

  const { data: assignment, error: readError } = await supabase
    .from('client_itineraries')
    .select('id,note,proposal_status,version_number,clients(id,lifecycle_status,proposal_status,profiles(full_name,email))')
    .eq('id', saved.id)
    .single()

  if (readError || !assignment) {
    return NextResponse.json({ error: readError?.message || 'No se pudo leer la propuesta enviada' }, { status: 500 })
  }

  return NextResponse.json({ assignment })
}
