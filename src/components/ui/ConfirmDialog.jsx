import { createPortal } from 'react-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'

function Modal({
  icon = '⚠️',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmingLabel,
  isConfirming = false,
  danger = true,
  onConfirm,
  onCancel,
}) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const accent = danger ? '#F43F5E' : theme.sidebarActive

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={isConfirming ? undefined : onCancel}
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
        width: isMobile ? '100%' : '340px',
        background: theme.card,
        borderRadius: isMobile ? '20px 20px 0 0' : '20px',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: danger ? 'rgba(244,63,94,0.12)' : `${accent}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            margin: '0 auto 14px',
          }}>
            {icon}
          </div>
          <p style={{ fontWeight: 700, color: theme.text, fontSize: '15px', margin: 0 }}>{title}</p>
          {message && (
              <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px', lineHeight: 1.5 }}>
                {message}
              </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 20px' }}>
          <button
              onClick={onCancel}
              disabled={isConfirming}
              style={{
                flex: 1, padding: '11px', borderRadius: '12px', border: `1.5px solid ${theme.inputBorder}`,
                fontSize: '13px', fontWeight: 600, color: theme.textSub, background: 'transparent',
                cursor: isConfirming ? 'default' : 'pointer', opacity: isConfirming ? 0.6 : 1,
              }}
          >
            {cancelLabel}
          </button>
          <button
              onClick={onConfirm}
              disabled={isConfirming}
              style={{
                flex: 1, padding: '11px', borderRadius: '12px', border: 'none',
                fontSize: '13px', fontWeight: 600, color: 'white', background: accent,
                cursor: isConfirming ? 'default' : 'pointer', opacity: isConfirming ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
          >
            {isConfirming ? (confirmingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}

// Portal wrapper — renders outside Layout's DOM tree, fixing z-index issues
export default function ConfirmDialog(props) {
  return createPortal(<Modal {...props} />, document.body)
}
