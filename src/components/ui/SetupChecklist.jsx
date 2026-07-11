import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Check, Mail, Send, Landmark, ChevronRight, Rocket } from 'lucide-react'
import { connectGmail } from '../../api/endpoints'
import TelegramLinkModal from './TelegramLinkModal'

/**
 * Shown on the dashboard until Gmail + bank + Telegram are all connected.
 * Gives new users a clear, satisfying path to a fully-automated ledger.
 */
export default function SetupChecklist({ status }) {
  const navigate = useNavigate()
  const [showTelegramModal, setShowTelegramModal] = useState(false)

  const gmailMutation = useMutation({
    mutationFn: connectGmail,
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const items = [
    {
      key: 'gmail',
      label: 'Connect Gmail',
      hint: 'Auto-capture transactions from bank alerts',
      icon: Mail,
      done: !!status?.gmailConnected,
      onClick: () => gmailMutation.mutate(),
      busy: gmailMutation.isPending,
    },
    {
      key: 'bank',
      label: 'Choose your bank',
      hint: 'Tell us whose alerts to read',
      icon: Landmark,
      done: !!status?.bankCode,
      onClick: () => navigate('/settings'),
    },
    {
      key: 'telegram',
      label: 'Link Telegram',
      hint: 'Notifications + AI advisor chat',
      icon: Send,
      done: !!status?.telegramLinked,
      onClick: () => setShowTelegramModal(true),
    },
  ]

  const doneCount = items.filter((i) => i.done).length
  if (!status || doneCount === items.length) return null

  return (
    <div className="animate-fade-in-up mb-5 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent-strong">
            <Rocket size={15} />
          </span>
          <div>
            <p className="m-0 text-[13px] font-bold text-text">Finish setting up LedgerMind</p>
            <p className="m-0 text-[11px] text-muted">{doneCount} of {items.length} complete</p>
          </div>
        </div>
        <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-elev sm:block">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
        {items.map(({ key, label, hint, icon: Icon, done, onClick, busy }) => (
          <button
            key={key}
            onClick={done ? undefined : onClick}
            disabled={done || busy}
            className={`flex items-center gap-3 bg-card px-5 py-3.5 text-left transition-colors ${
              done ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-elev'
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                done ? 'bg-success/10 text-success' : 'bg-elev text-muted'
              }`}
            >
              {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-semibold ${done ? 'text-muted line-through' : 'text-text'}`}>
                {busy ? 'Opening Google…' : label}
              </span>
              <span className="block truncate text-[11px] text-muted">{hint}</span>
            </span>
            {!done && <ChevronRight size={15} className="shrink-0 text-muted" />}
          </button>
        ))}
      </div>
      {showTelegramModal && <TelegramLinkModal onClose={() => setShowTelegramModal(false)} />}
    </div>
  )
}
