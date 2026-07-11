import { ChevronLeft, ChevronRight, CalendarDays, History } from 'lucide-react'
import { useDateRange } from '../../context/DateRangeContext'

/**
 * Shared period control: a Month / 30-days toggle with month navigation.
 * Compact by design — everything fits on one row even at 360px wide.
 */
export default function DateRangePicker() {
  const { mode, setMode, shortLabel, goBack, goForward, canGoForward } = useDateRange()

  const navBtn =
    'grid h-7 w-7 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-sub transition-colors hover:bg-elev hover:text-text disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <div className="flex shrink-0 items-center rounded-xl border border-border bg-card p-0.5 shadow-card" role="tablist" aria-label="Date range mode">
        {[
          { key: 'month', label: 'Month', icon: CalendarDays },
          { key: 'last30', label: '30d', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`flex h-8 cursor-pointer items-center gap-1 rounded-[10px] border-none px-2.5 text-xs font-semibold transition-all ${
              mode === key ? 'bg-accent-soft text-accent-strong' : 'bg-transparent text-muted hover:text-text'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'month' && (
        <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-border bg-card p-0.5 shadow-card">
          <button onClick={goBack} aria-label="Previous month" className={navBtn}>
            <ChevronLeft size={15} />
          </button>
          <span className="tnum min-w-[70px] text-center text-xs font-semibold text-text">{shortLabel}</span>
          <button onClick={goForward} disabled={!canGoForward} aria-label="Next month" className={navBtn}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
