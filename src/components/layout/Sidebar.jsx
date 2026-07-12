import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, ArrowLeftRight, ChartNoAxesCombined, Settings,
  LogOut, Mail, Send, Command, Sparkles,
} from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getUserStatus } from '../../api/endpoints'
import { Logo } from '../brand/Logo'
import ConfirmDialog from '../ui/ConfirmDialog'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/chat', label: 'Advisor', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function ConnectionDot({ ok }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-success' : 'bg-warning'}`}
      aria-hidden="true"
    />
  )
}

export default function Sidebar({ hideMobileTopBar = false }) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  if (isMobile) {
    return (
      <>
        {/* Slim top brand bar — padded below the notch/status bar (safe-area)
            so the logo never sits under the clock in the installed PWA */}
        {!hideMobileTopBar && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/85 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)_+_0.625rem)] backdrop-blur-lg">
            <Logo height={26} />
          </header>
        )}

        {/* Bottom navigation — navigation only, account actions live in Settings */}
        <nav
          className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-sidebar-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
          aria-label="Primary"
        >
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2 no-underline"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-8 w-14 place-items-center rounded-full transition-all duration-200 ${
                      isActive ? 'bg-sidebar-active-bg text-sidebar-active' : 'text-sidebar-text'
                    }`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span
                    className={`text-[10px] ${
                      isActive ? 'font-semibold text-sidebar-active' : 'font-medium text-sidebar-text'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-dvh w-60 flex-col bg-sidebar">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <NavLink to="/" className="inline-flex no-underline">
          <Logo height={30} variant="dark" />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Primary">
        <p className="mx-3 mb-1 mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-text/60">
          Menu
        </p>
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] no-underline transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-active-bg font-semibold text-sidebar-active'
                  : 'font-medium text-sidebar-text hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-active" />
                )}
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div className="flex-1" />

        {/* Connection health, one glance */}
        <button
          onClick={() => navigate('/settings')}
          className="mx-1 mb-1 cursor-pointer rounded-xl border border-sidebar-border bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06]"
        >
          <p className="m-0 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-text/60">
            Connections
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-xs text-sidebar-text">
              <Mail size={13} />
              Gmail
              <span className="ml-auto flex items-center gap-1.5 text-[11px]">
                <ConnectionDot ok={status?.gmailConnected} />
                {status?.gmailConnected ? 'Synced' : 'Off'}
              </span>
            </span>
            <span className="flex items-center gap-2 text-xs text-sidebar-text">
              <Send size={13} />
              Telegram
              <span className="ml-auto flex items-center gap-1.5 text-[11px]">
                <ConnectionDot ok={status?.telegramLinked} />
                {status?.telegramLinked ? 'Linked' : 'Off'}
              </span>
            </span>
          </div>
        </button>

        <p className="mx-1 mb-1 flex items-center gap-1.5 px-2 text-[11px] text-sidebar-text/50">
          <Command size={11} />
          <kbd className="font-sans">⌘K</kbd> quick actions
        </p>
      </nav>

      {/* Profile + sign out */}
      <div className="flex items-center gap-2.5 border-t border-sidebar-border p-3.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white">
          {(status?.name?.[0] ?? status?.email?.[0] ?? '•').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[13px] font-semibold text-white">{status?.name ?? '—'}</p>
          <p className="m-0 truncate text-[11px] text-sidebar-text">{status?.email ?? ''}</p>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title="Sign out"
          aria-label="Sign out"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-sidebar-text transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={15} />
        </button>
      </div>

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
    </aside>
  )
}
