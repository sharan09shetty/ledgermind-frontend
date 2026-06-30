import { useTheme } from '../../context/ThemeContext'
import { formatCurrency } from '../../utils/date'

export default function SpendingPulse({ debit = 0, credit = 0 }) {
  const { theme } = useTheme()
  const total = Number(debit) + Number(credit)
  const debitPct = total > 0 ? (Number(debit) / total) * 100 : 50
  const creditPct = 100 - debitPct

  return (
      <div style={{ background: theme.card, borderRadius: '20px', padding: '20px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spending Pulse</span>
          <span style={{ fontSize: '11px', color: theme.textMuted }}>Debit vs Credit</span>
        </div>
        <div style={{ display: 'flex', height: '10px', borderRadius: '99px', overflow: 'hidden', gap: '2px', marginBottom: '12px' }}>
          <div style={{ width: `${debitPct}%`, background: '#F43F5E', borderRadius: '99px 0 0 99px', transition: 'width 0.7s' }} />
          <div style={{ width: `${creditPct}%`, background: '#10B981', borderRadius: '0 99px 99px 0', transition: 'width 0.7s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F43F5E' }} />
            <span style={{ color: theme.textSub }}>Spent</span>
            <span style={{ fontWeight: 600, color: theme.text }}>{formatCurrency(debit)}</span>
            <span style={{ color: theme.textMuted }}>({debitPct.toFixed(0)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: theme.textMuted }}>({creditPct.toFixed(0)}%)</span>
            <span style={{ fontWeight: 600, color: theme.text }}>{formatCurrency(credit)}</span>
            <span style={{ color: theme.textSub }}>Received</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
          </div>
        </div>
      </div>
  )
}