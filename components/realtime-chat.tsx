'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  ClipboardList,
  Home,
  Loader2,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  User,
  Users,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type Contact = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  position?: string | null
}

type ChatMessage = {
  id: string
  chat_room_id: string
  sender_id: string | null
  message: string
  file_url?: string | null
  is_read?: boolean | null
  created_at: string
  profiles?: {
    full_name: string | null
    role: string | null
  } | null
}

type IncomingToast = {
  contactId: string
  senderName: string
  message: string
}

type RealtimeChatProps = {
  currentUserId: string
  currentUserName: string
  contacts: Contact[]
  title?: string
  helper?: string
}

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Admin'
  if (role === 'tour_leader') return 'Tour Leader'
  if (role === 'collaborator') return 'Colaborador'
  if (role === 'client') return 'Cliente'
  return 'Usuario'
}

function positionLabel(contact?: Contact | null) {
  if (!contact) return ''
  if (contact.role === 'client') return 'Cliente'
  if (contact.role === 'admin') return 'Admin'
  return contact.position || 'Equipo'
}

function initials(contact?: Contact | null) {
  const label = contact?.full_name || contact?.email || 'U'
  return label.slice(0, 1).toUpperCase()
}

function avatarColorClass(contact?: Contact | null) {
  const key = `${contact?.id || ''}${contact?.full_name || ''}${contact?.email || ''}`
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997
  const colors = [
    'from-[#2a1f5d] to-[#1f1947] text-violet-200 shadow-none',
    'from-[#123760] to-[#102a4d] text-sky-200 shadow-none',
    'from-[#12463d] to-[#0e332e] text-emerald-200 shadow-none',
    'from-[#493615] to-[#36280f] text-amber-200 shadow-none',
    'from-[#4a1b46] to-[#331630] text-fuchsia-200 shadow-none',
    'from-[#123b50] to-[#102b3d] text-cyan-200 shadow-none',
    'from-[#314416] to-[#263510] text-lime-200 shadow-none',
    'from-[#4a1825] to-[#35121d] text-rose-200 shadow-none'
  ]
  return colors[hash % colors.length]
}

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function mobileNavItems(pathname: string) {
  if (pathname.startsWith('/client')) {
    return [
      { href: '/client/dashboard', label: 'Inicio', icon: Home },
      { href: '/client/itineraries', label: 'Itinerarios', icon: ClipboardList },
      { href: '/client/chat', label: 'Chats', icon: MessageCircle },
      { href: '/client/profile', label: 'Perfil', icon: User }
    ]
  }

  if (pathname.startsWith('/collaborator')) {
    return [
      { href: '/collaborator/dashboard', label: 'Inicio', icon: Home },
      { href: '/collaborator/itineraries', label: 'Mis días', icon: ClipboardList },
      { href: '/collaborator/chat', label: 'Chats', icon: MessageCircle },
      { href: '/collaborator/profile', label: 'Perfil', icon: User }
    ]
  }

  return [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/itineraries', label: 'Itinerarios', icon: ClipboardList },
    { href: '/clients', label: 'Clientes', icon: Users },
    { href: '/chat', label: 'Chats', icon: MessageCircle }
  ]
}

export function RealtimeChat({ currentUserId, currentUserName, contacts, title = 'Chat en vivo', helper }: RealtimeChatProps) {
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false)
  const [roomId, setRoomId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loadingRoom, setLoadingRoom] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const selectedContactIdRef = useRef('')
  const roomIdRef = useRef('')
  const contactsRef = useRef<Contact[]>(contacts)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [incomingToast, setIncomingToast] = useState<IncomingToast | null>(null)
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({})
  const [activityByContact, setActivityByContact] = useState<Record<string, number>>({})
  const [previewByContact, setPreviewByContact] = useState<Record<string, string>>({})
  const [online, setOnline] = useState(true)

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId)

  useEffect(() => {
    let cancelled = false

    async function loadLastActivity() {
      if (!contacts.length) return

      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('id,direct_user_a,direct_user_b')
        .or(`direct_user_a.eq.${currentUserId},direct_user_b.eq.${currentUserId}`)

      if (cancelled || roomsError || !rooms?.length) return

      const roomToContact = new Map<string, string>()
      rooms.forEach((room: { id: string; direct_user_a?: string | null; direct_user_b?: string | null }) => {
        const otherId = room.direct_user_a === currentUserId ? room.direct_user_b : room.direct_user_a
        if (room.id && otherId) roomToContact.set(room.id, otherId)
      })

      const roomIds = Array.from(roomToContact.keys())
      if (!roomIds.length) return

      const { data: lastMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('chat_room_id,message,created_at')
        .in('chat_room_id', roomIds)
        .order('created_at', { ascending: false })
        .limit(500)

      if (cancelled || messagesError || !lastMessages?.length) return

      const nextActivity: Record<string, number> = {}
      const nextPreview: Record<string, string> = {}

      lastMessages.forEach((item: { chat_room_id: string; message: string; created_at: string }) => {
        const contactId = roomToContact.get(item.chat_room_id)
        if (!contactId || nextActivity[contactId]) return
        nextActivity[contactId] = new Date(item.created_at).getTime()
        nextPreview[contactId] = item.message
      })

      setActivityByContact((current) => ({ ...nextActivity, ...current }))
      setPreviewByContact((current) => ({ ...nextPreview, ...current }))
    }

    loadLastActivity()

    return () => {
      cancelled = true
    }
  }, [contacts.length, currentUserId, supabase])

  useEffect(() => {
    contactsRef.current = contacts
  }, [contacts])

  useEffect(() => {
    selectedContactIdRef.current = selectedContactId
  }, [selectedContactId])

  useEffect(() => {
    roomIdRef.current = roomId
  }, [roomId])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    if (typeof window !== 'undefined') {
      setOnline(navigator.onLine)
      const updateOnline = () => setOnline(navigator.onLine)
      window.addEventListener('online', updateOnline)
      window.addEventListener('offline', updateOnline)
      return () => {
        window.removeEventListener('online', updateOnline)
        window.removeEventListener('offline', updateOnline)
      }
    }
  }, [])

  const unlockSound = useCallback(() => {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => null)
    }

    setAudioEnabled(true)
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      unlockSound()
      const context = audioContextRef.current
      if (!context) return

      const first = context.createOscillator()
      const second = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      first.type = 'sine'
      second.type = 'sine'
      first.frequency.setValueAtTime(988, now)
      second.frequency.setValueAtTime(1318, now + 0.08)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)

      first.connect(gain)
      second.connect(gain)
      gain.connect(context.destination)
      first.start(now)
      first.stop(now + 0.16)
      second.start(now + 0.08)
      second.stop(now + 0.28)
    } catch {
      // Navegadores móviles pueden bloquear sonido hasta que haya interacción.
    }
  }, [unlockSound])

  const requestNotifications = useCallback(async () => {
    unlockSound()
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }, [unlockSound])

  const showBrowserNotification = useCallback((senderName: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const notification = new Notification(`Nuevo mensaje de ${senderName}`, {
      body,
      silent: true
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }, [])

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = !term
      ? contacts
      : contacts.filter((contact) => {
          const fullName = contact.full_name?.toLowerCase() || ''
          const email = contact.email?.toLowerCase() || ''
          const role = roleLabel(contact.role).toLowerCase()
          const position = positionLabel(contact).toLowerCase()
          return fullName.includes(term) || email.includes(term) || role.includes(term) || position.includes(term)
        })

    return [...list].sort((a, b) => {
      const activityA = activityByContact[a.id] || 0
      const activityB = activityByContact[b.id] || 0
      const activityDiff = activityB - activityA
      if (activityDiff !== 0) return activityDiff

      const unreadDiff = (unreadByContact[b.id] || 0) - (unreadByContact[a.id] || 0)
      if (unreadDiff !== 0) return unreadDiff

      return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '')
    })
  }, [activityByContact, contacts, search, unreadByContact])

  useEffect(() => {
    const targetFromUrl = new URLSearchParams(window.location.search).get('contact')
    if (targetFromUrl && contacts.some((contact) => contact.id === targetFromUrl)) {
      setSelectedContactId(targetFromUrl)
      setMobileConversationOpen(true)
      return
    }

    if (contacts[0]?.id && !selectedContactId && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSelectedContactId(contacts[0].id)
    }
  }, [contacts, selectedContactId])

  const scrollBottom = useCallback((smooth = true) => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }), 70)
  }, [])

  const loadMessages = useCallback(async (targetRoomId: string) => {
    if (!targetRoomId) return
    setLoadingMessages(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, chat_room_id, sender_id, message, file_url, is_read, created_at, profiles(full_name, role)')
      .eq('chat_room_id', targetRoomId)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      const safeData = (data as unknown as ChatMessage[]) || []
      setMessages(safeData)
      const last = safeData[safeData.length - 1]
      if (last) {
        const otherId = last.sender_id === currentUserId ? selectedContactIdRef.current : last.sender_id || selectedContactIdRef.current
        if (otherId) {
          setPreviewByContact((current) => ({ ...current, [otherId]: last.message }))
          setActivityByContact((current) => ({ ...current, [otherId]: new Date(last.created_at).getTime() }))
        }
      }
      scrollBottom(false)
    }
    setLoadingMessages(false)
  }, [currentUserId, scrollBottom, supabase])

  const openRoom = useCallback(async (targetUserId: string) => {
    if (!targetUserId) return
    setError('')
    setLoadingRoom(true)
    setMessages([])

    try {
      const response = await fetch('/api/chat/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId })
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'No se pudo abrir el chat')

      setRoomId(payload.room_id)
      await loadMessages(payload.room_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir el chat')
    } finally {
      setLoadingRoom(false)
    }
  }, [loadMessages])

  useEffect(() => {
    if (selectedContactId) openRoom(selectedContactId)
  }, [selectedContactId, openRoom])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-notifications-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const incoming = payload.new as ChatMessage
          if (!incoming?.id || incoming.sender_id === currentUserId) return

          const { data: participant } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_room_id', incoming.chat_room_id)
            .eq('user_id', currentUserId)
            .maybeSingle()

          if (!participant) return

          if (roomIdRef.current === incoming.chat_room_id) {
            await loadMessages(incoming.chat_room_id)
          }

          const sender = contactsRef.current.find((contact) => contact.id === incoming.sender_id)
          let senderName = sender?.full_name || sender?.email || 'Nuevo mensaje'

          if (!sender && incoming.sender_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name,email')
              .eq('id', incoming.sender_id)
              .maybeSingle()
            senderName = profile?.full_name || profile?.email || senderName
          }

          if (incoming.sender_id) {
            setActivityByContact((current) => ({ ...current, [incoming.sender_id as string]: Date.now() }))
            setPreviewByContact((current) => ({ ...current, [incoming.sender_id as string]: incoming.message }))
          }

          if (incoming.sender_id && selectedContactIdRef.current !== incoming.sender_id) {
            setUnreadByContact((current) => ({
              ...current,
              [incoming.sender_id as string]: (current[incoming.sender_id as string] || 0) + 1
            }))
          }

          const preview = incoming.message.length > 86 ? `${incoming.message.slice(0, 86)}...` : incoming.message
          setIncomingToast({
            contactId: incoming.sender_id || '',
            senderName,
            message: preview
          })
          playNotificationSound()
          showBrowserNotification(senderName, preview)
          window.setTimeout(() => setIncomingToast(null), 5200)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadMessages, playNotificationSound, showBrowserNotification, supabase])

  function handleSelectContact(contactId: string) {
    unlockSound()
    setSelectedContactId(contactId)
    setUnreadByContact((current) => ({ ...current, [contactId]: 0 }))
    setMobileConversationOpen(true)
    setTimeout(() => inputRef.current?.focus(), 250)
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    unlockSound()
    const cleanMessage = message.trim()
    if (!cleanMessage || !roomId || sending) return
    if (!online) {
      setError('Estás sin conexión. El chat en vivo volverá cuando tengas internet.')
      return
    }

    setSending(true)
    setError('')

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_room_id: roomId,
      sender_id: currentUserId,
      message: cleanMessage,
      created_at: new Date().toISOString(),
      profiles: { full_name: currentUserName, role: null }
    }

    setMessages((current) => [...current, optimistic])
    setMessage('')
    if (selectedContactId) {
      setPreviewByContact((current) => ({ ...current, [selectedContactId]: cleanMessage }))
      setActivityByContact((current) => ({ ...current, [selectedContactId]: Date.now() }))
    }
    scrollBottom()

    const { error } = await supabase.from('chat_messages').insert({
      chat_room_id: roomId,
      sender_id: currentUserId,
      message: cleanMessage
    })

    if (error) {
      setError(error.message)
      setMessages((current) => current.filter((item) => item.id !== optimistic.id))
    } else {
      await loadMessages(roomId)
    }

    setSending(false)
  }

  const nav = mobileNavItems(pathname)

  const ContactsList = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#09071a] md:border-r md:border-violet-400/10">
      <div className="sticky top-0 z-20 shrink-0 border-b border-violet-400/10 bg-[#0a071d]/95 px-4 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] shadow-xl shadow-black/20 backdrop-blur md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="hidden text-xs font-black uppercase tracking-[0.22em] text-emerald-300 md:block">Inbox · operativo</p>
            <h2 className="truncate text-2xl font-black text-white md:mt-1 md:text-xl">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestNotifications}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/12 text-violet-200 transition hover:bg-violet-500/25"
              title={notificationPermission === 'granted' ? 'Notificaciones activas' : 'Activar notificaciones'}
              aria-label={notificationPermission === 'granted' ? 'Notificaciones activas' : 'Activar notificaciones'}
            >
              {notificationPermission === 'granted' || audioEnabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111026] text-slate-300">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-full border border-violet-400/10 bg-[#151329] px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            placeholder="Buscar o iniciar chat..."
          />
        </div>
      </div>

      <div className="chat-scrollbar flex-1 overflow-y-auto px-0 py-2 pb-24 md:pb-4">
        {filteredContacts.length === 0 ? (
          <div className="m-3 rounded-3xl border border-dashed border-violet-400/15 bg-white/[.03] p-6 text-center text-sm text-slate-500">
            No hay contactos disponibles.
          </div>
        ) : null}

        {filteredContacts.map((contact) => {
          const isActive = contact.id === selectedContactId
          const unread = unreadByContact[contact.id] || 0
          const preview = previewByContact[contact.id]
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => handleSelectContact(contact.id)}
              className={`group flex w-full items-center gap-3 border-l-4 px-3 py-3 text-left transition active:scale-[0.99] ${
                isActive ? 'border-violet-500 bg-violet-500/[.08]' : 'border-transparent hover:bg-white/[.035]'
              }`}
            >
              <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-black ring-1 ring-white/[.04] md:h-11 md:w-11 ${avatarColorClass(contact)}`}>
                {initials(contact)}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#09071a] bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1 pb-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[15px] font-black text-white md:text-sm">{contact.full_name || contact.email}</p>
                  <span className={`shrink-0 text-[11px] font-bold ${unread ? 'text-emerald-300' : 'text-slate-500'}`}>{activityByContact[contact.id] ? new Date(activityByContact[contact.id]).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : roleLabel(contact.role)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="truncate text-[12px] font-semibold text-slate-400 md:text-xs">
                    {preview || `${positionLabel(contact)} · ${roleLabel(contact.role)}`}
                  </p>
                  {unread > 0 ? (
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 px-2 text-[11px] font-black text-[#050315]">
                      {unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-400/10 bg-[#0a071d]/95 px-2 pb-[calc(.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <nav className="grid grid-cols-4 gap-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[11px] font-black transition active:scale-95 ${active ? 'text-emerald-300' : 'text-slate-400'}`}>
                <span className={`flex h-8 min-w-12 items-center justify-center rounded-full ${active ? 'bg-emerald-400/15 text-emerald-300' : 'text-slate-400'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )

  const Conversation = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#070516]">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-violet-400/10 bg-[#0a071d]/95 px-3 py-3 pt-[calc(.75rem+env(safe-area-inset-top))] shadow-xl shadow-black/20 backdrop-blur md:px-5 md:py-4">
        <button
          type="button"
          onClick={() => setMobileConversationOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[.05] text-white transition hover:bg-white/[.08] md:hidden"
          aria-label="Volver a contactos"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-black ring-1 ring-white/[.04] md:h-12 md:w-12 ${selectedContact ? avatarColorClass(selectedContact) : 'from-violet-500 to-purple-700 text-white'}`}>
          {selectedContact ? initials(selectedContact) : <Users className="h-5 w-5" />}
          {selectedContact ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a071d] bg-emerald-400" /> : null}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-black text-white md:text-lg">
            {selectedContact ? selectedContact.full_name || selectedContact.email : 'Selecciona un contacto'}
          </h1>
          <p className="truncate text-xs font-semibold text-slate-400">
            {selectedContact ? `${positionLabel(selectedContact)} · ${roleLabel(selectedContact.role)} · en línea` : helper || `Sesión iniciada como ${currentUserName}`}
          </p>
        </div>

        <button type="button" className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/[.04] text-slate-300 hover:bg-white/[.08] md:flex">
          <Search className="h-5 w-5" />
        </button>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[.04] text-slate-300 hover:bg-white/[.08]">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {!online ? (
        <div className="mx-3 mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 md:mx-5 md:mt-5">
          Estás offline. Puedes leer mensajes cargados, pero no enviar ni recibir nuevos hasta volver a conectarte.
        </div>
      ) : null}

      {error ? (
        <div className="mx-3 mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 md:mx-5 md:mt-5">
          {error}
        </div>
      ) : null}

      <div className="chat-wall chat-scrollbar flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6">
        {!selectedContact ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Users className="mb-3 h-10 w-10 text-violet-300" />
            <p className="font-bold">Elige un contacto para iniciar el chat.</p>
          </div>
        ) : loadingMessages || loadingRoom ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-violet-300" />
            <p className="font-bold">Cargando conversación...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <MessageCircle className="mb-3 h-10 w-10 text-emerald-300" />
            <p className="font-black text-white">Todavía no hay mensajes.</p>
            <p className="mt-1 text-sm">Escribe el primer mensaje abajo.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-2 pb-2">
            {messages.map((msg) => {
              const mine = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`relative max-w-[86%] rounded-[1.35rem] px-4 py-2.5 shadow-lg md:max-w-[56%] ${
                      mine
                        ? 'rounded-br-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-violet-950/30'
                        : 'rounded-bl-md bg-[#1a2538] text-slate-100 shadow-black/20'
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-emerald-300">
                        {msg.profiles?.full_name || selectedContact.full_name || 'Usuario'}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6">{msg.message}</p>
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold ${mine ? 'text-white/70' : 'text-slate-500'}`}>
                      <span>{formatMessageTime(msg.created_at)}</span>
                      {mine ? <Check className="h-3 w-3" /> : null}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="sticky bottom-0 z-20 bg-[#0a071d]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur md:p-4">
        <div className="mx-auto flex w-full max-w-5xl items-end gap-2 md:gap-3">
        <input
          ref={inputRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-12 flex-1 rounded-full border border-violet-400/10 bg-[#151329] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60"
          placeholder={!online ? 'Sin conexión...' : selectedContact ? 'Escribe un mensaje...' : 'Selecciona un contacto primero'}
          disabled={!online || !selectedContact || !roomId || sending}
        />
        <button
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-5"
          disabled={!online || !selectedContact || !roomId || sending}
          aria-label="Enviar mensaje"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="ml-2 hidden text-sm font-black md:inline">Enviar</span>
        </button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050315]">
      {incomingToast ? (
        <button
          type="button"
          onClick={() => {
            if (incomingToast.contactId) handleSelectContact(incomingToast.contactId)
            setIncomingToast(null)
          }}
          className="fixed right-3 top-3 z-50 flex w-[calc(100%-1.5rem)] max-w-sm items-start gap-3 rounded-3xl border border-violet-400/30 bg-[#0a071d]/95 p-3 text-left shadow-2xl shadow-black/40 backdrop-blur md:right-6 md:top-6"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Nuevo mensaje</p>
            <p className="mt-0.5 truncate text-sm font-black text-white">{incomingToast.senderName}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{incomingToast.message}</p>
          </div>
          <span
            onClick={(event) => {
              event.stopPropagation()
              setIncomingToast(null)
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[.05] text-slate-400"
          >
            <X className="h-4 w-4" />
          </span>
        </button>
      ) : null}

      <div className="h-full md:hidden">
        {mobileConversationOpen ? Conversation : ContactsList}
      </div>

      <div className="hidden h-full md:grid md:grid-cols-[390px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)]">
        {ContactsList}
        {Conversation}
      </div>
    </div>
  )
}
