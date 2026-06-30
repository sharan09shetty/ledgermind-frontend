import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/layout/Layout'
import SpendingPulse from '../components/ui/SpendingPulse'
import MonthPicker from '../components/ui/MonthPicker'
import ErrorState from '../components/ui/ErrorState'
import { useTheme } from '../context/ThemeContext'
import { useMonth } from '../hooks/useMonth'
import { getSummary, getCategories, getMerchants, getTransactions } from '../api/endpoints'
import { formatCurrency, formatDate } from '../utils/date'

const CATEGORY_COLORS = {
  FOOD: '#F59E0B', TRAVEL: '#3B82F6', SHOPPING: '#8B5CF6', BILLS: '#6B7280',
  ENTERTAINMENT: '#EC4899', HEALTH: '#10B981', INVESTMENT: '#14B8A6',
  SALARY: '#22C55E', TRANSFER: '#64748B', OTHER: '#CBD5E1',
}

const CATEGORY_ICONS = {
  FOOD: '🍽', TRAVEL: '✈', SHOPPING: '🛍', BILLS: '📄',
  ENTERTAINMENT: '🎬', HEALTH: '💊', INVESTMENT: '📈',
  SALARY: '💰', TRANSFER: '↔', OTHER: '•',
}

export default function Dashboard() {
  const { theme } = useTheme()
  const { from, to, label, goBack, goForward, isCurrentMonth } = useMonth()

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary, isFetching: summaryFetching } = useQuery({
    queryKey: ['summary', from, to],
    queryFn: () => getSummary(from, to),
  })

  const { data: categories = [], isError: categoriesError, refetch: refetchCategories, isFetching: categoriesFetching } = useQuery({
    queryKey: ['categories', from, to],
    queryFn: () => getCategories(from, to),
  })

  const { data: merchants = [], isError: merchantsError, refetch: refetchMerchants, isFetching: merchantsFetching } = useQuery({
    queryKey: ['merchants', from, to],
    queryFn: () => getMerchants(from, to, 5),
  })

  const { data: recentData, isError: recentError, refetch: refetchRecent, isFetching: recentFetching } = useQuery({
    queryKey: ['transactions-recent', from, to],
    queryFn: () => getTransactions({ from, to, page: 0, size: 6 }),
  })

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

  const card = { background: theme.card, borderRadius: '20px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow }
  const sectionLabel = { fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }

  return (
      <Layout>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <p style={{ ...sectionLabel, marginBottom: '4px' }}>Overview</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>
              {summaryLoading ? '—' : formatCurrency(summary?.totalDebit)}
              <span style={{ fontSize: '17px', fontWeight: 400, color: theme.textMuted, marginLeft: '10px' }}>spent this month</span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MonthPicker label={label} onBack={goBack} onForward={goForward} disableForward={isCurrentMonth} />
          </div>
        </div>

        <SpendingPulse debit={summary?.totalDebit} credit={summary?.totalCredit} />

        {hasError ? (
            <ErrorState
                title="We're having trouble loading your dashboard"
                onRetry={retryAll}
                isRetrying={isRetrying}
            />
        ) : (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Spent', value: formatCurrency(summary?.totalDebit), sub: `${summary?.transactionCount ?? 0} transactions`, dot: '#F43F5E' },
                  { label: 'Total Received', value: formatCurrency(summary?.totalCredit), dot: '#10B981' },
                  { label: 'Net Balance', value: formatCurrency(Math.abs(net)), sub: netPositive ? 'surplus' : 'deficit', dot: netPositive ? '#10B981' : '#F43F5E' },
                  { label: 'Top Merchant', value: summary?.topMerchant ?? '—', sub: summary?.topMerchantSpend ? formatCurrency(summary.topMerchantSpend) : undefined, dot: '#3B82F6' },
                ].map(({ label, value, sub, dot }) => (
                    <div key={label} style={{ ...card, padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', fontWeight: 500, color: theme.textMuted, margin: 0 }}>{label}</p>
                      </div>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                      {sub && <p style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>{sub}</p>}
                    </div>
                ))}
              </div>

              {/* Categories + recent transactions */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '16px', marginBottom: '16px' }}>

                <div style={{ ...card, padding: '20px' }}>
                  <p style={{ ...sectionLabel, marginBottom: '16px' }}>By Category</p>
                  {categories.length === 0 ? (
                      <p style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', padding: '32px 0' }}>No spending data</p>
                  ) : (
                      <>
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie data={categories} dataKey="totalSpend" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} strokeWidth={0}>
                              {categories.map((c) => (
                                  <Cell key={c.category} fill={CATEGORY_COLORS[c.category] ?? '#CBD5E1'} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: '12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, background: theme.card, color: theme.text }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                          {categories.slice(0, 5).map((c) => (
                              <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '13px' }}>{CATEGORY_ICONS[c.category] ?? '•'}</span>
                                  <span style={{ fontSize: '12px', color: theme.textSub }}>{c.category}</span>
                                </div>
                                <div>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: theme.text }}>{formatCurrency(c.totalSpend)}</span>
                                  <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: '6px' }}>{c.percentageShare?.toFixed(0)}%</span>
                                </div>
                              </div>
                          ))}
                        </div>
                      </>
                  )}
                </div>

                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <p style={sectionLabel}>Recent Transactions</p>
                    <a href="/transactions" style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', textDecoration: 'none' }}>View all →</a>
                  </div>
                  <div>
                    {recentTxns.length === 0 ? (
                        <p style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', padding: '40px 0' }}>No transactions this month</p>
                    ) : recentTxns.map((txn, i) => (
                        <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: i < recentTxns.length - 1 ? `1px solid ${theme.cardBorder}` : 'none' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, background: `${CATEGORY_COLORS[txn.category] ?? '#CBD5E1'}22` }}>
                            {CATEGORY_ICONS[txn.category] ?? '•'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: theme.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.counterparty ?? 'Unknown'}</p>
                            <p style={{ fontSize: '11px', color: theme.textMuted, margin: 0 }}>{formatDate(txn.transactionTime)}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981' }}>
                              {txn.transactionType === 'DEBIT' ? '-' : '+'}{formatCurrency(txn.amount)}
                            </p>
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '6px', background: txn.transactionType === 'DEBIT' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981' }}>
                    {txn.paymentMode ?? txn.transactionType}
                  </span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              {merchants.length > 0 && (
                  <div style={{ ...card, padding: '20px' }}>
                    <p style={{ ...sectionLabel, marginBottom: '16px' }}>Top Merchants</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                      {merchants.map((m) => {
                        const color = CATEGORY_COLORS[m.topCategory] ?? '#CBD5E1'
                        return (
                            <div key={m.merchant} style={{ borderRadius: '14px', padding: '14px', border: `1px solid ${theme.cardBorder}` }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '8px', background: color }}>
                                {m.merchant?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: theme.text, margin: 0, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.merchant}</p>
                              <p style={{ fontSize: '12px', fontWeight: 700, margin: 0, color }}>{formatCurrency(m.totalSpend)}</p>
                              <p style={{ fontSize: '11px', color: theme.textMuted, margin: 0 }}>{m.transactionCount} txns</p>
                            </div>
                        )
                      })}
                    </div>
                  </div>
              )}
            </>
        )}
      </Layout>
  )
}