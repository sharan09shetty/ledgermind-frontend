import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parseISO, differenceInSeconds } from 'date-fns'
import { Check, ExternalLink, RefreshCw, Loader2 } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getTelegramLinkToken, getUserStatus } from '../../api/endpoints'
import Modal from './Modal'
import Button from './Button'

const POLL_INTERVAL_MS = 4000

const formatCountdown = (totalSeconds) => {
  const s = Math.max(totalSeconds, 0)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}

export default function TelegramLinkModal({ onClose }) {
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [secondsLeft, setSecondsLeft] = useState(null)

  const tokenMutation = useMutation({
    mutationFn: getTelegramLinkToken,
    onSuccess: (data) => {
      setSecondsLeft(Math.max(differenceInSeconds(parseISO(data.expiresAt), new Date()), 0))
    },
  })

  // Request a link token as soon as the modal opens. The ref guard keeps
  // StrictMode's double-mounted effect from firing two concurrent requests.
  const tokenRequested = useRef(false)
  useEffect(() => {
    if (tokenRequested.current) return
    tokenRequested.current = true
    tokenMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tick the countdown every second while a token is active
  useEffect(() => {
    if (secondsLeft == null || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const expired = tokenMutation.isSuccess && secondsLeft === 0

  // Poll linked status while a live token is showing — this is how we detect
  // that the user finished linking in Telegram, since there's no redirect back.
  const { data: status, refetch: refetchStatus, isFetching: statusFetching } = useQuery({
    queryKey: ['status'],
    queryFn: getUserStatus,
    refetchInterval: tokenMutation.isSuccess && !expired ? POLL_INTERVAL_MS : false,
  })

  const linked = status?.telegramLinked === true

  useEffect(() => {
    if (linked) queryClient.invalidateQueries({ queryKey: ['status'] })
  }, [linked, queryClient])

  const deepLink = tokenMutation.data?.deepLink

  return (
    <Modal
      onClose={onClose}
      title={linked ? 'Telegram linked' : 'Link Telegram'}
      subtitle={linked ? "You're all set" : isMobile ? 'Tap to open the bot' : 'Scan to connect the bot'}
      width="max-w-[380px]"
    >
      <div className="flex flex-col items-center gap-4 p-5">
        {linked ? (
          <>
            <div className="animate-pop grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
              <Check size={26} strokeWidth={3} />
            </div>
            <p className="m-0 text-center text-[13px] leading-relaxed text-sub">
              Your Telegram account is connected. You'll get transaction notifications and can chat
              with your financial advisor any time.
            </p>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </>
        ) : tokenMutation.isPending ? (
          <div className="flex items-center gap-2 py-9 text-[13px] text-muted">
            <Loader2 size={15} className="animate-spin" /> Generating your link…
          </div>
        ) : tokenMutation.isError ? (
          <>
            <p className="m-0 text-center text-[13px] text-sub">
              Something went wrong generating your link. Please try again.
            </p>
            <Button className="w-full" onClick={() => tokenMutation.mutate()}>Try again</Button>
          </>
        ) : (
          <>
            {!isMobile && (
              <div className="relative rounded-2xl border border-border bg-white p-2.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(deepLink ?? '')}`}
                  alt="Scan to open the LedgerMind Telegram bot"
                  width={160}
                  height={160}
                  className={`block ${expired ? 'opacity-20' : ''}`}
                />
                {expired && (
                  <div className="absolute inset-0 grid place-items-center px-3 text-center text-xs font-bold text-danger">
                    Expired
                  </div>
                )}
              </div>
            )}

            <ol className="m-0 flex w-full flex-col gap-1.5 pl-4">
              <li className="text-xs leading-relaxed text-sub">
                {isMobile
                  ? 'Tap "Open in Telegram" below.'
                  : 'Scan the QR code with your phone, or tap "Open in Telegram" if you\'re on your phone.'}
              </li>
              <li className="text-xs leading-relaxed text-sub">Tap Start in the chat that opens.</li>
              <li className="text-xs leading-relaxed text-sub">Come back here — we'll detect it automatically.</li>
            </ol>

            {expired ? (
              <Button className="w-full" style={{ background: '#229ED9' }} onClick={() => tokenMutation.mutate()}>
                <RefreshCw size={14} /> Generate a new link
              </Button>
            ) : (
              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white no-underline transition-all hover:brightness-110"
                style={{ background: '#229ED9' }}
              >
                Open in Telegram <ExternalLink size={13} />
              </a>
            )}

            <p className="tnum m-0 text-[11px] text-muted">
              {expired ? 'This link has expired.' : `Expires in ${formatCountdown(secondsLeft ?? 0)}`}
            </p>

            <div className="h-px w-full bg-border" />

            <Button variant="secondary" size="sm" loading={statusFetching} onClick={() => refetchStatus()}>
              {statusFetching ? 'Checking…' : 'Done linking? Refresh'}
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
