import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Trash2, Sparkles, ShieldCheck } from 'lucide-react'
import Layout from '../components/layout/Layout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Skeleton } from '../components/ui/Skeleton'
import { LogoMark } from '../components/brand/Logo'
import { useIsMobile } from '../hooks/useIsMobile'
import { getChatHistory, sendChatMessage, clearChatHistory, getUserStatus } from '../api/endpoints'
import { timeGreeting, firstName } from '../utils/greeting'

const MAX_LENGTH = 1000
// Away this long → greet the user again when they open the chat
const GREETING_AFTER_MS = 6 * 60 * 60 * 1000

const SUGGESTIONS = [
  'How much did I spend this month?',
  'Where does most of my money go?',
  'How am I doing vs last month?',
  'Any unusual spending lately?',
]

function AdvisorAvatar() {
  return (
    <span className="mt-0.5 shrink-0">
      <LogoMark size={26} />
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <AdvisorAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3.5 shadow-card">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${delay}ms`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
    </div>
  )
}

function Bubble({ role, content, local = false }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[13.5px] leading-relaxed text-white shadow-[0_2px_10px_var(--accent-glow)] md:max-w-[70%]">
          {content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-end gap-2.5">
      <AdvisorAvatar />
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md border px-4 py-2.5 text-[13.5px] leading-relaxed text-text shadow-card md:max-w-[70%] ${
          local ? 'border-accent/25 bg-accent-soft' : 'border-border bg-card'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

export default function Chat() {
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [localBubbles, setLocalBubbles] = useState([]) // errors / rate-limit notices, not persisted
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  // Snapshot of when the chat was opened — used for the greeting staleness
  // check so it stays stable (and pure) across re-renders
  const [openedAt] = useState(() => Date.now())
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: getChatHistory,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const messages = useMemo(() => historyData?.messages ?? [], [historyData])

  // Greet on first visit or after a long time away — locally, so it's instant
  const greeting = useMemo(() => {
    if (isLoading) return null
    const last = messages[messages.length - 1]
    const stale = !last || openedAt - last.at > GREETING_AFTER_MS
    if (!stale) return null
    const name = firstName(status?.name)
    const hello = `${timeGreeting(new Date(openedAt))}${name ? `, ${name}` : ''}! 👋`
    const body = messages.length === 0
      ? "I'm your LedgerMind advisor. Ask me anything about your money — spending, income, categories, merchants — and I'll answer from your actual transactions."
      : 'Good to see you again. What would you like to know about your money today?'
    return `${hello} ${body}`
  }, [isLoading, messages, status, openedAt])

  const appendToHistory = (entries) => {
    queryClient.setQueryData(['chat-history'], (old) => ({
      messages: [...(old?.messages ?? []), ...entries],
    }))
  }

  const mutation = useMutation({
    mutationFn: sendChatMessage,
    onMutate: (text) => {
      appendToHistory([{ role: 'user', content: text, at: Date.now() }])
      setLocalBubbles([])
    },
    onSuccess: (reply) => {
      appendToHistory([reply])
    },
    onError: (error) => {
      const rateLimited = error?.response?.status === 429
      setLocalBubbles([
        {
          role: 'assistant',
          local: true,
          content: rateLimited
            ? "You're sending messages a little fast — give me a minute to catch up, then try again."
            : 'Sorry, something went wrong on my end. Please try that again in a moment.',
        },
      ])
    },
    onSettled: () => {
      // Hand focus back so the user can keep the conversation flowing
      setTimeout(() => inputRef.current?.focus(), 50)
    },
  })

  const send = (text) => {
    const message = (text ?? input).trim()
    if (!message || message.length > MAX_LENGTH || mutation.isPending) return
    setInput('')
    mutation.mutate(message)
  }

  const clearMutation = useMutation({
    mutationFn: clearChatHistory,
    onSuccess: () => {
      queryClient.setQueryData(['chat-history'], { messages: [] })
      setLocalBubbles([])
      setShowClearConfirm(false)
    },
  })

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, localBubbles, mutation.isPending])

  const showSuggestions = !isLoading && messages.length === 0 && !mutation.isPending

  return (
    <Layout>
      <div
        className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card"
        style={{
          height: isMobile
            ? 'calc(100dvh - 178px - env(safe-area-inset-bottom))'
            : 'calc(100dvh - 8rem)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark size={34} />
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-1.5 text-sm font-bold text-text">
                Advisor
                <Sparkles size={13} className="text-accent-strong" />
              </p>
              <p className="m-0 truncate text-[11px] text-muted">
                Answers from your real transactions · never shared
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear conversation"
              aria-label="Clear conversation"
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border-none bg-transparent text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-end gap-2.5">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-16 w-3/5 rounded-2xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-2/5 rounded-2xl" />
              </div>
            </div>
          ) : (
            <>
              {greeting && <Bubble role="assistant" content={greeting} />}

              {messages.map((m, i) => (
                <Bubble key={`${m.at}-${i}`} role={m.role} content={m.content} />
              ))}

              {localBubbles.map((m, i) => (
                <Bubble key={`local-${i}`} role={m.role} content={m.content} local />
              ))}

              {mutation.isPending && <TypingIndicator />}

              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pl-9">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="cursor-pointer rounded-full border border-border bg-elev px-3.5 py-2 text-xs font-medium text-sub transition-all hover:border-accent hover:text-accent-strong"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3 md:p-4">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={mutation.isPending ? 'Advisor is thinking…' : 'Ask about your money…'}
              disabled={mutation.isPending}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border-[1.5px] border-border bg-input px-4 py-2.5 text-[13.5px] leading-relaxed text-text outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60"
              style={{ fieldSizing: 'content' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || mutation.isPending}
              aria-label="Send message"
              className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl border-none bg-accent text-white shadow-[0_2px_12px_var(--accent-glow)] transition-all active:scale-90 disabled:pointer-events-none disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
          <p className="m-0 mt-1.5 flex items-center justify-center gap-1 text-center text-[10px] text-muted">
            <ShieldCheck size={10} />
            The advisor only sees your LedgerMind transactions. Replies can take a few seconds.
          </p>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          icon={Trash2}
          title="Clear this conversation?"
          message="The advisor will forget everything you've discussed so far. Your transactions are not affected."
          confirmLabel="Clear chat"
          confirmingLabel="Clearing…"
          isConfirming={clearMutation.isPending}
          onConfirm={() => clearMutation.mutate()}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </Layout>
  )
}
