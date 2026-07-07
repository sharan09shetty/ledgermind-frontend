import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import MonthPicker from '../components/ui/MonthPicker'
import EditTransactionModal from '../components/ui/EditTransactionModal'
import LogTransactionModal from '../components/ui/LogTransactionModal'
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useMonth } from '../hooks/useMonth'
import { getTransactions, updateCategory, deleteTransaction } from '../api/endpoints'
import { formatCurrency, formatDate } from '../utils/date'

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'ENTERTAINMENT', 'HEALTH', 'INVESTMENT', 'SALARY', 'TRANSFER', 'OTHER']
const TYPES = ['DEBIT', 'CREDIT']
const MODES = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'CHEQUE', 'NEFT', 'IMPS', 'RTGS']

const CATEGORY_COLORS = {
  FOOD: '#F59E0B', TRAVEL: '#3B82F6', SHOPPING: '#8B5CF6', BILLS: '#6B7280',
  ENTERTAINMENT: '#EC4899', HEALTH: '#10B981', INVESTMENT: '#14B8A6',
  SALARY: '#22C55E', TRANSFER: '#64748B', OTHER: '#CBD5E1',
}

export default function Transactions() {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const { from, to, label, goBack, goForward, isCurrentMonth } = useMonth()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ category: '', transactionType: '', paymentMode: '', counterparty: '' })
  const [editingId, setEditingId] = useState(null)
  const [editingTxn, setEditingTxn] = useState(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingTxn, setDeletingTxn] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['transactions', from, to, page, filters],
    queryFn: () => getTransactions({
      from, to, page, size: 20,
      ...(filters.category && { category: filters.category }),
      ...(filters.transactionType && { transactionType: filters.transactionType }),
      ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
      ...(filters.counterparty && { counterparty: filters.counterparty }),
    }),
    keepPreviousData: true,
  })

  const categoryMutation = useMutation({
    mutationFn: ({ id, category }) => updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTransaction(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-recent'] })
      setDeletingTxn(null)
    },
    onSettled: () => setDeletingId(null),
  })

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }))
    setPage(0)
  }

  const txns = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const card = { background: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow }
  const inputStyle = { border: `1.5px solid ${theme.inputBorder}`, borderRadius: '10px', padding: '9px 12px', fontSize: '13px', outline: 'none', background: theme.inputBg, color: theme.text }

  return (
      <Layout>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          justifyContent: 'space-between', gap: isMobile ? '14px' : 0, marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>Transactions</h1>
            <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '4px' }}>{isError ? '—' : `${data?.totalElements ?? 0} transactions`}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
            <MonthPicker label={label} onBack={goBack} onForward={goForward} disableForward={isCurrentMonth} />
            <button
                onClick={() => setShowLogModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', border: 'none', background: '#10B981', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
            >
              + Log Transaction
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ ...card, padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
            <input
                placeholder="Search merchant..."
                value={filters.counterparty}
                onChange={(e) => setFilter('counterparty', e.target.value)}
                style={inputStyle}
            />
            <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} style={inputStyle}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} style={{ background: theme.card }}>{c}</option>)}
            </select>
            <select value={filters.transactionType} onChange={(e) => setFilter('transactionType', e.target.value)} style={inputStyle}>
              <option value="">All types</option>
              {TYPES.map((t) => <option key={t} style={{ background: theme.card }}>{t}</option>)}
            </select>
            <select value={filters.paymentMode} onChange={(e) => setFilter('paymentMode', e.target.value)} style={inputStyle}>
              <option value="">All modes</option>
              {MODES.map((m) => <option key={m} style={{ background: theme.card }}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Mobile: card list (no horizontal scroll needed to reach actions) */}
        {isMobile ? (
            <div style={{ ...card, overflow: 'hidden' }}>
              {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: theme.textMuted, fontSize: '13px' }}>Loading...</div>
              ) : isError ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: theme.text, margin: 0 }}>We're having trouble loading your transactions</p>
                    <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px', marginBottom: '16px' }}>Please try again in a moment.</p>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        style={{
                          fontSize: '12px', fontWeight: 600, padding: '8px 18px', borderRadius: '10px',
                          border: 'none', cursor: isFetching ? 'default' : 'pointer',
                          background: theme.sidebarActive, color: 'white', opacity: isFetching ? 0.6 : 1,
                        }}
                    >
                      {isFetching ? 'Retrying...' : 'Try Again'}
                    </button>
                  </div>
              ) : txns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: theme.textMuted, fontSize: '13px' }}>No transactions found</div>
              ) : txns.map((txn, i) => (
                  <div
                      key={txn.id}
                      style={{
                        padding: '14px 16px',
                        borderBottom: i < txns.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
                        background: i % 2 === 1 ? theme.tableRowAlt : 'transparent',
                      }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: theme.text, margin: 0, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.counterparty ?? '—'}</p>
                        <p style={{ fontSize: '11px', color: theme.textMuted, margin: '2px 0 0' }}>{formatDate(txn.transactionTime)}</p>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: '15px', margin: 0, flexShrink: 0, color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981' }}>
                        {txn.transactionType === 'DEBIT' ? '-' : '+'}{formatCurrency(txn.amount)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      {editingId === txn.id ? (
                          <select
                              defaultValue={txn.category}
                              autoFocus
                              onChange={(e) => categoryMutation.mutate({ id: txn.id, category: e.target.value })}
                              onBlur={() => setEditingId(null)}
                              style={{ border: `1.5px solid ${theme.sidebarActive}`, borderRadius: '8px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: theme.card, color: theme.text }}
                          >
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                          </select>
                      ) : (
                          <button
                              onClick={() => setEditingId(txn.id)}
                              style={{
                                fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                                border: 'none', cursor: 'pointer',
                                background: `${CATEGORY_COLORS[txn.category] ?? '#CBD5E1'}22`,
                                color: CATEGORY_COLORS[txn.category] ?? theme.textSub,
                              }}
                          >
                            {txn.category}
                          </button>
                      )}
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px',
                        background: txn.transactionType === 'DEBIT' ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                        color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981',
                      }}>
                        {txn.transactionType}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px', background: theme.inputBg, color: theme.textSub }}>
                        {txn.paymentMode}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                          onClick={() => setEditingTxn(txn)}
                          style={{
                            flex: 1, fontSize: '12px', fontWeight: 600, padding: '8px 10px', borderRadius: '8px',
                            border: `1.5px solid ${theme.inputBorder}`, cursor: 'pointer',
                            background: 'transparent', color: theme.textSub,
                          }}
                      >
                        ✎ Edit
                      </button>
                      <button
                          onClick={() => setDeletingTxn(txn)}
                          disabled={deletingId === txn.id}
                          style={{
                            flex: 1, fontSize: '12px', fontWeight: 600, padding: '8px 10px', borderRadius: '8px',
                            border: `1.5px solid ${theme.inputBorder}`, cursor: deletingId === txn.id ? 'default' : 'pointer',
                            background: 'transparent', color: '#F43F5E',
                            opacity: deletingId === txn.id ? 0.5 : 1,
                          }}
                      >
                        {deletingId === txn.id ? '...' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>
              ))}

              {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${theme.cardBorder}` }}>
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub, background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.3 : 1 }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: '12px', color: theme.textMuted }}>Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub, background: 'none', border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.3 : 1 }}
                    >
                      Next →
                    </button>
                  </div>
              )}
            </div>
        ) : (
        /* Desktop: table */
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
              <tr style={{ borderBottom: `1px solid ${theme.cardBorder}`, background: theme.tableHeaderBg }}>
                {['Date', 'Merchant', 'Category', 'Mode', 'Type', 'Amount', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '14px 20px' }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {isLoading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: theme.textMuted }}>Loading...</td></tr>
              ) : isError ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>
                      <p style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: theme.text, margin: 0 }}>We're having trouble loading your transactions</p>
                      <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px', marginBottom: '16px' }}>Please try again in a moment.</p>
                      <button
                          onClick={() => refetch()}
                          disabled={isFetching}
                          style={{
                            fontSize: '12px', fontWeight: 600, padding: '8px 18px', borderRadius: '10px',
                            border: 'none', cursor: isFetching ? 'default' : 'pointer',
                            background: theme.sidebarActive, color: 'white', opacity: isFetching ? 0.6 : 1,
                          }}
                      >
                        {isFetching ? 'Retrying...' : 'Try Again'}
                      </button>
                    </td>
                  </tr>
              ) : txns.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: theme.textMuted }}>No transactions found</td></tr>
              ) : txns.map((txn, i) => (
                  <tr
                      key={txn.id}
                      style={{
                        borderBottom: i < txns.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
                        background: i % 2 === 1 ? theme.tableRowAlt : 'transparent',
                      }}
                  >
                    <td style={{ padding: '14px 20px', color: theme.textSub, fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(txn.transactionTime)}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: theme.text }}>{txn.counterparty ?? '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      {editingId === txn.id ? (
                          <select
                              defaultValue={txn.category}
                              autoFocus
                              onChange={(e) => categoryMutation.mutate({ id: txn.id, category: e.target.value })}
                              onBlur={() => setEditingId(null)}
                              style={{ border: `1.5px solid ${theme.sidebarActive}`, borderRadius: '8px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: theme.card, color: theme.text }}
                          >
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                          </select>
                      ) : (
                          <button
                              onClick={() => setEditingId(txn.id)}
                              style={{
                                fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                                border: 'none', cursor: 'pointer',
                                background: `${CATEGORY_COLORS[txn.category] ?? '#CBD5E1'}22`,
                                color: CATEGORY_COLORS[txn.category] ?? theme.textSub,
                              }}
                              title="Click to change category"
                          >
                            {txn.category}
                          </button>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: theme.textSub }}>{txn.paymentMode}</td>
                    <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px',
                    background: txn.transactionType === 'DEBIT' ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                    color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981',
                  }}>
                    {txn.transactionType}
                  </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981' }}>
                      {txn.transactionType === 'DEBIT' ? '-' : '+'}{formatCurrency(txn.amount)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => setEditingTxn(txn)}
                            title="Edit transaction"
                            style={{
                              fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px',
                              border: `1.5px solid ${theme.inputBorder}`, cursor: 'pointer',
                              background: 'transparent', color: theme.textSub,
                            }}
                        >
                          ✎ Edit
                        </button>
                        <button
                            onClick={() => setDeletingTxn(txn)}
                            disabled={deletingId === txn.id}
                            title="Delete transaction"
                            style={{
                              fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px',
                              border: `1.5px solid ${theme.inputBorder}`, cursor: deletingId === txn.id ? 'default' : 'pointer',
                              background: 'transparent', color: '#F43F5E',
                              opacity: deletingId === txn.id ? 0.5 : 1,
                            }}
                        >
                          {deletingId === txn.id ? '...' : '🗑 Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${theme.cardBorder}` }}>
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub, background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.3 : 1 }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '12px', color: theme.textMuted }}>Page {page + 1} of {totalPages}</span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub, background: 'none', border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.3 : 1 }}
                >
                  Next →
                </button>
              </div>
          )}
        </div>
        )}

        {editingTxn && (
            <EditTransactionModal txn={editingTxn} onClose={() => setEditingTxn(null)} />
        )}

        {showLogModal && (
            <LogTransactionModal onClose={() => setShowLogModal(false)} />
        )}

        {deletingTxn && (
            <ConfirmDeleteModal
                txn={deletingTxn}
                isDeleting={deleteMutation.isPending}
                onCancel={() => setDeletingTxn(null)}
                onConfirm={() => deleteMutation.mutate(deletingTxn.id)}
            />
        )}
      </Layout>
  )
}