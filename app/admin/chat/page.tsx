'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { AdminIconButton, AdminSelect } from '@/components/admin/admin-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  userId: string | null
  guestName: string | null
  guestEmail: string | null
  customerName?: string | null
  customerEmail?: string | null
  subject: string | null
  status: 'open' | 'closed'
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  sessionId: string
  role: 'user' | 'admin'
  senderName: string | null
  content: string
  createdAt: string
}

function sessionName(session: Session) {
  return session.guestName ?? session.customerName ?? 'Customer'
}

function sessionEmail(session: Session) {
  return session.guestEmail ?? session.customerEmail ?? 'No email provided'
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const sessionsRequestInFlight = useRef(false)
  const messagesRequestInFlight = useRef<string | null>(null)

  const activeSession = sessions.find(session => session.id === activeSessionId) ?? null
  activeSessionIdRef.current = activeSessionId
  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sessions.filter(session => {
      if (statusFilter !== 'all' && session.status !== statusFilter) return false
      if (!query) return true
      return [sessionName(session), sessionEmail(session), session.subject]
        .some(value => value?.toLowerCase().includes(query))
    })
  }, [search, sessions, statusFilter])

  const fetchSessions = useCallback(async (showLoading = false) => {
    if (sessionsRequestInFlight.current) return
    sessionsRequestInFlight.current = true
    if (showLoading) setLoadingSessions(true)
    try {
      const response = await apiFetch('/api/chat')
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Failed to load conversations')
      setSessions((Array.isArray(data) ? data : data.data ?? []) as Session[])
      setSessionsError(null)
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Failed to load conversations')
    } finally {
      sessionsRequestInFlight.current = false
      if (showLoading) setLoadingSessions(false)
    }
  }, [])

  const fetchMessages = useCallback(async (sessionId: string, showLoading = false) => {
    if (messagesRequestInFlight.current === sessionId) return
    messagesRequestInFlight.current = sessionId
    if (showLoading) setLoadingMessages(true)
    try {
      const response = await apiFetch(`/api/chat/${sessionId}/messages`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Failed to load messages')
      if (activeSessionIdRef.current === sessionId) {
        setMessages((Array.isArray(data) ? data : data.data ?? []) as Message[])
        setMessagesError(null)
      }
    } catch (error) {
      if (activeSessionIdRef.current === sessionId) {
        setMessagesError(error instanceof Error ? error.message : 'Failed to load messages')
      }
    } finally {
      if (messagesRequestInFlight.current === sessionId) messagesRequestInFlight.current = null
      if (showLoading && activeSessionIdRef.current === sessionId) setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    void fetchSessions(true)
    const interval = window.setInterval(() => void fetchSessions(), 10_000)
    return () => window.clearInterval(interval)
  }, [fetchSessions])

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      setMessagesError(null)
      return
    }
    void fetchMessages(activeSessionId, true)
    const interval = window.setInterval(() => void fetchMessages(activeSessionId), 4_000)
    return () => window.clearInterval(interval)
  }, [activeSessionId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    const content = reply.trim()
    if (!content || !activeSession || activeSession.status === 'closed') return

    setSending(true)
    try {
      const response = await apiFetch(`/api/chat/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Failed to send reply')
      const message = (data.data ?? data) as Message
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message])
      setReply('')
      setMessagesError(null)
      void fetchSessions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reply'
      setMessagesError(message)
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  async function updateSessionStatus() {
    if (!activeSession) return
    const nextStatus = activeSession.status === 'open' ? 'closed' : 'open'
    setUpdatingStatus(true)
    try {
      const response = await apiFetch(`/api/chat/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Failed to update conversation')
      const updated = (data.data ?? data) as Session
      setSessions(current => current.map(session => session.id === updated.id
        ? { ...session, ...updated }
        : session))
      toast.success(nextStatus === 'closed' ? 'Conversation closed' : 'Conversation reopened')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update conversation')
    } finally {
      setUpdatingStatus(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendReply()
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[32rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(31,36,33,0.03)] md:flex-row">
      <aside className={cn(
        'flex min-h-0 flex-col border-border md:w-80 md:shrink-0 md:border-r',
        activeSession ? 'hidden md:flex' : 'flex h-full w-full',
      )}>
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-base font-semibold">
                <MessageCircle className="h-4 w-4 text-primary" /> Live Chat
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sessions.filter(session => session.status === 'open').length} open · {sessions.length} total
              </p>
            </div>
            <AdminIconButton label="Refresh conversations" onClick={() => void fetchSessions(true)} disabled={loadingSessions}>
              <RefreshCw className={cn('h-4 w-4', loadingSessions && 'animate-spin')} />
            </AdminIconButton>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations..." aria-label="Search conversations" className="h-9 pl-9" />
          </div>
          <AdminSelect value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter conversations by status" className="h-9">
            <option value="all">All conversations</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </AdminSelect>
        </div>

        {sessionsError && sessions.length === 0 ? (
          <div className="m-4 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-destructive">{sessionsError}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchSessions(true)}>Try again</Button>
          </div>
        ) : (
          <div className="flex-1 divide-y divide-border overflow-y-auto">
            {sessionsError ? (
              <div className="flex items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                <span>Updates are delayed. Showing the last loaded conversations.</span>
                <Button variant="link" size="sm" className="h-auto shrink-0 p-0 text-amber-800" onClick={() => void fetchSessions(true)}>Retry</Button>
              </div>
            ) : null}
            {loadingSessions && sessions.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading conversations...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No conversations found</p>
                <p className="mt-1 text-xs text-muted-foreground">New customer messages will appear here.</p>
              </div>
            ) : filteredSessions.map(session => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                className={cn('w-full border-l-2 border-transparent px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary', activeSessionId === session.id && 'border-l-primary bg-accent')}
                aria-pressed={activeSessionId === session.id}
              >
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{sessionName(session)}</span>
                  <span className={cn('ml-auto h-2 w-2 shrink-0 rounded-full', session.status === 'open' ? 'bg-primary' : 'bg-muted-foreground/35')} aria-label={session.status} />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{session.subject ?? 'General enquiry'}</p>
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" /> {formatUpdatedAt(session.updatedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </aside>

      {!activeSession ? (
        <div className="hidden flex-1 items-center justify-center px-6 text-muted-foreground md:flex">
          <div className="max-w-xs text-center">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-25" />
            <p className="text-sm font-medium text-foreground">Select a conversation</p>
            <p className="mt-1 text-xs">Choose a customer from the list to read and reply.</p>
          </div>
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col" aria-label={`Conversation with ${sessionName(activeSession)}`}>
          <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <AdminIconButton label="Back to conversations" className="-ml-1 md:hidden" onClick={() => setActiveSessionId(null)}><ChevronLeft className="h-4 w-4" /></AdminIconButton>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{sessionName(activeSession)}</p>
              <p className="truncate text-xs text-muted-foreground">{sessionEmail(activeSession)} · {activeSession.subject ?? 'General enquiry'}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Badge variant={activeSession.status === 'open' ? 'default' : 'secondary'}>{activeSession.status}</Badge>
              <Button variant="outline" size="sm" className="h-8" onClick={() => void updateSessionStatus()} disabled={updatingStatus}>
                {updatingStatus ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                {activeSession.status === 'open' ? 'Close' : 'Reopen'}
              </Button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messagesError ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-center text-sm text-destructive">
                {messagesError}
                <Button variant="link" size="sm" className="ml-1 h-auto p-0 text-destructive" onClick={() => void fetchMessages(activeSession.id, true)}>Retry</Button>
              </div>
            ) : null}
            {loadingMessages && messages.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium">No messages yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Send the first reply to begin this conversation.</p>
              </div>
            ) : messages.map(message => (
              <div key={message.id} className={cn('flex', message.role === 'admin' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[82%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%]', message.role === 'admin' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted text-foreground')}>
                  {message.role !== 'admin' ? <p className="mb-0.5 text-[10px] font-semibold opacity-60">{message.senderName ?? 'Customer'}</p> : null}
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                  <p className={cn('mt-1 text-[10px] opacity-55', message.role === 'admin' && 'text-right')}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <footer className="shrink-0 border-t border-border p-3 sm:p-4">
            {activeSession.status === 'closed' ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
                <p className="text-sm text-muted-foreground">This conversation is closed.</p>
                <Button variant="outline" size="sm" onClick={() => void updateSessionStatus()} disabled={updatingStatus}>Reopen</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input value={reply} onChange={event => setReply(event.target.value)} onKeyDown={handleKeyDown} placeholder="Type a reply..." aria-label="Reply message" className="h-10 flex-1" maxLength={5000} disabled={sending} />
                <Button size="icon" aria-label="Send reply" className="h-10 w-10 shrink-0" onClick={() => void sendReply()} disabled={sending || !reply.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </footer>
        </section>
      )}
    </div>
  )
}
