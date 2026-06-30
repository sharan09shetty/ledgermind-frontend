import { useTheme } from '../../context/ThemeContext'

export default function MonthPicker({ label, onBack, onForward, disableForward }) {
    const { theme } = useTheme()

    const btnStyle = {
        width: '32px', height: '32px', borderRadius: '10px', border: 'none',
        background: 'transparent', color: theme.textSub, cursor: 'pointer',
        fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '4px 6px' }}>
            <button onClick={onBack} style={btnStyle}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text, minWidth: '110px', textAlign: 'center' }}>{label}</span>
            <button onClick={onForward} disabled={disableForward} style={{ ...btnStyle, opacity: disableForward ? 0.3 : 1, cursor: disableForward ? 'default' : 'pointer' }}>›</button>
        </div>
    )
}