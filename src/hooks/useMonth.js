import { useState } from 'react'
import { monthStart, monthEnd, prevMonth, nextMonth, formatMonth } from '../utils/date'

export function useMonth() {
  const [date, setDate] = useState(new Date())

  return {
    date,
    from: monthStart(date),
    to: monthEnd(date),
    label: formatMonth(date),
    goBack: () => setDate(prevMonth(date)),
    goForward: () => setDate(nextMonth(date)),
    isCurrentMonth: formatMonth(date) === formatMonth(new Date()),
  }
}
