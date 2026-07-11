import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ChartNoAxesCombined, ArrowRight,
  ArrowUpRight, ArrowDownLeft, CalendarClock, Wallet,
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import DateRangePicker from '../components/ui/DateRangePicker'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton, SkeletonStatCard, SkeletonChart } from '../components/ui/Skeleton'
import { useTheme } from '../context/ThemeContext'
import { useDateRange } from '../context/DateRangeContext'
import { getTransactions, getCategories, getMerchants } from '../api/endpoints'
import { formatCurrency } from '../utils/date'
import { categoryColor, categoryLabel, CategoryIcon } from '../utils/categories'
import { format, eachDayOfInterval, parseISO, differenceInCalendarDays, getDay } from 'date-fns'

const compact = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${Math.round(v)}`)

function DeltaBadge({ current, previous, invert = false }) {
  if (previous == null || previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  if (!Number.isFinite(pct)) return null
  const up = pct > 0
  // For spending, up is bad; for income, up is good
  const good = invert ? up : !up
  return (
    <span
      className={`tnum inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        good ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}
      title="vs previous period"
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

export default function Analytics() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { from, to, prevFrom, prevTo, label, prevLabel, mode, rangeStart, rangeEnd } = useDateRange()

  const { data: txnData, isLoading: txnsLoading, isError: txnError, refetch: refetchTxn, isFetching: txnFetching } = useQuery({
    queryKey: ['analytics-txns', from, to],
    queryFn: () => getTransactions({ from, to, page: 0, size: 500 }),
  })

  const { data: prevTxnData, isLoading: prevLoading } = useQuery({
    queryKey: ['analytics-txns', prevFrom, prevTo],
    queryFn: () => getTransactions({ from: prevFrom, to: prevTo, page: 0, size: 500 }),
  })

  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories, isFetching: categoriesFetching } = useQuery({
    queryKey: ['categories', from, to],
    queryFn: () => getCategories(from, to),
  })

  const { data: prevCategories = [] } = useQuery({
    queryKey: ['categories', prevFrom, prevTo],
    queryFn: () => getCategories(prevFrom, prevTo),
  })

  const { data: merchants = [], isError: merchantsError, refetch: refetchMerchants, isFetching: merchantsFetching } = useQuery({
    queryKey: ['merchants', from, to, 8],
    queryFn: () => getMerchants(from, to, 8),
  })

  const hasError = txnError || categoriesError || merchantsError
  const isRetrying = txnFetching || categoriesFetching || merchantsFetching
  const retryAll = () => {
    refetchTxn()
    refetchCategories()
    refetchMerchants()
  }

  const txns = useMemo(() => txnData?.content ?? [], [txnData])
  const prevTxns = useMemo(() => prevTxnData?.content ?? [], [prevTxnData])

  // ── Derived series ─────────────────────────────────────────────────────────

  const daily = useMemo(() => {
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    const map = new Map(days.map((d) => [format(d, 'MMM d'), { label: format(d, 'MMM d'), spent: 0, received: 0 }]))
    txns.forEach((t) => {
      const key = format(parseISO(t.transactionTime), 'MMM d')
      const row = map.get(key)
      if (!row) return
      if (t.transactionType === 'DEBIT') row.spent += Number(t.amount)
      else row.received += Number(t.amount)
    })
    return [...map.values()]
  }, [txns, rangeStart, rangeEnd])

  const cumulative = useMemo(() => {
    const build = (list, start) => {
      const byDay = {}
      list.forEach((t) => {
        if (t.transactionType !== 'DEBIT') return
        const idx = differenceInCalendarDays(parseISO(t.transactionTime), parseISO(start)) + 1
        byDay[idx] = (byDay[idx] ?? 0) + Number(t.amount)
      })
      return byDay
    }
    const cur = build(txns, from)
    const prev = build(prevTxns, prevFrom)
    const curDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1
    const maxDay = Math.max(curDays, ...Object.keys(prev).map(Number), 1)
    const rows = []
    let curSum = 0
    let prevSum = 0
    for (let d = 1; d <= maxDay; d++) {
      curSum += cur[d] ?? 0
      prevSum += prev[d] ?? 0
      rows.push({
        day: d,
        current: d <= curDays ? curSum : null,
        previous: prevSum,
      })
    }
    return rows
  }, [txns, prevTxns, from, prevFrom, rangeStart, rangeEnd])

  const byWeekday = useMemo(() => {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const rows = names.map((name) => ({ name, spent: 0 }))
    txns.forEach((t) => {
      if (t.transactionType !== 'DEBIT') return
      const idx = (getDay(parseISO(t.transactionTime)) + 6) % 7 // Monday-first
      rows[idx].spent += Number(t.amount)
    })
    return rows
  }, [txns])

  const totals = useMemo(() => {
    const sum = (list, type) => list.filter((t) => t.transactionType === type).reduce((s, t) => s + Number(t.amount), 0)
    const spent = sum(txns, 'DEBIT')
    const received = sum(txns, 'CREDIT')
    const prevSpent = sum(prevTxns, 'DEBIT')
    const prevReceived = sum(prevTxns, 'CREDIT')
    const dayCount = Math.max(differenceInCalendarDays(rangeEnd, rangeStart) + 1, 1)
    const busiest = daily.reduce((best, d) => (d.spent > (best?.spent ?? 0) ? d : best), null)
    return { spent, received, prevSpent, prevReceived, avgDaily: spent / dayCount, busiest }
  }, [txns, prevTxns, daily, rangeStart, rangeEnd])

  const prevCatByKey = useMemo(
    () => Object.fromEntries(prevCategories.map((c) => [c.category, Number(c.totalSpend)])),
    [prevCategories],
  )

  const isLoadingAll = txnsLoading || categoriesLoading
  const isEmpty = !isLoadingAll && txns.length === 0

  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 12,
    border: `1px solid ${theme.chart.tooltipBorder}`,
    background: theme.chart.tooltipBg,
    color: theme.chart.text,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  }
  const tick = { fontSize: 10, fill: theme.chart.tick }

  const cardCls = 'min-w-0 rounded-3xl border border-border bg-card p-5 shadow-card'
  const sectionLabel = 'm-0 mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted'

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Analytics</p>
          <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-text md:text-[28px]">
            {mode === 'last30' ? 'Last 30 days' : label}
          </h1>
        </div>
        <DateRangePicker />
      </div>

      {hasError ? (
        <ErrorState title="We're having trouble loading your analytics" onRetry={retryAll} isRetrying={isRetrying} />
      ) : isEmpty ? (
        <div className="rounded-3xl border border-border bg-card shadow-card">
          <EmptyState
            icon={ChartNoAxesCombined}
            title="Nothing to analyze yet"
            message={`No transactions found for ${mode === 'last30' ? 'the last 30 days' : label}. Once transactions come in, you'll see trends, comparisons and patterns here.`}
            action="Go to transactions"
            actionIcon={ArrowRight}
            onAction={() => navigate('/transactions')}
          />
        </div>
      ) : (
        <>
          {/* Stat cards with period-over-period deltas */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {isLoadingAll ? (
              <><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>
            ) : (
              [
                {
                  label: 'Total spent', icon: ArrowUpRight, tone: 'bg-danger/10 text-danger',
                  value: formatCurrency(totals.spent),
                  delta: <DeltaBadge current={totals.spent} previous={totals.prevSpent} />,
                  sub: `vs ${prevLabel}`,
                },
                {
                  label: 'Total received', icon: ArrowDownLeft, tone: 'bg-success/10 text-success',
                  value: formatCurrency(totals.received),
                  delta: <DeltaBadge current={totals.received} previous={totals.prevReceived} invert />,
                  sub: `vs ${prevLabel}`,
                },
                {
                  label: 'Daily average', icon: Wallet, tone: 'bg-info/10 text-info',
                  value: formatCurrency(totals.avgDaily),
                  sub: 'spend per day',
                },
                {
                  label: 'Biggest day', icon: CalendarClock, tone: 'bg-accent-soft text-accent-strong',
                  value: totals.busiest?.spent ? formatCurrency(totals.busiest.spent) : '—',
                  sub: totals.busiest?.spent ? totals.busiest.label : 'no spending yet',
                },
              ].map(({ label: l, icon: Icon, tone, value, delta, sub }) => (
                <div key={l} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}><Icon size={14} /></span>
                      <span className="text-xs font-medium text-muted">{l}</span>
                    </span>
                    {delta}
                  </div>
                  <p className="tnum m-0 truncate text-lg font-bold text-text">{value}</p>
                  {sub && <p className="m-0 mt-1 text-[11px] text-muted">{sub}</p>}
                </div>
              ))
            )}
          </div>

          {/* Daily flow */}
          <div className={`${cardCls} mb-4`}>
            <p className={sectionLabel}>Daily spend & income</p>
            {txnsLoading ? (
              <SkeletonChart height={220} />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={daily} margin={{ left: 0, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval={Math.max(Math.floor(daily.length / 7) - 1, 0)} />
                  <YAxis tickFormatter={compact} tick={tick} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    formatter={(v, name) => [formatCurrency(v), name === 'spent' ? 'Spent' : 'Received']}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: theme.chart.sub, fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="spent" stroke="#F43F5E" strokeWidth={2} fill="url(#spentGrad)" dot={false} name="spent" />
                  <Area type="monotone" dataKey="received" stroke="#10B981" strokeWidth={2} fill="url(#receivedGrad)" dot={false} name="received" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cumulative comparison + weekday pattern */}
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <div className={cardCls}>
              <p className={sectionLabel}>Cumulative spend · {mode === 'last30' ? 'vs previous 30 days' : `vs ${prevLabel}`}</p>
              {txnsLoading || prevLoading ? (
                <SkeletonChart height={200} />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={cumulative} margin={{ left: 0, right: 8, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} vertical={false} />
                    <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} tickFormatter={(d) => `D${d}`} />
                    <YAxis tickFormatter={compact} tick={tick} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      formatter={(v, name) => [formatCurrency(v), name === 'current' ? 'This period' : 'Previous']}
                      labelFormatter={(d) => `Day ${d}`}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: theme.chart.sub, fontWeight: 600 }}
                    />
                    <Legend
                      formatter={(v) => (
                        <span style={{ color: theme.chart.sub, fontSize: 11 }}>{v === 'current' ? 'This period' : 'Previous period'}</span>
                      )}
                      iconType="plainline"
                    />
                    <Line type="monotone" dataKey="previous" stroke={theme.chart.tick} strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="previous" />
                    <Line type="monotone" dataKey="current" stroke={theme.accent} strokeWidth={2.5} dot={false} name="current" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={cardCls}>
              <p className={sectionLabel}>Spending by day of week</p>
              {txnsLoading ? (
                <SkeletonChart height={200} />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={byWeekday} margin={{ left: 0, right: 8, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={compact} tick={tick} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Spent']}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: theme.chart.sub, fontWeight: 600 }}
                      cursor={{ fill: theme.chart.grid, opacity: 0.35 }}
                    />
                    <Bar dataKey="spent" fill={theme.accent} radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Categories with deltas + top merchants */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={cardCls}>
              <p className={sectionLabel}>Category trends</p>
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : categories.length === 0 ? (
                <EmptyState compact icon={ChartNoAxesCombined} title="No category data" message="Spending will be broken down by category here." />
              ) : (
                <div className="flex flex-col gap-4">
                  {categories.map((c) => {
                    const color = categoryColor(c.category)
                    const prev = prevCatByKey[c.category]
                    return (
                      <div key={c.category}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: `${color}1f`, color }}>
                              <CategoryIcon category={c.category} size={12} />
                            </span>
                            <span className="truncate text-xs font-semibold text-text">{categoryLabel(c.category)}</span>
                            <span className="shrink-0 text-[11px] text-muted">· {c.transactionCount} txns</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <DeltaBadge current={Number(c.totalSpend)} previous={prev} />
                            <span className="tnum text-xs font-bold text-text">{formatCurrency(c.totalSpend)}</span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-elev">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ background: color, width: `${Math.min(c.percentageShare ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={cardCls}>
              <p className={sectionLabel}>Top merchants</p>
              {merchants.filter((m) => m.merchant).length === 0 ? (
                <EmptyState compact icon={ChartNoAxesCombined} title="No merchant data" message="Your most-visited merchants will rank here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const list = merchants.filter((m) => m.merchant)
                    const max = Math.max(...list.map((m) => Number(m.totalSpend)), 1)
                    return list.map((m, i) => {
                      const color = categoryColor(m.topCategory)
                      return (
                        <div key={m.merchant} className="flex items-center gap-3">
                          <span className="tnum w-5 shrink-0 text-center text-[11px] font-bold text-muted">{i + 1}</span>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: color }}>
                            {m.merchant[0]?.toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-text">{m.merchant}</span>
                              <span className="tnum shrink-0 text-xs font-bold text-text">{formatCurrency(m.totalSpend)}</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-elev">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ background: color, width: `${(Number(m.totalSpend) / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </Layout>
  )
}
