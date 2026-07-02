import { createPortal } from 'react-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const BOT_URL = `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME}`

const STEPS = [
  'Scan the QR code with your phone\'s camera (or tap "Open in Telegram" if you\'re on your phone).',
  'Tap Start in the chat that opens.',
  'You\'ll get transaction notifications and can chat with your financial advisor any time.',
]

function Modal({ onClose }) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()

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
            <p style={{ fontWeight: 600, color: theme.text, fontSize: '14px', margin: 0 }}>Link Telegram</p>
            <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>Scan to connect the bot</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* QR code */}
          <div style={{
            padding: '10px', borderRadius: '12px', background: 'white',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(BOT_URL)}`}
              alt="Scan to open the LedgerMind Telegram bot"
              width={160}
              height={160}
              style={{ display: 'block' }}
            />
          </div>

          {/* Setup instructions */}
          <ol style={{ margin: 0, padding: '0 0 0 18px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {STEPS.map((step, i) => (
              <li key={i} style={{ fontSize: '12px', color: theme.textSub, lineHeight: 1.5 }}>{step}</li>
            ))}
          </ol>

          {/* Open in Telegram */}
          <a
            href={BOT_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              width: '100%', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600, padding: '11px 16px',
              borderRadius: '12px', color: 'white', background: '#229ED9',
              textDecoration: 'none',
            }}
          >
            Open in Telegram ↗
          </a>
        </div>
      </div>
    </>
  )
}

// Portal wrapper — renders outside Layout's DOM tree, fixing z-index issues
export default function TelegramLinkModal({ onClose }) {
  return createPortal(<Modal onClose={onClose} />, document.body)
}
