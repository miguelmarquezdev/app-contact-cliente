'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export function RealtimeAppRefresh() {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const refreshSoftly = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        router.refresh()
      }, 450)
    }

    const channel = supabase
      .channel('happy-manager-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, refreshSoftly)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_itineraries' }, refreshSoftly)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposal_versions' }, refreshSoftly)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itineraries' }, refreshSoftly)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_days' }, refreshSoftly)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_stops' }, refreshSoftly)
      .subscribe()

    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
