import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Pencil, Trash2, Plus, ChevronLeft, ChevronRight,
  SearchX, ReceiptText, X, Loader2, SlidersHorizontal,
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import DateRangePicker from '../components/ui/DateRangePicker'
import EditTransactionModal from '../components/ui/EditTransactionModal'
import LogTransactionModal from '../components/ui/LogTransactionModal'
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import SwipeableRow from '../components/ui/SwipeableRow'
import { Input, Select } from '../components/ui/Field'
import { SkeletonList, Skeleton } from '../components/ui/Skeleton'
import { useIsMobile } from '../hooks/useIsMobile'
import { useDebounce } from '../hooks/useDebounce'
import { useDateRange } from '../context/DateRangeContext'
import { useToast } from '../context/ToastContext'
import { getTransactions, updateCategory, deleteTransaction } from '../api/endpoints'
import { formatCurrency, formatDate } from '../utils/date'
import { CATEGORIES, TYPES, PAYMENT_MODES, categoryColor, categoryLabel, CategoryIcon, formatMode } from '../utils/categories'

function CategoryChip({ txn, editingId, onStartEdit, onChange, onBlur }) {
  if (editingId === txn.id) {
    return (
      <select
        defaultValue={txn.category}
        autoFocus
        onChange={onChange}
        onBlur={onBlur}
        className="cursor-pointer rounded-lg border-[1.5px] border-accent bg-card px-2 py-1 text-[11px] font-semibold text-text outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{categoryLabel(c)}</option>
        ))}
      </select>
    )
  }
  const color = categoryColor(txn.category)
  return (
    <button
      onClick={onStartEdit}
      title="Click to change category"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none px-2.5 py-1 text-[11px] font-semibold transition-transform hover:scale-105"
      style={{ background: `${color}1f`, color }}
    >
      <CategoryIcon category={txn.category} size={11} />
      {categoryLabel(txn.category)}
    </button>
  )
}

function TypePill({ type }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        type === 'DEBIT' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
      }`}
    >
      {type === 'DEBIT' ? 'Debit' : 'Credit'}
    </span>
  )
}

function ActionButtons({ onEdit, onDelete, deleting, size = 'md' }) {
  const dim = size === 'md' ? 'h-9 w-9' : 'h-10 w-10'
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        title="Edit transaction"
        aria-label="Edit transaction"
        className={`grid ${dim} cursor-pointer place-items-center rounded-xl border-none bg-transparent text-muted transition-colors hover:bg-elev hover:text-text`}
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        disabled={deleting}
        title="Delete transaction"
        aria-label="Delete transaction"
        className={`grid ${dim} cursor-pointer place-items-center rounded-xl border-none bg-transparent text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40`}
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
    </div>
  )
}

export default function Transactions() {
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const { from, to, label, mode } = useDateRange()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ category: '', transactionType: '', paymentMode: '', counterparty: '' })
  const [editingId, setEditingId] = useState(null)
  const [editingTxn, setEditingTxn] = useState(null)
  // Deep link from the command palette: /transactions?log=1
  const [showLogModal, setShowLogModal] = useState(() => searchParams.get('log') === '1')
  const [deletingId, setDeletingId] = useState(null)
  const [deletingTxn, setDeletingTxn] = useState(null)
  const [openSwipeId, setOpenSwipeId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  const debouncedSearch = useDebounce(filters.counterparty)

  // Clean the ?log=1 deep-link param out of the URL once consumed
  useEffect(() => {
    if (searchParams.get('log') === '1') {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['transactions', from, to, page, { ...filters, counterparty: debouncedSearch }],
    queryFn: () =>
      getTransactions({
        from, to, page, size: 20,
        ...(filters.category && { category: filters.category }),
        ...(filters.transactionType && { transactionType: filters.transactionType }),
        ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
        ...(debouncedSearch && { counterparty: debouncedSearch }),
      }),
    placeholderData: (prev) => prev,
  })

  const categoryMutation = useMutation({
    mutationFn: ({ id, category }) => updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-recent'] })
      setEditingId(null)
      toast('Category updated')
    },
    onError: () => toast("Couldn't update category", { type: 'error' }),
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
      toast('Transaction deleted')
    },
    onError: () => toast("Couldn't delete transaction", { type: 'error' }),
    onSettled: () => setDeletingId(null),
  })

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }))
    setPage(0)
  }

  const clearFilters = () => {
    setFilters({ category: '', transactionType: '', paymentMode: '', counterparty: '' })
    setPage(0)
  }

  const activeFilters = useMemo(
    () =>
      [
        filters.category && { key: 'category', label: categoryLabel(filters.category) },
        filters.transactionType && { key: 'transactionType', label: filters.transactionType === 'DEBIT' ? 'Debit' : 'Credit' },
        filters.paymentMode && { key: 'paymentMode', label: formatMode(filters.paymentMode) },
        debouncedSearch && { key: 'counterparty', label: `“${debouncedSearch}”` },
      ].filter(Boolean),
    [filters, debouncedSearch],
  )

  const txns = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const hasFilters = activeFilters.length > 0
  const selectFilterCount = [filters.category, filters.transactionType, filters.paymentMode].filter(Boolean).length

  const emptyState = hasFilters ? (
    <EmptyState
      icon={SearchX}
      title="No matching transactions"
      message="Nothing matches your current search and filters. Try widening them."
      action="Clear filters"
      onAction={clearFilters}
    />
  ) : (
    <EmptyState
      icon={ReceiptText}
      title={`No transactions in ${mode === 'last30' ? 'the last 30 days' : label}`}
      message="Transactions from your bank alerts will appear here automatically — or log cash and UPI spends yourself."
      action="Log a transaction"
      actionIcon={Plus}
      onAction={() => setShowLogModal(true)}
    />
  )

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
      <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
        <ChevronLeft size={14} /> Prev
      </Button>
      <span className="tnum text-xs text-muted">
        Page {page + 1} of {totalPages}
        {isFetching && <Loader2 size={11} className="ml-1.5 inline animate-spin" />}
      </span>
      <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
        Next <ChevronRight size={14} />
      </Button>
    </div>
  )

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-extrabold tracking-tight text-text md:text-[28px]">Transactions</h1>
            <p className="m-0 mt-1 text-[13px] text-muted">
              {isError ? '—' : isLoading ? <Skeleton as="span" className="inline-block h-3 w-24 align-middle" /> : `${data?.totalElements ?? 0} transactions · ${mode === 'last30' ? 'last 30 days' : label}`}
            </p>
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
          {!isMobile && <Button icon={Plus} onClick={() => setShowLogModal(true)}>Log</Button>}
        </div>
      </div>

      {/* Filters — on mobile the selects collapse behind a filter toggle so
          the list starts high on the page */}
      <div className="mb-3 rounded-2xl border border-border bg-card p-2.5 shadow-card lg:p-3.5">
        <div className="flex items-center gap-2 lg:grid lg:grid-cols-4 lg:gap-2.5">
          <div className="relative min-w-0 flex-1 lg:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search merchant…"
              value={filters.counterparty}
              onChange={(e) => setFilter('counterparty', e.target.value)}
              className="!h-9 !pl-9 lg:!h-10"
            />
          </div>
          {isMobile ? (
            <button
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              aria-label="Toggle filters"
              className={`relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border-[1.5px] transition-colors ${
                showFilters || selectFilterCount > 0
                  ? 'border-accent bg-accent-soft text-accent-strong'
                  : 'border-border bg-transparent text-muted'
              }`}
            >
              <SlidersHorizontal size={15} />
              {selectFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-white">
                  {selectFilterCount}
                </span>
              )}
            </button>
          ) : (
            <>
              <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </Select>
              <Select value={filters.transactionType} onChange={(e) => setFilter('transactionType', e.target.value)}>
                <option value="">All types</option>
                {TYPES.map((t) => <option key={t} value={t}>{t === 'DEBIT' ? 'Debit' : 'Credit'}</option>)}
              </Select>
              <Select value={filters.paymentMode} onChange={(e) => setFilter('paymentMode', e.target.value)}>
                <option value="">All modes</option>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{formatMode(m)}</option>)}
              </Select>
            </>
          )}
        </div>

        {isMobile && showFilters && (
          <div className="animate-fade-in mt-2 grid grid-cols-3 gap-1.5">
            <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className="!h-9 !px-2 !pr-6 !text-xs">
              <option value="">Category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </Select>
            <Select value={filters.transactionType} onChange={(e) => setFilter('transactionType', e.target.value)} className="!h-9 !px-2 !pr-6 !text-xs">
              <option value="">Type</option>
              {TYPES.map((t) => <option key={t} value={t}>{t === 'DEBIT' ? 'Debit' : 'Credit'}</option>)}
            </Select>
            <Select value={filters.paymentMode} onChange={(e) => setFilter('paymentMode', e.target.value)} className="!h-9 !px-2 !pr-6 !text-xs">
              <option value="">Mode</option>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{formatMode(m)}</option>)}
            </Select>
          </div>
        )}

        {hasFilters && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {activeFilters.map(({ key, label: l }) => (
              <button
                key={key}
                onClick={() => setFilter(key, '')}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border-none bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-strong transition-transform hover:scale-105"
              >
                {l} <X size={11} />
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="cursor-pointer border-none bg-transparent px-1.5 text-[11px] font-semibold text-muted hover:text-text"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List / table */}
      {isMobile ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {isLoading ? (
            <SkeletonList rows={6} />
          ) : isError ? (
            <ErrorState title="We're having trouble loading your transactions" onRetry={refetch} isRetrying={isFetching} minHeight={260} />
          ) : txns.length === 0 ? (
            emptyState
          ) : (
            txns.map((txn, i) => (
              <SwipeableRow
                key={txn.id}
                open={openSwipeId === txn.id}
                onOpenChange={(open) => setOpenSwipeId(open ? txn.id : null)}
                onEdit={() => setEditingTxn(txn)}
                onDelete={() => {
                  setOpenSwipeId(null)
                  setDeletingTxn(txn)
                }}
                deleting={deletingId === txn.id}
              >
                <div className={`px-4 py-3.5 ${i < txns.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{ background: `${categoryColor(txn.category)}1f`, color: categoryColor(txn.category) }}
                      >
                        <CategoryIcon category={txn.category} size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-text">{txn.counterparty ?? '—'}</p>
                        <p className="m-0 mt-0.5 text-[11px] text-muted">{formatDate(txn.transactionTime)}</p>
                      </div>
                    </div>
                    <p className={`tnum m-0 shrink-0 text-[15px] font-bold ${txn.transactionType === 'DEBIT' ? 'text-danger' : 'text-success'}`}>
                      {txn.transactionType === 'DEBIT' ? '−' : '+'}{formatCurrency(txn.amount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryChip
                      txn={txn}
                      editingId={editingId}
                      onStartEdit={() => setEditingId(txn.id)}
                      onChange={(e) => categoryMutation.mutate({ id: txn.id, category: e.target.value })}
                      onBlur={() => setEditingId(null)}
                    />
                    <TypePill type={txn.transactionType} />
                    <span className="rounded-full bg-elev px-2.5 py-1 text-[11px] font-medium text-sub">
                      {formatMode(txn.paymentMode)}
                    </span>
                  </div>
                </div>
              </SwipeableRow>
            ))
          )}
          {!isLoading && !isError && pagination}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Merchant', 'Category', 'Mode', 'Type', 'Amount', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-0"><SkeletonList rows={8} /></td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="p-6">
                      <ErrorState title="We're having trouble loading your transactions" onRetry={refetch} isRetrying={isFetching} minHeight={220} />
                    </td>
                  </tr>
                ) : txns.length === 0 ? (
                  <tr><td colSpan={7}>{emptyState}</td></tr>
                ) : (
                  txns.map((txn, i) => (
                    <tr
                      key={txn.id}
                      className={`group transition-colors hover:bg-elev ${i < txns.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <td className="tnum whitespace-nowrap px-5 py-3 text-xs text-sub">{formatDate(txn.transactionTime)}</td>
                      <td className="max-w-[220px] truncate px-5 py-3 font-semibold text-text">{txn.counterparty ?? '—'}</td>
                      <td className="px-5 py-3">
                        <CategoryChip
                          txn={txn}
                          editingId={editingId}
                          onStartEdit={() => setEditingId(txn.id)}
                          onChange={(e) => categoryMutation.mutate({ id: txn.id, category: e.target.value })}
                          onBlur={() => setEditingId(null)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-sub">{formatMode(txn.paymentMode)}</td>
                      <td className="px-5 py-3"><TypePill type={txn.transactionType} /></td>
                      <td className={`tnum whitespace-nowrap px-5 py-3 text-right font-bold ${txn.transactionType === 'DEBIT' ? 'text-danger' : 'text-success'}`}>
                        {txn.transactionType === 'DEBIT' ? '−' : '+'}{formatCurrency(txn.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                          <ActionButtons
                            txn={txn}
                            deleting={deletingId === txn.id}
                            onEdit={() => setEditingTxn(txn)}
                            onDelete={() => setDeletingTxn(txn)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && !isError && pagination}
        </div>
      )}

      {editingTxn && <EditTransactionModal txn={editingTxn} onClose={() => setEditingTxn(null)} />}
      {showLogModal && <LogTransactionModal onClose={() => setShowLogModal(false)} />}
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
