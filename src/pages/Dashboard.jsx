import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  ArrowUpRight, ArrowDownLeft, Scale, Store, Plus,
  ReceiptText, Sparkles, ArrowRight, SearchX,
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import DateRangePicker from '../components/ui/DateRangePicker'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import SetupChecklist from '../components/ui/SetupChecklist'
import LogTransactionModal from '../components/ui/LogTransactionModal'
import Button from '../components/ui/Button'
import { useIsMobile } from '../hooks/useIsMobile'
import { Skeleton, SkeletonStatCard, SkeletonList } from '../components/ui/Skeleton'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useDateRange } from '../context/DateRangeContext'
import { getSummary, getCategories, getMerchants, getTransactions, getUserStatus } from '../api/endpoints'
import { formatCurrency, formatDate } from '../utils/date'
import { categoryColor, categoryLabel, CategoryIcon, formatMode } from '../utils/categories'
import { timeGreeting, firstName } from '../utils/greeting'

function StatCard({ label, value, sub, icon: Icon, tone }) {
  const tones = {
    danger: 'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    accent: 'bg-accent-soft text-accent-strong',
  }
  return (
    <div className="group rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={14} />
        </span>
        <p className="m-0 text-xs font-medium text-muted">{label}</p>
      </div>
      <p className="tnum m-0 truncate text-lg font-bold leading-tight text-text">{value}</p>
      {sub && <p className="m-0 mt-1 text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

function SpendingPulse({ debit = 0, credit = 0 }) {
  const total = Number(debit) + Number(credit)
  const debitPct = total > 0 ? (Number(debit) / total) * 100 : 50
  return (
    <div className="mb-5 rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Spending pulse</span>
        <span className="text-[11px] text-muted">Money out vs in</span>
      </div>
      <div className="mb-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <div className="rounded-l-full bg-danger transition-all duration-700" style={{ width: `${debitPct}%` }} />
        <div className="flex-1 rounded-r-full bg-success transition-all duration-700" />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" />
          <span className="text-sub">Spent</span>
          <span className="tnum font-semibold text-text">{formatCurrency(debit)}</span>
          <span className="text-muted">({debitPct.toFixed(0)}%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted">({(100 - debitPct).toFixed(0)}%)</span>
          <span className="tnum font-semibold text-text">{formatCurrency(credit)}</span>
          <span className="text-sub">Received</span>
          <span className="h-2 w-2 rounded-full bg-success" />
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { theme } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { from, to, label, mode, isCurrentPeriod } = useDateRange()
  const [showLogModal, setShowLogModal] = useState(false)

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary, isFetching: summaryFetching } = useQuery({
    queryKey: ['summary', from, to],
    queryFn: () => getSummary(from, to),
  })

  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories, isFetching: categoriesFetching } = useQuery({
    queryKey: ['categories', from, to],
    queryFn: () => getCategories(from, to),
  })

  const { data: merchants = [], isError: merchantsError, refetch: refetchMerchants, isFetching: merchantsFetching } = useQuery({
    queryKey: ['merchants', from, to],
    queryFn: () => getMerchants(from, to, 5),
  })

  const { data: recentData, isLoading: recentLoading, isError: recentError, refetch: refetchRecent, isFetching: recentFetching } = useQuery({
    queryKey: ['transactions-recent', from, to],
    queryFn: () => getTransactions({ from, to, page: 0, size: 6 }),
  })

  // One warm hello per session for returning users
  useEffect(() => {
    if (status?.onboarded && status?.name && !sessionStorage.getItem('lm-welcomed')) {
      sessionStorage.setItem('lm-welcomed', '1')
      toast(`Welcome back, ${firstName(status.name)}!`, { type: 'info' })
    }
  }, [status, toast])

  const hasError = summaryError || categoriesError || merchantsError || recentError
  const isRetrying = summaryFetching || categoriesFetching || merchantsFetching || recentFetching
  const retryAll = () => {
    refetchSummary()
    refetchCategories()
    refetchMerchants()
    refetchRecent()
  }

  const recentTxns = recentData?.content ?? []
  const net = Number(summary?.net ?? 0)
  const netPositive = net >= 0
  const isEmptyPeriod = !summaryLoading && (summary?.transactionCount ?? 0) === 0
  const earlyInMonth = mode === 'month' && isCurrentPeriod && new Date().getDate() <= 5

  const spentLabel = mode === 'last30' ? 'spent in the last 30 days' : `spent in ${label}`

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1.5 text-[13px] font-semibold text-sub">
              <Sparkles size={13} className="text-accent-strong" />
              {timeGreeting()}{firstName(status?.name) ? `, ${firstName(status.name)}` : ''}
            </p>
            {summaryLoading ? (
              <Skeleton className="mt-2 h-9 w-56" />
            ) : (
              <h1 className="tnum m-0 mt-1 text-[26px] font-extrabold tracking-tight text-text md:text-3xl">
                {formatCurrency(summary?.totalDebit)}
                <span className="ml-2.5 text-sm font-normal text-muted md:text-base">{spentLabel}</span>
              </h1>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setShowLogModal(true)}
              aria-label="Log transaction"
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border-none bg-accent text-white shadow-[0_2px_12px_var(--accent-glow)] transition-transform active:scale-90"
            >
              <Plus size={20} strokeWidth={2.4} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker />
          {!isMobile && (
            <Button size="md" icon={Plus} onClick={() => setShowLogModal(true)}>
              Log
            </Button>
          )}
        </div>
      </div>

      <SetupChecklist status={status} />

      {hasError ? (
        <ErrorState title="We're having trouble loading your dashboard" onRetry={retryAll} isRetrying={isRetrying} />
      ) : (
        <>
          {!isEmptyPeriod && <SpendingPulse debit={summary?.totalDebit} credit={summary?.totalCredit} />}

          {/* Stat cards */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryLoading ? (
              <>
                <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
              </>
            ) : (
              <>
                <StatCard
                  label="Total spent" icon={ArrowUpRight} tone="danger"
                  value={formatCurrency(summary?.totalDebit)}
                  sub={`${summary?.transactionCount ?? 0} transactions`}
                />
                <StatCard
                  label="Total received" icon={ArrowDownLeft} tone="success"
                  value={formatCurrency(summary?.totalCredit)}
                />
                <StatCard
                  label="Net balance" icon={Scale} tone={netPositive ? 'success' : 'danger'}
                  value={`${netPositive ? '' : '−'}${formatCurrency(Math.abs(net))}`}
                  sub={netPositive ? 'Surplus' : 'Deficit'}
                />
                <StatCard
                  label="Top merchant" icon={Store} tone="info"
                  value={summary?.topMerchant ?? '—'}
                  sub={summary?.topMerchantSpend ? formatCurrency(summary.topMerchantSpend) : undefined}
                />
              </>
            )}
          </div>

          {/* Categories + recent transactions */}
          <div className="mb-4 grid gap-4 lg:grid-cols-5">
            <div className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-card lg:col-span-2">
              <p className="m-0 mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">By category</p>
              {categoriesLoading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="w-full space-y-2.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-5/6" />
                    <Skeleton className="h-3.5 w-4/6" />
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <EmptyState
                  compact
                  icon={ReceiptText}
                  title="No spending yet"
                  message={earlyInMonth ? 'The month is just getting started — categories will fill in as you spend.' : 'Spending in this period will be broken down here.'}
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={categories} dataKey="totalSpend" nameKey="category"
                        cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                        paddingAngle={2} strokeWidth={0}
                      >
                        {categories.map((c) => (
                          <Cell key={c.category} fill={categoryColor(c.category)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, name) => [formatCurrency(v), categoryLabel(name)]}
                        contentStyle={{
                          fontSize: 12, borderRadius: 12,
                          border: `1px solid ${theme.chart.tooltipBorder}`,
                          background: theme.chart.tooltipBg, color: theme.chart.text,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 flex flex-col gap-2.5">
                    {categories.slice(0, 5).map((c) => (
                      <div key={c.category} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                            style={{ background: `${categoryColor(c.category)}1f`, color: categoryColor(c.category) }}
                          >
                            <CategoryIcon category={c.category} size={12} />
                          </span>
                          <span className="truncate text-xs font-medium text-sub">{categoryLabel(c.category)}</span>
                        </span>
                        <span className="tnum shrink-0 text-xs">
                          <span className="font-semibold text-text">{formatCurrency(c.totalSpend)}</span>
                          <span className="ml-1.5 text-muted">{c.percentageShare?.toFixed(0)}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:col-span-3">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Recent transactions</p>
                <Link to="/transactions" className="flex items-center gap-1 text-xs font-semibold text-accent-strong no-underline hover:underline">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {recentLoading ? (
                <SkeletonList rows={5} />
              ) : recentTxns.length === 0 ? (
                <EmptyState
                  icon={isEmptyPeriod && earlyInMonth ? Sparkles : SearchX}
                  title={earlyInMonth ? 'A fresh month awaits' : `No transactions in ${mode === 'last30' ? 'the last 30 days' : label}`}
                  message={
                    status && !status.gmailConnected
                      ? 'Connect Gmail above to capture transactions automatically, or log one manually.'
                      : earlyInMonth
                        ? 'Transactions will appear here as your bank alerts arrive.'
                        : 'Nothing recorded for this period. You can log cash or UPI spends manually.'
                  }
                  action="Log a transaction"
                  actionIcon={Plus}
                  onAction={() => setShowLogModal(true)}
                />
              ) : (
                <div>
                  {recentTxns.map((txn, i) => (
                    <button
                      key={txn.id}
                      onClick={() => navigate('/transactions')}
                      className={`flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-5 py-3 text-left transition-colors hover:bg-elev ${
                        i < recentTxns.length - 1 ? 'border-b border-solid border-border' : ''
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                        style={{ background: `${categoryColor(txn.category)}1f`, color: categoryColor(txn.category) }}
                      >
                        <CategoryIcon category={txn.category} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-text">{txn.counterparty ?? 'Unknown'}</span>
                        <span className="block text-[11px] text-muted">{formatDate(txn.transactionTime)}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={`tnum block text-[13px] font-bold ${txn.transactionType === 'DEBIT' ? 'text-danger' : 'text-success'}`}>
                          {txn.transactionType === 'DEBIT' ? '−' : '+'}{formatCurrency(txn.amount)}
                        </span>
                        <span className="block text-[10px] font-medium text-muted">{formatMode(txn.paymentMode) || txn.transactionType}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top merchants */}
          {merchants.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <p className="m-0 mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Top merchants</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {merchants.map((m) => {
                  const color = categoryColor(m.topCategory)
                  return (
                    <div
                      key={m.merchant}
                      className="rounded-2xl border border-border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <div
                        className="mb-2.5 grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white"
                        style={{ background: color }}
                      >
                        {m.merchant?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <p className="m-0 truncate text-xs font-semibold text-text">{m.merchant}</p>
                      <p className="tnum m-0 mt-0.5 text-[13px] font-bold" style={{ color }}>{formatCurrency(m.totalSpend)}</p>
                      <p className="m-0 text-[11px] text-muted">{m.transactionCount} txns</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showLogModal && <LogTransactionModal onClose={() => setShowLogModal(false)} />}
    </Layout>
  )
}
