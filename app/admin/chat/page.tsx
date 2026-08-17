'use client'

import { useState, useEffect, useRef } from 'react'
import { getToken } from '@/lib/api-client'
import { MessageCircle, Send, Loader2, User, Clock, CheckCircle, XCircle, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  userId: string | null
  guestName: string | null
  guestEmail: string | null
  subject: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  sessionId: string
  role: string
  senderName: string | null
  content: string
  createdAt: string
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions()
    const iv = setInterval(fetchSessions, 10000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (activeSession) fetchMessages(activeSession.id)
  }, [activeSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchSessions() {
    const res = await fetch('/api/chat', { headers: { Authorization: `Bearer ${getToken()}` }, credentials: 'include' })
    const json = await res.json()
    if (json.data) setSessions(json.data)
  }

  async function fetchMessages(sid: string) {
    setLoadingMsgs(true)
    const res = await fetch(`/api/chat/${sid}/messages`, { headers: { Authorization: `Bearer ${getToken()}` }, credentials: 'include' })
    const json = await res.json()
    if (json.data) setMessages(json.data)
    setLoadingMsgs(false)
  }

  async function sendReply() {
    if (!reply.trim() || !activeSession) return
    setSending(true)
    const res = await fetch(`/api/chat/${activeSession.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
      body: JSON.stringify({ content: reply.trim(), role: 'admin', senderName: 'Support' }),
    })
    const json = await res.json()
    if (json.data) { setMessages(prev => [...prev, json.data]); setReply('') }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col md:flex-row rounded-lg border border-border overflow-hidden bg-card">
      {/* Session list — full width on mobile, sidebar on desktop */}
      <div className={cn(
        'border-b md:border-b-0 md:border-r border-border flex flex-col',
        activeSession ? 'hidden md:flex md:w-72 md:shrink-0' : 'w-full md:w-72 md:shrink-0'
      )}>
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> Live Chat Sessions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{sessions.length} sessions</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[50vh] md:max-h-none">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center p-8">No chat sessions yet</p>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-accent transition-colors',
                activeSession?.id === s.id && 'bg-accent border-l-2 border-primary',
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{s.guestName ?? 'Anonymous'}</span>
                <Badge variant={s.status === 'open' ? 'default' : 'secondary'} className="ml-auto text-[10px] py-0 h-4">
                  {s.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{s.subject ?? 'No subject'}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(s.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Message panel */}
      {!activeSession ? (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a session to view messages</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Session header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveSession(null)}
              className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Back to sessions"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{activeSession.guestName ?? 'Anonymous'}</p>
              <p className="text-xs text-muted-foreground truncate">{activeSession.guestEmail} · {activeSession.subject}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge variant={activeSession.status === 'open' ? 'default' : 'secondary'}>{activeSession.status}</Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs && (
              <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.role === 'admin' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'admin'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}>
                  {msg.role !== 'admin' && (
                    <p className="text-[10px] font-semibold opacity-60 mb-0.5">{msg.senderName ?? 'Customer'}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  <p className={cn('text-[10px] mt-1 opacity-50', msg.role === 'admin' ? 'text-right' : 'text-left')}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && !loadingMsgs && (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0">
            <Input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a reply…"
              className="flex-1 h-9"
              disabled={sending}
            />
            <Button size="icon" className="w-9 h-9 shrink-0" onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
