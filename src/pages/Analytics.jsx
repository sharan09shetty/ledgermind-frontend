import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Layout from '../components/layout/Layout'
import CashLogModal from '../components/ui/CashLogModal'
import ErrorState from '../components/ui/ErrorState'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { getTransactions, getCategories, getMerchants } from '../api/endpoints'
import { formatCurrency, toApiDateTime } from '../utils/date'
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval, parseISO } from 'date-fns'

const now = new Date()
const from30 = toApiDateTime(startOfDay(subDays(now, 29)))
const to30 = toApiDateTime(endOfDay(now))
const monthFrom = toApiDateTime(startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)))
const monthTo = toApiDateTime(endOfDay(now))

const CATEGORY_COLORS = {
  FOOD: '#F59E0B', TRAVEL: '#3B82F6', SHOPPING: '#8B5CF6', BILLS: '#6B7280',
  ENTERTAINMENT: '#EC4899', HEALTH: '#10B981', INVESTMENT: '#14B8A6',
  SALARY: '#22C55E', TRANSFER: '#64748B', OTHER: '#CBD5E1',
}

// Truncate long merchant names for Y-axis labels
const truncate = (str, max = 14) =>
    str && str.length > max ? str.slice(0, max) + '…' : str

// Custom Y-axis tick to truncate merchant names
const MerchantTick = ({ x, y, payload, theme }) => (
    <text x={x} y={y} dy={4} textAnchor="end" fill={theme.textSub} fontSize={11}>
      {truncate(payload.value, 13)}
    </text>
)

export default function Analytics() {
  const [showCashLog, setShowCashLog] = useState(false)
  const { theme } = useTheme()
  const isMobile = useIsMobile()

  const { data: txnData, isLoading, isError: txnError, refetch: refetchTxn, isFetching: txnFetching } = useQuery({
    queryKey: ['analytics-txns', from30, to30],
    queryFn: () => getTransactions({ from: from30, to: to30, page: 0, size: 500 }),
  })

  const { data: categories = [], isError: categoriesError, refetch: refetchCategories, isFetching: categoriesFetching } = useQuery({
    queryKey: ['categories', monthFrom, monthTo],
    queryFn: () => getCategories(monthFrom, monthTo),
  })

  const { data: merchants = [], isError: merchantsError, refetch: refetchMerchants, isFetching: merchantsFetching } = useQuery({
    queryKey: ['merchants', monthFrom, monthTo, 10],
    queryFn: () => getMerchants(monthFrom, monthTo, 10),
  })

  const hasError = txnError || categoriesError || merchantsError
  const isRetrying = txnFetching || categoriesFetching || merchantsFetching
  const retryAll = () => {
    refetchTxn()
    refetchCategories()
    refetchMerchants()
  }

  const dailyChart = (() => {
    const txns = txnData?.content ?? []
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now })
    const map = {}
    days.forEach((d) => { map[format(d, 'MMM d')] = { label: format(d, 'MMM d'), spent: 0, received: 0 } })
    txns.forEach((t) => {
      const key = format(parseISO(t.transactionTime), 'MMM d')
      if (!map[key]) return
      if (t.transactionType === 'DEBIT') map[key].spent += Number(t.amount)
      else map[key].received += Number(t.amount)
    })
    return Object.values(map)
  })()

  const totalSpent30 = dailyChart.reduce((s, d) => s + d.spent, 0)
  const totalReceived30 = dailyChart.reduce((s, d) => s + d.received, 0)
  const avgDaily = totalSpent30 / 30

  const card = {
    background: theme.card, borderRadius: '20px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  const tooltipStyle = {
    fontSize: '12px', borderRadius: '10px',
    border: `1px solid ${theme.cardBorder}`,
    background: theme.card, color: theme.text,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }

  return (
      <Layout>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          justifyContent: 'space-between', gap: isMobile ? '14px' : 0, marginBottom: '28px',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Analytics</p>
            <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>Last 30 Days</h1>
          </div>
          <button
              onClick={() => setShowCashLog(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', border: 'none', background: '#10B981', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Cash
          </button>
        </div>

        {hasError ? (
            <ErrorState
                title="We're having trouble loading your analytics"
                onRetry={retryAll}
                isRetrying={isRetrying}
            />
        ) : (
            <>
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Spent', value: formatCurrency(totalSpent30), dot: '#F43F5E' },
                  { label: 'Total Received', value: formatCurrency(totalReceived30), dot: '#10B981' },
                  { label: 'Daily Average', value: formatCurrency(avgDaily), dot: '#3B82F6' },
                ].map(({ label, value, dot }) => (
                    <div key={label} style={{ ...card, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                        <p style={{ fontSize: '11px', fontWeight: 500, color: theme.textMuted, margin: 0 }}>{label}</p>
                      </div>
                      <p style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>{value}</p>
                    </div>
                ))}
              </div>

              {/* Daily area chart */}
              <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Daily Spend & Income</p>
                {isLoading ? (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '13px' }}>Loading...</div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={dailyChart} margin={{ left: 0, right: 8, top: 4 }}>
                        <defs>
                          <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.cardBorder} vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} interval={4} />
                        <YAxis tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v, name) => [formatCurrency(v), name === 'spent' ? 'Spent' : 'Received']} contentStyle={tooltipStyle} labelStyle={{ color: theme.textSub, fontWeight: 500 }} />
                        <Area type="monotone" dataKey="spent" stroke="#F43F5E" strokeWidth={2} fill="url(#spentGrad)" dot={false} name="spent" />
                        <Area type="monotone" dataKey="received" stroke="#10B981" strokeWidth={2} fill="url(#receivedGrad)" dot={false} name="received" />
                      </AreaChart>
                    </ResponsiveContainer>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                {/* Category bars */}
                <div style={{ ...card, padding: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Categories This Month</p>
                  {categories.length === 0 ? (
                      <p style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', padding: '24px 0' }}>No data yet</p>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {categories.map((c) => (
                            <div key={c.category}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[c.category] ?? '#CBD5E1', flexShrink: 0 }} />
                                  <span style={{ fontSize: '12px', fontWeight: 500, color: theme.text }}>{c.category}</span>
                                  <span style={{ fontSize: '11px', color: theme.textMuted }}>· {c.transactionCount} txns</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text }}>{formatCurrency(c.totalSpend)}</span>
                              </div>
                              <div style={{ height: '5px', borderRadius: '99px', background: theme.inputBorder, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: '99px', background: CATEGORY_COLORS[c.category] ?? '#CBD5E1', width: `${c.percentageShare ?? 0}%`, transition: 'width 0.7s ease' }} />
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </div>

                {/* Merchant bar chart — fixed with truncated labels */}
                <div style={{ ...card, padding: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Top Merchants This Month</p>
                  {merchants.length === 0 ? (
                      <p style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', padding: '24px 0' }}>No data yet</p>
                  ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={merchants}
                            layout="vertical"
                            margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.cardBorder} />
                          <XAxis
                              type="number"
                              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                              tick={{ fontSize: 10, fill: theme.textMuted }}
                              axisLine={false}
                              tickLine={false}
                          />
                          <YAxis
                              type="category"
                              dataKey="merchant"
                              width={100}
                              axisLine={false}
                              tickLine={false}
                              tick={(props) => <MerchantTick {...props} theme={theme} />}
                          />
                          <Tooltip
                              formatter={(v) => [formatCurrency(v), 'Spent']}
                              contentStyle={tooltipStyle}
                              labelFormatter={(label) => label}
                          />
                          <Bar dataKey="totalSpend" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
        )}

        {showCashLog && <CashLogModal onClose={() => setShowCashLog(false)} />}
      </Layout>
  )
}