import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MailWarning, X } from 'lucide-react'
import { getUserStatus, connectGmail } from '../../api/endpoints'
import Button from '../ui/Button'

const DISMISS_KEY = 'lm-gmail-banner-dismissed'

/**
 * Gmail permissions expire periodically. Rather than letting sync silently
 * stall, politely prompt for a reconnect whenever a fully-onboarded user
 * shows up without a Gmail connection. Dismissal lasts for the session.
 */
export default function GmailReconnectBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1')
  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })

  const gmailMutation = useMutation({
    mutationFn: connectGmail,
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  // Only nag users who actually set up automation before (bank chosen) —
  // brand-new users who skipped Gmail already see the setup checklist instead.
  if (dismissed || !status || !status.onboarded || status.gmailConnected || !status.bankCode) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="animate-fade-in-up mb-5 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
          <MailWarning size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13px] font-semibold text-text">Gmail isn't connected</p>
          <p className="m-0 mt-0.5 text-xs leading-relaxed text-sub">
            New transactions aren't syncing. Reconnect to keep your ledger up to date — it takes ten seconds.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss for now"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-muted transition-colors hover:bg-elev hover:text-text"
        >
          <X size={15} />
        </button>
      </div>
      <div className="mt-2.5 pl-12">
        <Button size="sm" loading={gmailMutation.isPending} onClick={() => gmailMutation.mutate()}>
          {gmailMutation.isPending ? 'Opening…' : 'Reconnect Gmail'}
        </Button>
      </div>
    </div>
  )
}
