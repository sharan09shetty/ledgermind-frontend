import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { useTheme, THEMES } from '../context/ThemeContext'
import { getUserStatus, getBanks, setBank } from '../api/endpoints'

export default function Settings() {
  const queryClient = useQueryClient()
  const { theme, themeName, setThemeName } = useTheme()

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })
  const { data: banks = [] } = useQuery({ queryKey: ['banks'], queryFn: getBanks })

  const bankMutation = useMutation({
    mutationFn: setBank,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['status'] }),
  })

  const card = {
    background: theme.card,
    borderRadius: '16px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    padding: '20px',
    marginBottom: '12px',
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: 600, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '14px',
  }

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: '12px', marginBottom: '12px', borderBottom: `1px solid ${theme.cardBorder}`,
  }

  return (
      <Layout>
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Settings</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>Preferences</h1>
        </div>

        <div style={{ maxWidth: '480px' }}>

          {/* Theme switcher */}
          <div style={card}>
            <span style={labelStyle}>Appearance</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {Object.entries(THEMES).map(([key, t]) => (
                  <button
                      key={key}
                      onClick={() => setThemeName(key)}
                      style={{
                        padding: '14px 10px', borderRadius: '12px', border: `2px solid`,
                        borderColor: themeName === key ? t.sidebarActive : theme.cardBorder,
                        background: t.card, cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      }}
                  >
                    {/* Mini preview */}
                    <div style={{ width: '36px', height: '24px', borderRadius: '6px', background: t.bg, border: `1px solid ${t.cardBorder}`, display: 'flex', overflow: 'hidden' }}>
                      <div style={{ width: '10px', background: t.sidebar, height: '100%' }} />
                      <div style={{ flex: 1, padding: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ height: '3px', borderRadius: '2px', background: t.sidebarActive, opacity: 0.8 }} />
                        <div style={{ height: '3px', borderRadius: '2px', background: t.textMuted, opacity: 0.4 }} />
                        <div style={{ height: '3px', borderRadius: '2px', background: t.textMuted, opacity: 0.25 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: themeName === key ? t.sidebarActive : '#64748B' }}>{t.icon} {t.name}</span>
                  </button>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div style={card}>
            <span style={labelStyle}>Account</span>
            <div style={{ ...rowStyle }}>
              <span style={{ fontSize: '13px', color: theme.textSub }}>Email</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{status?.email ?? '—'}</span>
            </div>
            <div style={{ ...rowStyle }}>
              <span style={{ fontSize: '13px', color: theme.textSub }}>Telegram</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
                background: status?.telegramLinked ? 'rgba(16,185,129,0.1)' : theme.inputBorder,
                color: status?.telegramLinked ? '#10B981' : theme.textMuted,
              }}>
              {status?.telegramLinked ? '✓ Linked' : 'Not linked'}
            </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: theme.textSub }}>Sync status</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
                background: status?.active ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: status?.active ? '#10B981' : '#F59E0B',
              }}>
              {status?.active ? '● Active' : '○ Inactive'}
            </span>
            </div>
          </div>

          {/* Bank */}
          <div style={card}>
            <span style={labelStyle}>Bank</span>
            <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '12px', marginTop: '-6px' }}>
              LedgerMind reads transaction alerts from this bank's email address.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                  defaultValue={status?.bankCode ?? ''}
                  onChange={(e) => bankMutation.mutate(e.target.value)}
                  style={{
                    flex: 1, border: `1.5px solid ${theme.inputBorder}`, borderRadius: '10px',
                    padding: '9px 12px', fontSize: '13px', color: theme.text,
                    background: theme.card, outline: 'none',
                  }}
              >
                <option value="" disabled style={{ background: theme.card }}>Select bank</option>
                {banks.map((b) => (
                    <option key={b.code} value={b.code} style={{ background: theme.card }}>{b.name}</option>
                ))}
              </select>
              {bankMutation.isSuccess && (
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>✓ Saved</span>
              )}
            </div>
          </div>

          {/* Telegram link */}
          {!status?.telegramLinked && (
              <div style={card}>
                <span style={labelStyle}>Telegram</span>
                <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '12px', marginTop: '-6px' }}>
                  Get transaction notifications and chat with your financial advisor.
                </p>
                <a
                    href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                      borderRadius: '10px', color: 'white', background: '#229ED9',
                      textDecoration: 'none',
                    }}
                >
                  Open Telegram Bot ↗
                </a>
              </div>
          )}
        </div>
      </Layout>
  )
}