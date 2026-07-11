import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail, Send, Landmark, LogOut, Check, RotateCcw, Palette, UserRound, Unplug,
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import ErrorState from '../components/ui/ErrorState'
import TelegramLinkModal from '../components/ui/TelegramLinkModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { useTheme, THEMES } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { getUserStatus, getBanks, setBank, connectGmail, disconnectGmail, unlinkTelegram } from '../api/endpoints'

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent-strong">
          <Icon size={15} />
        </span>
        <div>
          <p className="m-0 text-[13px] font-bold text-text">{title}</p>
          {description && <p className="m-0 mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function StatusPill({ ok, okLabel, offLabel }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
        ok ? 'bg-success/10 text-success' : 'bg-elev text-muted'
      }`}
    >
      {ok ? `✓ ${okLabel}` : offLabel}
    </span>
  )
}

function ThemePreview({ preview }) {
  return (
    <div
      className="flex h-12 w-full overflow-hidden rounded-lg border"
      style={{ background: preview.bg, borderColor: preview.line }}
      aria-hidden="true"
    >
      <div className="h-full w-3" style={{ background: preview.sidebar }} />
      <div className="flex flex-1 flex-col gap-1 p-1.5">
        <div className="h-1 w-2/3 rounded-full" style={{ background: preview.accent }} />
        <div className="h-1 w-full rounded-full opacity-60" style={{ background: preview.line }} />
        <div className="h-1 w-4/5 rounded-full opacity-40" style={{ background: preview.line }} />
      </div>
    </div>
  )
}

export default function Settings() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { themeName, setThemeName } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [showGmailDisconnectConfirm, setShowGmailDisconnectConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const { data: status, isError: statusError, refetch: refetchStatus, isFetching: statusFetching } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })
  const { data: banks = [], isError: banksError, refetch: refetchBanks, isFetching: banksFetching } = useQuery({ queryKey: ['banks'], queryFn: getBanks })

  // Handle the redirect back from the Gmail consent screen:
  // /settings?gmail=connected  or  /settings?gmail_error=<reason>
  useEffect(() => {
    const gmail = searchParams.get('gmail')
    const gmailError = searchParams.get('gmail_error')

    if (gmail === 'connected') {
      toast('Gmail connected successfully')
      queryClient.invalidateQueries({ queryKey: ['status'] })
    } else if (gmailError) {
      toast(`Couldn't connect Gmail: ${gmailError}`, { type: 'error', duration: 6000 })
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
    onError: () => toast("Couldn't start Gmail connection. Please try again.", { type: 'error' }),
  })

  const bankMutation = useMutation({
    mutationFn: setBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status'] })
      toast('Bank saved')
    },
    onError: () => toast("Couldn't save bank. Please try again.", { type: 'error' }),
  })

  const unlinkTelegramMutation = useMutation({
    mutationFn: unlinkTelegram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status'] })
      setShowDisconnectConfirm(false)
      toast('Telegram disconnected')
    },
    onError: () => toast("Couldn't disconnect Telegram. Please try again.", { type: 'error' }),
  })

  const disconnectGmailMutation = useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status'] })
      setShowGmailDisconnectConfirm(false)
      toast('Gmail disconnected')
    },
    onError: () => toast("Couldn't disconnect Gmail. Please try again.", { type: 'error' }),
  })

  const hasError = statusError || banksError
  const isRetrying = statusFetching || banksFetching
  const retryAll = () => {
    refetchStatus()
    refetchBanks()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const restartOnboarding = () => {
    localStorage.removeItem('lm-onboarding-step')
    navigate('/onboarding')
  }

  return (
    <Layout>
      <div className="mb-6">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Settings</p>
        <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-text md:text-[28px]">Preferences</h1>
      </div>

      {hasError ? (
        <ErrorState title="We're having trouble loading your settings" onRetry={retryAll} isRetrying={isRetrying} />
      ) : (
        <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
          {/* Profile */}
          <SectionCard icon={UserRound} title="Account" description="Your profile and session">
            <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-elev p-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-base font-bold text-white">
                {(status?.name?.[0] ?? status?.email?.[0] ?? '•').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-bold text-text">{status?.name ?? '—'}</p>
                <p className="m-0 truncate text-xs text-muted">{status?.email ?? ''}</p>
              </div>
              <StatusPill ok={status?.active} okLabel="Syncing" offLabel="Sync off" />
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={restartOnboarding}>
                Replay setup guide
              </Button>
              <Button variant="dangerOutline" size="sm" icon={LogOut} onClick={() => setShowLogoutConfirm(true)}>
                Sign out
              </Button>
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard icon={Palette} title="Appearance" description="Pick a theme — it applies instantly">
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setThemeName(key)}
                  aria-pressed={themeName === key}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 bg-card p-2.5 transition-all ${
                    themeName === key ? 'border-accent shadow-[0_0_0_3px_var(--accent-soft)]' : 'border-border hover:border-border-strong'
                  }`}
                >
                  <ThemePreview preview={t.preview} />
                  <span className={`flex items-center gap-1 text-[11px] font-bold ${themeName === key ? 'text-accent-strong' : 'text-sub'}`}>
                    {themeName === key && <Check size={11} strokeWidth={3} />}
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Gmail */}
          <SectionCard
            icon={Mail}
            title="Gmail"
            description="Reads your bank's transaction alert emails, nothing else"
          >
            {status?.gmailConnected ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill ok okLabel="Connected" offLabel="" />
                <Button
                  variant="dangerOutline"
                  size="sm"
                  icon={Unplug}
                  loading={disconnectGmailMutation.isPending}
                  onClick={() => setShowGmailDisconnectConfirm(true)}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <>
                <Button loading={gmailMutation.isPending} onClick={() => gmailMutation.mutate()}>
                  <Mail size={15} /> {gmailMutation.isPending ? 'Opening Google…' : 'Connect Gmail'}
                </Button>
                <p className="m-0 mt-3 text-[11px] leading-relaxed text-muted">
                  While we complete Google's verification, connecting Gmail currently works for
                  approved test users only.
                </p>
              </>
            )}
          </SectionCard>

          {/* Telegram */}
          <SectionCard
            icon={Send}
            title="Telegram"
            description="Transaction notifications + your AI financial advisor"
          >
            {status?.telegramLinked ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill ok okLabel="Linked" offLabel="" />
                <Button
                  variant="dangerOutline"
                  size="sm"
                  icon={Unplug}
                  loading={unlinkTelegramMutation.isPending}
                  onClick={() => setShowDisconnectConfirm(true)}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button style={{ background: '#229ED9' }} onClick={() => setShowTelegramModal(true)}>
                <Send size={15} /> Connect Telegram
              </Button>
            )}
          </SectionCard>

          {/* Bank */}
          <SectionCard
            icon={Landmark}
            title="Bank"
            description="LedgerMind watches for alerts from this bank's email address"
          >
            <div className="flex max-w-sm items-center gap-2.5">
              <div className="flex-1">
                <Select
                  value={status?.bankCode ?? ''}
                  onChange={(e) => bankMutation.mutate(e.target.value)}
                  disabled={bankMutation.isPending}
                >
                  <option value="" disabled>Select bank</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </Select>
              </div>
              {bankMutation.isSuccess && (
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-success">
                  <Check size={13} strokeWidth={3} /> Saved
                </span>
              )}
            </div>
            <p className="m-0 mt-3 text-[11px] text-muted">More banks are on the way.</p>
          </SectionCard>
        </div>
      )}

      {showTelegramModal && <TelegramLinkModal onClose={() => setShowTelegramModal(false)} />}

      {showDisconnectConfirm && (
        <ConfirmDialog
          icon={Unplug}
          title="Disconnect Telegram?"
          message="You'll stop getting transaction notifications and won't be able to chat with your financial advisor until you link it again."
          confirmLabel="Disconnect"
          confirmingLabel="Disconnecting…"
          isConfirming={unlinkTelegramMutation.isPending}
          onConfirm={() => unlinkTelegramMutation.mutate()}
          onCancel={() => setShowDisconnectConfirm(false)}
        />
      )}

      {showGmailDisconnectConfirm && (
        <ConfirmDialog
          icon={Mail}
          title="Disconnect Gmail?"
          message="LedgerMind will stop reading your bank's transaction emails and syncing new transactions until you reconnect."
          confirmLabel="Disconnect"
          confirmingLabel="Disconnecting…"
          isConfirming={disconnectGmailMutation.isPending}
          onConfirm={() => disconnectGmailMutation.mutate()}
          onCancel={() => setShowGmailDisconnectConfirm(false)}
        />
      )}

      {showLogoutConfirm && (
        <ConfirmDialog
          icon={LogOut}
          title="Sign out?"
          message="You'll need to sign in again to access your account."
          confirmLabel="Sign out"
          confirmingLabel="Signing out…"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </Layout>
  )
}
