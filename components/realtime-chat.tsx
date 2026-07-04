'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Bell, BellRing, Check, Loader2, MessageCircle, Search, Send, Users, X } from 'lucide-react'
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
  return contact.position || 'Guía'
}

function initials(contact?: Contact | null) {
  const label = contact?.full_name || contact?.email || 'U'
  return label.slice(0, 1).toUpperCase()
}

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function RealtimeChat({ currentUserId, currentUserName, contacts, title = 'Chat en vivo', helper }: RealtimeChatProps) {
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
  const [online, setOnline] = useState(true)

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId)

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
      first.frequency.setValueAtTime(880, now)
      second.frequency.setValueAtTime(1174, now + 0.08)
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
      // Algunos navegadores bloquean sonido hasta que el usuario toque la pantalla.
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
    if (!term) return contacts
    return contacts.filter((contact) => {
      const fullName = contact.full_name?.toLowerCase() || ''
      const email = contact.email?.toLowerCase() || ''
      const role = roleLabel(contact.role).toLowerCase()
      const position = positionLabel(contact).toLowerCase()
      return fullName.includes(term) || email.includes(term) || role.includes(term) || position.includes(term)
    })
  }, [contacts, search])

  useEffect(() => {
    const targetFromUrl = new URLSearchParams(window.location.search).get('contact')
    if (targetFromUrl && contacts.some((contact) => contact.id === targetFromUrl)) {
      setSelectedContactId(targetFromUrl)
      setMobileConversationOpen(true)
      return
    }

    if (contacts[0]?.id && !selectedContactId) {
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
      setMessages((data as unknown as ChatMessage[]) || [])
      scrollBottom(false)
    }
    setLoadingMessages(false)
  }, [scrollBottom, supabase])

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

  const ContactsList = (
    <div className="flex h-full min-h-[72vh] flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/20 md:min-h-[700px]">
      <div className="border-b border-slate-800 bg-slate-950/95 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">Contactos</p>
            <h2 className="mt-1 text-xl font-black text-white md:text-2xl">Mensajes</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestNotifications}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/10 text-sky-300 transition hover:bg-sky-500/20"
              title={notificationPermission === 'granted' ? 'Notificaciones activas' : 'Activar notificaciones'}
              aria-label={notificationPermission === 'granted' ? 'Notificaciones activas' : 'Activar notificaciones'}
            >
              {notificationPermission === 'granted' || audioEnabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
            placeholder="Buscar contacto..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-3">
        {filteredContacts.length === 0 ? (
          <div className="m-2 rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">
            No hay contactos disponibles.
          </div>
        ) : null}

        {filteredContacts.map((contact) => {
          const isActive = contact.id === selectedContactId
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => handleSelectContact(contact.id)}
              className={`mb-2 flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition active:scale-[0.99] md:p-4 ${
                isActive ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-transparent bg-slate-900/50 hover:border-slate-800 hover:bg-slate-900'
              }`}
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-base font-black text-slate-950 md:h-12 md:w-12">
                {initials(contact)}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-black text-white md:text-base">{contact.full_name || contact.email}</p>
                  {(unreadByContact[contact.id] || 0) > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-400 px-2 text-[11px] font-black text-slate-950">
                      {unreadByContact[contact.id]}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500">Ahora</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                  {positionLabel(contact)} · {roleLabel(contact.role)} {contact.email ? `· ${contact.email}` : ''}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const Conversation = (
    <div className="flex h-[calc(100dvh-120px)] min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-2xl shadow-black/20 md:h-auto md:min-h-[700px]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-800 bg-slate-950/95 p-3 backdrop-blur md:p-5">
        <button
          type="button"
          onClick={() => setMobileConversationOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 md:hidden"
          aria-label="Volver a contactos"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-base font-black text-slate-950 md:h-12 md:w-12">
          {selectedContact ? initials(selectedContact) : <Users className="h-5 w-5" />}
          {selectedContact ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" /> : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-400 md:hidden">{title}</p>
          <h1 className="truncate text-base font-black text-white md:text-2xl">
            {selectedContact ? selectedContact.full_name || selectedContact.email : 'Selecciona un contacto'}
          </h1>
          <p className="truncate text-xs font-semibold text-slate-500 md:text-sm">
            {selectedContact ? `${positionLabel(selectedContact)} · ${roleLabel(selectedContact.role)} · En línea` : helper || `Sesión iniciada como ${currentUserName}`}
          </p>
        </div>
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

      <div className="chat-wall flex-1 overflow-y-auto p-3 md:p-5">
        {!selectedContact ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Users className="mb-3 h-10 w-10" />
            <p className="font-bold">Elige un contacto para iniciar el chat.</p>
          </div>
        ) : loadingMessages || loadingRoom ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Loader2 className="mb-3 h-10 w-10 animate-spin" />
            <p className="font-bold">Cargando conversación...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <MessageCircle className="mb-3 h-10 w-10 text-emerald-400" />
            <p className="font-black text-white">Todavía no hay mensajes.</p>
            <p className="mt-1 text-sm">Escribe el primer mensaje abajo.</p>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {messages.map((msg) => {
              const mine = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`relative max-w-[86%] rounded-3xl px-4 py-2.5 shadow-lg md:max-w-[72%] ${
                      mine
                        ? 'rounded-br-md bg-emerald-500 text-slate-950 shadow-emerald-950/20'
                        : 'rounded-bl-md bg-slate-800 text-slate-100 shadow-black/20'
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-sky-300">
                        {msg.profiles?.full_name || selectedContact.full_name || 'Usuario'}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6">{msg.message}</p>
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold ${mine ? 'text-slate-800/70' : 'text-slate-500'}`}>
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

      <form onSubmit={handleSend} className="sticky bottom-0 flex items-end gap-2 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:gap-3 md:p-4">
        <input
          ref={inputRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-12 flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          placeholder={!online ? 'Sin conexión...' : selectedContact ? 'Mensaje...' : 'Selecciona un contacto primero'}
          disabled={!online || !selectedContact || !roomId || sending}
        />
        <button
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-5"
          disabled={!online || !selectedContact || !roomId || sending}
          aria-label="Enviar mensaje"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="ml-2 hidden text-sm font-black md:inline">Enviar</span>
        </button>
      </form>
    </div>
  )

  return (
    <div className="relative -mx-2 md:mx-0">
      {incomingToast ? (
        <button
          type="button"
          onClick={() => {
            if (incomingToast.contactId) handleSelectContact(incomingToast.contactId)
            setIncomingToast(null)
          }}
          className="fixed right-3 top-3 z-50 flex w-[calc(100%-1.5rem)] max-w-sm items-start gap-3 rounded-3xl border border-sky-400/30 bg-slate-950/95 p-3 text-left shadow-2xl shadow-black/40 backdrop-blur md:right-6 md:top-6"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-400 text-slate-950">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Nuevo mensaje</p>
            <p className="mt-0.5 truncate text-sm font-black text-white">{incomingToast.senderName}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{incomingToast.message}</p>
          </div>
          <span
            onClick={(event) => {
              event.stopPropagation()
              setIncomingToast(null)
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-400"
          >
            <X className="h-4 w-4" />
          </span>
        </button>
      ) : null}
      <div className="md:hidden">
        {mobileConversationOpen ? Conversation : ContactsList}
      </div>

      <div className="hidden gap-6 md:grid xl:grid-cols-[360px_1fr]">
        {ContactsList}
        {Conversation}
      </div>
    </div>
  )
}
