import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, ChartNoAxesCombined, Settings,
  PlusCircle, Sun, Moon, Sparkles, Search, CornerDownLeft,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

/**
 * ⌘K / Ctrl+K quick actions: jump between pages, log a transaction,
 * or switch themes without touching the mouse.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { setThemeName } = useTheme()

  const commands = useMemo(
    () => [
      { group: 'Go to', label: 'Dashboard', icon: LayoutDashboard, run: () => navigate('/') },
      { group: 'Go to', label: 'Transactions', icon: ArrowLeftRight, run: () => navigate('/transactions') },
      { group: 'Go to', label: 'Analytics', icon: ChartNoAxesCombined, run: () => navigate('/analytics') },
      { group: 'Go to', label: 'Advisor', icon: Sparkles, run: () => navigate('/chat') },
      { group: 'Go to', label: 'Settings', icon: Settings, run: () => navigate('/settings') },
      { group: 'Actions', label: 'Log a transaction', icon: PlusCircle, run: () => navigate('/transactions?log=1') },
      { group: 'Actions', label: 'Ask the advisor', icon: Sparkles, run: () => navigate('/chat') },
      { group: 'Theme', label: 'Light theme', icon: Sun, run: () => setThemeName('light') },
      { group: 'Theme', label: 'Dark theme', icon: Moon, run: () => setThemeName('dark') },
      { group: 'Theme', label: 'Midnight theme', icon: Sparkles, run: () => setThemeName('midnight') },
    ],
    [navigate, setThemeName],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
        setActive(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  if (!open) return null

  const runCommand = (cmd) => {
    setOpen(false)
    cmd.run()
  }

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      runCommand(results[active])
    }
  }

  let lastGroup = null

  return createPortal(
    <div className="fixed inset-0 z-[9995]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="animate-scale-in absolute left-1/2 top-[18vh] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-modal">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKey}
            placeholder="Search pages and actions…"
            className="h-12 w-full border-none bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 font-sans text-[10px] text-muted">esc</kbd>
        </div>
        <div className="max-h-[40vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted">No matches for “{query}”</p>
          ) : (
            results.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup
              lastGroup = cmd.group
              return (
                <div key={`${cmd.group}-${cmd.label}`}>
                  {showGroup && (
                    <p className="mx-3 mb-1 mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      {cmd.group}
                    </p>
                  )}
                  <button
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-none px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                      i === active ? 'bg-accent-soft text-accent-strong' : 'bg-transparent text-sub'
                    }`}
                  >
                    <cmd.icon size={16} />
                    <span className="flex-1">{cmd.label}</span>
                    {i === active && <CornerDownLeft size={13} className="opacity-60" />}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
