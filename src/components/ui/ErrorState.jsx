import { useTheme } from '../../context/ThemeContext'

export default function ErrorState({
  title = "We're having trouble loading this page",
  message = 'Please try again in a moment.',
  onRetry,
  isRetrying = false,
  minHeight = '360px',
}) {
  const { theme } = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        textAlign: 'center',
        padding: '40px 20px',
        background: theme.card,
        borderRadius: '20px',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.shadow,
      }}
    >
      <p style={{ fontSize: '28px', marginBottom: '10px' }}>⚠️</p>
      <p style={{ fontSize: '15px', fontWeight: 600, color: theme.text, margin: 0 }}>{title}</p>
      <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '6px', marginBottom: '18px' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            padding: '9px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: isRetrying ? 'default' : 'pointer',
            background: theme.sidebarActive,
            color: 'white',
            opacity: isRetrying ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  )
}
