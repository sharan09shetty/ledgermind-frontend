import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parseISO, differenceInSeconds } from 'date-fns'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getTelegramLinkToken, getUserStatus } from '../../api/endpoints'

const POLL_INTERVAL_MS = 4000

const formatCountdown = (totalSeconds) => {
  const s = Math.max(totalSeconds, 0)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}

function Modal({ onClose }) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [secondsLeft, setSecondsLeft] = useState(null)

  const tokenMutation = useMutation({
    mutationFn: getTelegramLinkToken,
    onSuccess: (data) => {
      setSecondsLeft(Math.max(differenceInSeconds(parseISO(data.expiresAt), new Date()), 0))
    },
  })

  // Request a link token as soon as the modal opens
  useEffect(() => {
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

  const primaryBtnStyle = {
    width: '100%', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 600, padding: '11px 16px',
    borderRadius: '12px', border: 'none', color: 'white', background: '#229ED9',
    textDecoration: 'none', cursor: 'pointer',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div style={{
        position: 'fixed',
        top: isMobile ? 'auto' : '50%',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : '50%',
        right: isMobile ? 0 : 'auto',
        transform: isMobile ? 'none' : 'translate(-50%, -50%)',
        zIndex: 9999,
        width: isMobile ? '100%' : '360px',
        maxHeight: isMobile ? '85vh' : 'auto',
        overflowY: isMobile ? 'auto' : 'visible',
        background: theme.card,
        borderRadius: isMobile ? '20px 20px 0 0' : '20px',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
        overflow: isMobile ? undefined : 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}` }}>
          <div>
            <p style={{ fontWeight: 600, color: theme.text, fontSize: '14px', margin: 0 }}>
              {linked ? 'Telegram Linked' : 'Link Telegram'}
            </p>
            <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>
              {linked ? 'You\'re all set' : isMobile ? 'Tap to open the bot' : 'Scan to connect the bot'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

          {linked ? (
            /* ── Success state ─────────────────────────────────────────── */
            <>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
              }}>
                ✓
              </div>
              <p style={{ fontSize: '13px', color: theme.textSub, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Your Telegram account is connected. You'll get transaction notifications and can chat with your financial advisor any time.
              </p>
              <button onClick={onClose} style={{ ...primaryBtnStyle, background: theme.sidebarActive }}>
                Done
              </button>
            </>
          ) : tokenMutation.isPending ? (
            /* ── Loading state ─────────────────────────────────────────── */
            <div style={{ padding: '32px 0', fontSize: '13px', color: theme.textMuted }}>Generating your link…</div>
          ) : tokenMutation.isError ? (
            /* ── Error state ────────────────────────────────────────────── */
            <>
              <p style={{ fontSize: '13px', color: theme.textSub, textAlign: 'center', margin: 0 }}>
                Something went wrong generating your link. Please try again.
              </p>
              <button onClick={() => tokenMutation.mutate()} style={primaryBtnStyle}>
                Try Again
              </button>
            </>
          ) : (
            /* ── Ready / expired state ─────────────────────────────────── */
            <>
              {!isMobile && (
                  <div style={{
                    padding: '10px', borderRadius: '12px', background: 'white',
                    border: `1px solid ${theme.cardBorder}`, position: 'relative',
                  }}>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(deepLink ?? '')}`}
                        alt="Scan to open the LedgerMind Telegram bot"
                        width={160}
                        height={160}
                        style={{ display: 'block', opacity: expired ? 0.25 : 1 }}
                    />
                    {expired && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: '#F43F5E', textAlign: 'center', padding: '0 12px',
                        }}>
                          Expired
                        </div>
                    )}
                  </div>
              )}

              <ol style={{ margin: 0, padding: '0 0 0 18px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ fontSize: '12px', color: theme.textSub, lineHeight: 1.5 }}>
                  {isMobile ? 'Tap "Open in Telegram" below.' : 'Scan the QR code with your phone\'s camera, or tap "Open in Telegram" if you\'re on your phone.'}
                </li>
                <li style={{ fontSize: '12px', color: theme.textSub, lineHeight: 1.5 }}>Tap Start in the chat that opens.</li>
                <li style={{ fontSize: '12px', color: theme.textSub, lineHeight: 1.5 }}>Come back here — we'll detect it automatically.</li>
              </ol>

              {expired ? (
                  <button onClick={() => tokenMutation.mutate()} style={primaryBtnStyle}>
                    Generate a new link
                  </button>
              ) : (
                  <a href={deepLink} target="_blank" rel="noreferrer" style={primaryBtnStyle}>
                    Open in Telegram ↗
                  </a>
              )}

              <p style={{ fontSize: '11px', color: theme.textMuted, margin: 0 }}>
                {expired ? 'This link has expired.' : `Expires in ${formatCountdown(secondsLeft ?? 0)}`}
              </p>

              <div style={{ width: '100%', height: '1px', background: theme.cardBorder }} />

              <button
                  onClick={() => refetchStatus()}
                  disabled={statusFetching}
                  style={{
                    fontSize: '12px', fontWeight: 600, color: theme.textSub, background: 'none',
                    border: `1.5px solid ${theme.inputBorder}`, borderRadius: '10px', padding: '8px 14px',
                    cursor: statusFetching ? 'default' : 'pointer', opacity: statusFetching ? 0.6 : 1,
                  }}
              >
                {statusFetching ? 'Checking…' : 'Done linking? Refresh'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// Portal wrapper — renders outside Layout's DOM tree, fixing z-index issues
export default function TelegramLinkModal({ onClose }) {
  return createPortal(<Modal onClose={onClose} />, document.body)
}
