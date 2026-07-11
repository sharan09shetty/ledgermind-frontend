import { createContext, useContext, useMemo, useState } from 'react'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns'
import { toApiDateTime, formatMonth, prevMonth, nextMonth } from '../utils/date'

const DateRangeContext = createContext()

/**
 * One shared date range for Dashboard, Transactions and Analytics, so
 * switching pages keeps your place. Two modes:
 *   'month'  — calendar month with back/forward navigation
 *   'last30' — rolling last 30 days
 * Also exposes the immediately-preceding period of equal length, which
 * Analytics uses for period-over-period comparisons.
 */
export function DateRangeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem('lm-range-mode')
    return saved === 'last30' ? 'last30' : 'month'
  })
  const [cursor, setCursor] = useState(new Date())

  const setMode = (m) => {
    localStorage.setItem('lm-range-mode', m)
    setModeState(m)
  }

  const value = useMemo(() => {
    const now = new Date()

    if (mode === 'last30') {
      const start = startOfDay(subDays(now, 29))
      const end = endOfDay(now)
      const prevStart = startOfDay(subDays(now, 59))
      const prevEnd = endOfDay(subDays(now, 30))
      return {
        mode,
        setMode,
        from: toApiDateTime(start),
        to: toApiDateTime(end),
        prevFrom: toApiDateTime(prevStart),
        prevTo: toApiDateTime(prevEnd),
        label: 'Last 30 days',
        shortLabel: 'Last 30 days',
        prevLabel: 'previous 30 days',
        rangeStart: start,
        rangeEnd: end,
        goBack: () => {},
        goForward: () => {},
        canGoForward: false,
        isCurrentPeriod: true,
      }
    }

    const start = startOfMonth(cursor)
    const end = endOfMonth(cursor)
    const prev = prevMonth(cursor)
    const isCurrentMonth = formatMonth(cursor) === formatMonth(now)
    return {
      mode,
      setMode,
      from: toApiDateTime(start),
      to: toApiDateTime(end),
      prevFrom: toApiDateTime(startOfMonth(prev)),
      prevTo: toApiDateTime(endOfMonth(prev)),
      label: formatMonth(cursor),
      shortLabel: format(cursor, 'MMM yyyy'),
      prevLabel: formatMonth(prev),
      rangeStart: start,
      // Charts shouldn't project into the future for the current month
      rangeEnd: isCurrentMonth ? now : end,
      goBack: () => setCursor((d) => prevMonth(d)),
      goForward: () => setCursor((d) => nextMonth(d)),
      canGoForward: !isCurrentMonth,
      isCurrentPeriod: isCurrentMonth,
    }
  }, [mode, cursor])

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
}

export const useDateRange = () => useContext(DateRangeContext)
