import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import ErrorState from '../components/ui/ErrorState'
import TelegramLinkModal from '../components/ui/TelegramLinkModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useTheme, THEMES } from '../context/ThemeContext'
import { getUserStatus, getBanks, setBank, connectGmail, unlinkTelegram } from '../api/endpoints'

export default function Settings() {
  const queryClient = useQueryClient()
  const { theme, themeName, setThemeName } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [gmailBanner, setGmailBanner] = useState(null)
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { data: status, isError: statusError, refetch: refetchStatus, isFetching: statusFetching } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })
  const { data: banks = [], isError: banksError, refetch: refetchBanks, isFetching: banksFetching } = useQuery({ queryKey: ['banks'], queryFn: getBanks })

  // Handle the redirect back from the Gmail consent screen:
  // /settings?gmail=connected  or  /settings?gmail_error=<reason>
  useEffect(() => {
    const gmail = searchParams.get('gmail')
    const gmailError = searchParams.get('gmail_error')

    if (gmail === 'connected') {
      setGmailBanner({ type: 'success', text: 'Gmail connected successfully.' })
      queryClient.invalidateQueries({ queryKey: ['status'] })
    } else if (gmailError) {
      setGmailBanner({ type: 'error', text: `Couldn't connect Gmail: ${gmailError}` })
    }

    if (gmail || gmailError) {
      const next = new URLSearchParams(searchParams)
      next.delete('gmail')
      next.delete('gmail_error')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gmailMutation = useMutation({
    mutationFn: connectGmail,
    onSuccess: (data) => {
      // Only this final step is a real browser navigation — straight to
      // Google's consent screen, using the URL the backend just minted.
      window.location.href = data.url
    },
  })

  const hasError = statusError || banksError
  const isRetrying = statusFetching || banksFetching
  const retryAll = () => {
    refetchStatus()
    refetchBanks()
  }

  const bankMutation = useMutation({
    mutationFn: setBank,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['status'] }),
  })

  const unlinkTelegramMutation = useMutation({
    mutationFn: unlinkTelegram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status'] })
      setShowDisconnectConfirm(false)
    },
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

          {gmailBanner && (
              <div style={{
                marginBottom: '12px', padding: '12px 16px', borderRadius: '14px',
                background: gmailBanner.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                border: `1px solid ${gmailBanner.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: gmailBanner.type === 'success' ? '#10B981' : '#F43F5E' }}>
                  {gmailBanner.type === 'success' ? '✓ ' : '⚠️ '}{gmailBanner.text}
                </span>
                <button
                    onClick={() => setGmailBanner(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '13px' }}
                >
                  ✕
                </button>
              </div>
          )}

          {hasError ? (
              <ErrorState
                  title="We're having trouble loading your settings"
                  onRetry={retryAll}
                  isRetrying={isRetrying}
              />
          ) : (
              <>
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

                {/* Gmail */}
                <div style={card}>
                  <span style={labelStyle}>Gmail</span>
                  <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '12px', marginTop: '-6px' }}>
                    Connect Gmail so LedgerMind can automatically read your bank's transaction alert emails.
                  </p>
                  {status?.gmailConnected ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: 600, padding: '8px 14px', borderRadius: '10px',
                        background: 'rgba(16,185,129,0.1)', color: '#10B981',
                      }}>
                        ✓ Gmail Connected
                      </span>
                  ) : (
                      <button
                          onClick={() => gmailMutation.mutate()}
                          disabled={gmailMutation.isPending}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                            borderRadius: '10px', border: 'none',
                            cursor: gmailMutation.isPending ? 'default' : 'pointer',
                            opacity: gmailMutation.isPending ? 0.7 : 1,
                            color: '#1E293B', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          }}
                      >
                        <svg width="16" height="16" viewBox="0 0 18 18">
                          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
                        </svg>
                        {gmailMutation.isPending ? 'Connecting…' : 'Connect Gmail'}
                      </button>
                  )}
                  {gmailMutation.isError && (
                      <p style={{ fontSize: '12px', color: '#F43F5E', marginTop: '10px', marginBottom: 0 }}>
                        Couldn't start Gmail connection. Please try again.
                      </p>
                  )}
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
                <div style={card}>
                  <span style={labelStyle}>Telegram</span>
                  {status?.telegramLinked ? (
                      <>
                        <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '12px', marginTop: '-6px' }}>
                          Your Telegram account is connected. You'll get transaction notifications and can chat with your financial advisor any time.
                        </p>
                        <button
                            onClick={() => setShowDisconnectConfirm(true)}
                            disabled={unlinkTelegramMutation.isPending}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                              borderRadius: '10px', border: `1.5px solid ${theme.inputBorder}`,
                              cursor: unlinkTelegramMutation.isPending ? 'default' : 'pointer',
                              opacity: unlinkTelegramMutation.isPending ? 0.6 : 1,
                              color: '#F43F5E', background: 'transparent',
                            }}
                        >
                          {unlinkTelegramMutation.isPending ? 'Disconnecting…' : 'Disconnect Telegram'}
                        </button>
                        {unlinkTelegramMutation.isError && (
                            <p style={{ fontSize: '12px', color: '#F43F5E', marginTop: '10px', marginBottom: 0 }}>
                              Couldn't disconnect Telegram. Please try again.
                            </p>
                        )}
                      </>
                  ) : (
                      <>
                        <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '12px', marginTop: '-6px' }}>
                          Get transaction notifications and chat with your financial advisor.
                        </p>
                        <button
                            onClick={() => setShowTelegramModal(true)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                              borderRadius: '10px', border: 'none', cursor: 'pointer',
                              color: 'white', background: '#229ED9',
                            }}
                        >
                          Connect Telegram
                        </button>
                      </>
                  )}
                </div>
              </>
          )}
        </div>

        {showTelegramModal && (
            <TelegramLinkModal onClose={() => setShowTelegramModal(false)} />
        )}

        {showDisconnectConfirm && (
            <ConfirmDialog
                icon="🔌"
                title="Disconnect Telegram?"
                message="You'll stop getting transaction notifications and won't be able to chat with your financial advisor until you link it again."
                confirmLabel="Disconnect"
                confirmingLabel="Disconnecting…"
                isConfirming={unlinkTelegramMutation.isPending}
                onConfirm={() => unlinkTelegramMutation.mutate()}
                onCancel={() => setShowDisconnectConfirm(false)}
            />
        )}
      </Layout>
  )
}