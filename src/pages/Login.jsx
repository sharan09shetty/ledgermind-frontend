import { Zap, MessageCircleHeart, ChartNoAxesCombined, ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { getGoogleLoginUrl } from '../api/endpoints'
import { Logo } from '../components/brand/Logo'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z" />
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z" />
    </svg>
  )
}

const FEATURES = [
  { icon: Zap, title: 'Zero manual entry', text: 'Bank alert emails become categorized transactions, automatically.' },
  { icon: MessageCircleHeart, title: 'AI financial advisor', text: '“How much did I spend on food this week?” — just ask, on Telegram.' },
  { icon: ChartNoAxesCombined, title: 'Analytics that explain', text: 'Trends, comparisons and patterns — not just charts.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Read-only access to bank alerts. Your data stays yours.' },
]

/* A small, believable dashboard vignette that sells the product at a glance */
function PreviewCard() {
  const rows = [
    { name: 'Swiggy', tag: 'Food', amount: '−₹482', debit: true },
    { name: 'Salary · Acme Corp', tag: 'Salary', amount: '+₹85,000', debit: false },
    { name: 'Uber', tag: 'Travel', amount: '−₹214', debit: true },
  ]
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">July at a glance</span>
        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">↓ 12% vs June</span>
      </div>
      <p className="m-0 text-2xl font-extrabold tracking-tight text-white">
        ₹31,552 <span className="text-xs font-normal text-slate-400">spent this month</span>
      </p>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-700/60">
        <div className="w-[38%] bg-rose-400" />
        <div className="flex-1 bg-emerald-400" />
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        {rows.map(({ name, tag, amount, debit }) => (
          <div key={name} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${debit ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
              {debit ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-200">{name}</span>
              <span className="block text-[10px] text-slate-500">{tag} · auto-captured</span>
            </span>
            <span className={`text-xs font-bold ${debit ? 'text-rose-300' : 'text-emerald-300'}`}>{amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const handleLogin = () => {
    // Plain Google sign-in — no Gmail scope is requested here. Gmail access
    // is a separate, consent-screen-gated step handled later in onboarding.
    window.location.href = getGoogleLoginUrl()
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #16233B 0%, #0B1220 45%, #060B14 100%)' }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute -top-[20%] left-[10%] h-[560px] w-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-[25%] -right-[10%] h-[620px] w-[620px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)' }}
      />
      {/* Faint ledger grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-8 lg:py-12">
        <div className="animate-fade-in">
          <Logo height={34} variant="dark" />
        </div>

        {/* DOM order = mobile order: headline → sign-in → features.
            On desktop the sign-in panel moves to a right column. */}
        <div className="grid flex-1 content-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-x-16">
          {/* Pitch */}
          <div className="animate-fade-in-up">
            <h1 className="m-0 max-w-lg text-[30px] font-extrabold leading-[1.12] tracking-tight text-white md:text-[42px]">
              Your finances,{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                understood automatically
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 md:text-[15px]">
              LedgerMind reads your bank's transaction alerts, categorizes every spend, and answers
              questions about your money — so you never open a spreadsheet again.
            </p>
          </div>

          {/* Sign-in panel — above the fold on mobile */}
          <div
            className="animate-fade-in-up mx-auto w-full max-w-sm lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0"
            style={{ animationDelay: '0.08s' }}
          >
            <div className="mb-5 hidden lg:block">
              <PreviewCard />
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-800/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <p className="m-0 text-base font-bold text-white">Get started free</p>
              <p className="m-0 mt-1 text-xs leading-relaxed text-slate-400">
                Sign in with Google. You'll choose what to connect during a one-minute setup.
              </p>
              <button
                onClick={handleLogin}
                className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-none bg-white text-sm font-semibold text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-150 hover:brightness-95 active:scale-[0.98]"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <p className="m-0 mt-4 text-center text-[11px] leading-relaxed text-slate-500">
                Signing in only identifies you — no Gmail access is requested here.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="animate-fade-in-up grid max-w-lg gap-3 sm:grid-cols-2 lg:col-start-1">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <span className="mb-2.5 grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Icon size={16} />
                </span>
                <p className="m-0 text-[13px] font-bold text-slate-100">{title}</p>
                <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="m-0 pb-2 text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} LedgerMind · Built for people who'd rather live than budget
        </p>
      </div>
    </div>
  )
}
