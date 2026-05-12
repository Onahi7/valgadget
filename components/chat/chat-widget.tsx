'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, ChevronDown, Loader2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'admin'
  senderName: string | null
  content: string
  createdAt: string
}

const POLL_INTERVAL = 5000 // poll every 5s for new messages

export function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [unread, setUnread] = useState(0)

  // Guest info form
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [showForm, setShowForm] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Auto-fill for logged in users
  useEffect(() => {
    if (user) {
      setGuestName(user.name ?? '')
      setGuestEmail(user.email ?? '')
      setShowForm(false) // skip form for logged in users, start session immediately on open
    }
  }, [user])

  const fetchMessages = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/${sid}/messages`)
      const json = await res.json()
      if (json.data) {
        setMessages(prev => {
          const newMsgs = json.data as ChatMessage[]
          if (!open && newMsgs.length > prev.length) {
            setUnread(u => u + (newMsgs.length - prev.length))
          }
          return newMsgs
        })
      }
    } catch { /* silent */ }
  }, [open])

  // Poll for new messages when session is open
  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId)
      pollRef.current = setInterval(() => fetchMessages(sessionId), POLL_INTERVAL)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [sessionId, fetchMessages])

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(scrollToBottom, 80) }
  }, [open, messages])

  const startSession = async () => {
    if (!user && (!guestEmail.trim() || !guestName.trim())) return
    setStarting(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = localStorage.getItem('token')
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: subject.trim() || 'General enquiry',
          guestName: guestName.trim() || user?.name,
          guestEmail: guestEmail.trim() || user?.email,
        }),
      })
      const json = await res.json()
      if (json.data?.id) {
        setSessionId(json.data.id)
        setShowForm(false)
        // Send welcome context message
        setTimeout(() => sendMessage("Hello! I'd like to ask about your products.", json.data.id), 300)
      }
    } catch { /* ignore */ }
    setStarting(false)
  }

  const sendMessage = async (text?: string, sid?: string) => {
    const content = (text ?? input).trim()
    const activeSession = sid ?? sessionId
    if (!content || !activeSession) return
    if (!text) setInput('')
    setSending(true)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const res = await fetch(`/api/chat/${activeSession}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, senderName: user?.name ?? guestName }),
      })
      const json = await res.json()
      if (json.data) setMessages(prev => [...prev, json.data])
      setTimeout(scrollToBottom, 50)
    } catch { /* ignore */ }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div className={cn(
        'fixed bottom-36 md:bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right',
        open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none',
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border rounded-t-2xl bg-primary text-primary-foreground">
          <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-none">ValGadget Support</p>
            <p className="text-xs text-primary-foreground/70 mt-0.5">We typically reply within minutes</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px]">
          {/* Guest form */}
          {showForm && !user && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Tell us who you are to start chatting:</p>
              <div>
                <Label className="text-xs">Your Name *</Label>
                <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Alex Johnson" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="alex@example.com" type="email" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Price negotiation, product question…" className="mt-1 h-8 text-sm" />
              </div>
              <Button size="sm" className="w-full" onClick={startSession} disabled={starting || !guestName.trim() || !guestEmail.trim()}>
                {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Start Chat
              </Button>
            </div>
          )}

          {/* Logged in — start session prompt */}
          {!sessionId && user && (
            <div className="space-y-3 text-center py-4">
              <Bot className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Hi <strong>{user.name}</strong>! Ask us anything or negotiate a price.</p>
              <div>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's your question about?" className="h-8 text-sm mb-2" />
                <Button size="sm" className="w-full" onClick={startSession} disabled={starting}>
                  {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Start Chat
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          {sessionId && messages.map(msg => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm',
              )}>
                {msg.role === 'admin' && (
                  <p className="text-[10px] font-semibold opacity-60 mb-0.5">Support</p>
                )}
                <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={cn('text-[10px] mt-1 opacity-50', msg.role === 'user' ? 'text-right' : 'text-left')}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {sessionId && messages.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <p>Session started. Send your first message!</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {sessionId && (
          <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              className="h-9 text-sm flex-1"
              disabled={sending}
            />
            <Button size="icon" className="w-9 h-9 shrink-0" onClick={() => sendMessage()} disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
