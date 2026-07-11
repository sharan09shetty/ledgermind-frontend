import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight, ArrowLeft, Check, Mail, Send, Landmark, Palette,
  ShieldCheck, MessageCircleHeart, Zap, PartyPopper,
} from 'lucide-react'
import { useTheme, THEMES } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import {
  getUserStatus, getBanks, setBank, connectGmail, completeOnboarding,
} from '../api/endpoints'
import { firstName } from '../utils/greeting'
import { Logo, LogoMark } from '../components/brand/Logo'
import Button from '../components/ui/Button'
import TelegramLinkModal from '../components/ui/TelegramLinkModal'

const STEPS = ['welcome', 'theme', 'gmail', 'telegram', 'bank', 'done']
const STEP_KEY = 'lm-onboarding-step'

function ThemePreview({ preview }) {
  return (
    <div
      className="flex h-16 w-full overflow-hidden rounded-xl border"
      style={{ background: preview.bg, borderColor: preview.line }}
      aria-hidden="true"
    >
      <div className="h-full w-4" style={{ background: preview.sidebar }} />
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: preview.accent }} />
        <div className="h-1.5 w-full rounded-full opacity-60" style={{ background: preview.line }} />
        <div className="h-1.5 w-4/5 rounded-full opacity-40" style={{ background: preview.line }} />
      </div>
    </div>
  )
}

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Step ${current + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-6 bg-accent' : i < current ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-border-strong'
          }`}
        />
      ))}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { themeName, setThemeName } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showTelegramModal, setShowTelegramModal] = useState(false)

  const [step, setStep] = useState(() => {
    const saved = Number(localStorage.getItem(STEP_KEY))
    return Number.isInteger(saved) && saved > 0 && saved < STEPS.length ? saved : 0
  })

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })
  const { data: banks = [], isLoading: banksLoading } = useQuery({ queryKey: ['banks'], queryFn: getBanks })

  // Returning from the Google consent screen lands on /settings?gmail=…, and
  // the onboarding gate bounces un-onboarded users back here with the params.
  useEffect(() => {
    const gmail = searchParams.get('gmail')
    const gmailError = searchParams.get('gmail_error')
    if (gmail === 'connected') {
      queryClient.invalidateQueries({ queryKey: ['status'] })
      toast('Gmail connected — nice!')
    } else if (gmailError) {
      toast("Couldn't connect Gmail. You can retry, or set it up later.", { type: 'error' })
    }
    if (gmail || gmailError) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(step))
    window.scrollTo(0, 0)
  }, [step])

  const gmailMutation = useMutation({
    mutationFn: connectGmail,
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const bankMutation = useMutation({
    mutationFn: setBank,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['status'] }),
  })

  const finishMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      queryClient.setQueryData(['status'], data)
      localStorage.removeItem(STEP_KEY)
      navigate('/', { replace: true })
    },
  })

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const stepName = STEPS[step]
  const name = firstName(status?.name)

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 py-6">
      {/* Header */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Logo height={26} />
        {step > 0 && step < STEPS.length - 1 && (
          <button
            onClick={() => finishMutation.mutate()}
            className="cursor-pointer border-none bg-transparent text-xs font-semibold text-muted transition-colors hover:text-text"
          >
            Skip setup
          </button>
        )}
      </div>

      {/* Card */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
        <div key={stepName} className="animate-fade-in-up">
          {stepName === 'welcome' && (
            <div className="text-center">
              <div className="animate-pop mx-auto mb-6 w-fit">
                <LogoMark size={72} />
              </div>
              <h1 className="m-0 text-[26px] font-extrabold tracking-tight text-text">
                {name ? `Welcome, ${name}!` : 'Welcome to LedgerMind'}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-sub">
                Your finances, understood automatically. Let's set things up — it takes about a minute.
              </p>
              <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3 text-left">
                {[
                  { icon: Zap, text: 'Transactions captured automatically from bank alert emails' },
                  { icon: MessageCircleHeart, text: 'Chat with an AI financial advisor on Telegram' },
                  { icon: ShieldCheck, text: 'Private by design — your data stays yours' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong">
                      <Icon size={17} />
                    </span>
                    <span className="text-[13px] font-medium text-sub">{text}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-9 w-full max-w-xs" onClick={next}>
                Get started <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {stepName === 'theme' && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-accent-strong">
                <Palette size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Step 1 · Appearance</span>
              </div>
              <h1 className="m-0 text-2xl font-extrabold tracking-tight text-text">Pick your look</h1>
              <p className="mt-2 text-[13px] text-sub">Changes apply instantly. You can switch any time from Settings.</p>
              <div className="mt-6 flex flex-col gap-3">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setThemeName(key)}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all ${
                      themeName === key ? 'border-accent shadow-[0_0_0_4px_var(--accent-soft)]' : 'border-border hover:border-border-strong'
                    }`}
                  >
                    <div className="w-28 shrink-0">
                      <ThemePreview preview={t.preview} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-bold text-text">{t.name}</p>
                      <p className="m-0 mt-0.5 text-xs text-muted">{t.tagline}</p>
                    </div>
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all ${
                        themeName === key ? 'bg-accent text-white' : 'border-2 border-border-strong'
                      }`}
                    >
                      {themeName === key && <Check size={13} strokeWidth={3} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stepName === 'gmail' && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-accent-strong">
                <Mail size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Step 2 · Gmail</span>
              </div>
              <h1 className="m-0 text-2xl font-extrabold tracking-tight text-text">Automate your ledger</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-sub">
                LedgerMind reads only your bank's transaction alert emails and turns them into
                categorized transactions — no manual entry, ever.
              </p>
              <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
                {status?.gmailConnected ? (
                  <div className="flex items-center gap-3">
                    <span className="animate-pop grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                      <Check size={20} strokeWidth={3} />
                    </span>
                    <div>
                      <p className="m-0 text-sm font-bold text-text">Gmail connected</p>
                      <p className="m-0 mt-0.5 text-xs text-muted">We'll start syncing transaction alerts shortly.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {[
                        'Read-only access to bank alert emails',
                        'Your personal mail is never touched',
                        'Disconnect any time from Settings',
                      ].map((t) => (
                        <li key={t} className="flex items-center gap-2.5 text-[13px] text-sub">
                          <Check size={15} className="shrink-0 text-success" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-5 w-full"
                      loading={gmailMutation.isPending}
                      onClick={() => gmailMutation.mutate()}
                    >
                      <Mail size={15} /> {gmailMutation.isPending ? 'Opening Google…' : 'Connect Gmail'}
                    </Button>
                    <p className="m-0 mt-3 text-center text-[11px] leading-relaxed text-muted">
                      While we complete Google's verification, connecting Gmail currently works for
                      approved test users only.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {stepName === 'telegram' && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-accent-strong">
                <Send size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Step 3 · Telegram</span>
              </div>
              <h1 className="m-0 text-2xl font-extrabold tracking-tight text-text">Meet your advisor</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-sub">
                Link Telegram to get instant transaction notifications and chat with your personal
                AI financial advisor — “how much did I spend on food this week?”
              </p>
              <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
                {status?.telegramLinked ? (
                  <div className="flex items-center gap-3">
                    <span className="animate-pop grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                      <Check size={20} strokeWidth={3} />
                    </span>
                    <div>
                      <p className="m-0 text-sm font-bold text-text">Telegram linked</p>
                      <p className="m-0 mt-0.5 text-xs text-muted">Say hi to your advisor any time.</p>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" style={{ background: '#229ED9' }} onClick={() => setShowTelegramModal(true)}>
                    <Send size={15} /> Link Telegram
                  </Button>
                )}
              </div>
            </div>
          )}

          {stepName === 'bank' && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-accent-strong">
                <Landmark size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Step 4 · Your bank</span>
              </div>
              <h1 className="m-0 text-2xl font-extrabold tracking-tight text-text">Choose your bank</h1>
              <p className="mt-2 text-[13px] text-sub">
                We'll watch for transaction alerts from this bank's email address.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                {banksLoading && (
                  <>
                    <div className="skeleton h-16 rounded-2xl" />
                    <div className="skeleton h-16 rounded-2xl" />
                  </>
                )}
                {banks.map((b) => {
                  const selected = status?.bankCode === b.code
                  return (
                    <button
                      key={b.code}
                      onClick={() => bankMutation.mutate(b.code)}
                      disabled={bankMutation.isPending}
                      className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 bg-card p-4 text-left transition-all disabled:opacity-60 ${
                        selected ? 'border-accent shadow-[0_0_0_4px_var(--accent-soft)]' : 'border-border hover:border-border-strong'
                      }`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-sm font-extrabold text-accent-strong">
                        {b.code?.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-bold text-text">{b.name}</p>
                        <p className="m-0 mt-0.5 text-xs text-muted">Alert emails parsed automatically</p>
                      </div>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all ${
                          selected ? 'bg-accent text-white' : 'border-2 border-border-strong'
                        }`}
                      >
                        {selected && <Check size={13} strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
                {!banksLoading && banks.length === 0 && (
                  <p className="rounded-2xl border border-border bg-card p-4 text-center text-[13px] text-muted">
                    No supported banks available right now — you can pick one later in Settings.
                  </p>
                )}
              </div>
              <p className="mt-4 text-center text-xs text-muted">
                More banks are on the way. Don't see yours? Choose later from Settings.
              </p>
            </div>
          )}

          {stepName === 'done' && (
            <div className="text-center">
              <div className="animate-pop mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-accent-soft text-accent-strong">
                <PartyPopper size={36} strokeWidth={1.6} />
              </div>
              <h1 className="m-0 text-[26px] font-extrabold tracking-tight text-text">You're all set{name ? `, ${name}` : ''}!</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-sub">
                {status?.gmailConnected && status?.bankCode
                  ? 'Transactions will start appearing as your bank alerts arrive. Enjoy the clarity.'
                  : 'You can finish connecting Gmail or choosing a bank any time from Settings.'}
              </p>
              <div className="mx-auto mt-7 flex max-w-xs flex-col gap-2 text-left">
                {[
                  { label: 'Gmail', done: status?.gmailConnected },
                  { label: 'Telegram', done: status?.telegramLinked },
                  { label: 'Bank', done: !!status?.bankCode },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5">
                    <span className="text-[13px] font-medium text-sub">{label}</span>
                    <span className={`text-xs font-bold ${done ? 'text-success' : 'text-muted'}`}>
                      {done ? '✓ Connected' : 'Later'}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                className="mt-9 w-full max-w-xs"
                loading={finishMutation.isPending}
                onClick={() => finishMutation.mutate()}
              >
                Go to my dashboard <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between pb-[env(safe-area-inset-bottom)]">
        <div className="w-24">
          {step > 0 && step < STEPS.length - 1 && (
            <button
              onClick={back}
              className="flex cursor-pointer items-center gap-1 border-none bg-transparent text-[13px] font-semibold text-muted transition-colors hover:text-text"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>
        <StepDots current={step} />
        <div className="flex w-24 justify-end">
          {step > 0 && step < STEPS.length - 1 && (
            <Button size="sm" variant={
              (stepName === 'gmail' && !status?.gmailConnected) ||
              (stepName === 'telegram' && !status?.telegramLinked) ||
              (stepName === 'bank' && !status?.bankCode)
                ? 'secondary' : 'primary'
            } onClick={next}>
              {(stepName === 'gmail' && !status?.gmailConnected) ||
              (stepName === 'telegram' && !status?.telegramLinked) ||
              (stepName === 'bank' && !status?.bankCode)
                ? 'Later'
                : 'Next'}
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>

      {showTelegramModal && <TelegramLinkModal onClose={() => setShowTelegramModal(false)} />}
    </div>
  )
}
