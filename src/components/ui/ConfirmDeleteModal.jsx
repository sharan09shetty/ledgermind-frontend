import { Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/date'
import { formatMode, categoryLabel } from '../../utils/categories'
import ConfirmDialog from './ConfirmDialog'

export default function ConfirmDeleteModal({ txn, onConfirm, onCancel, isDeleting }) {
  return (
    <ConfirmDialog
      icon={Trash2}
      title="Delete this transaction?"
      message="This action cannot be undone."
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      isConfirming={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className="mt-4 rounded-xl border border-border bg-elev px-3.5 py-3 text-left">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[13px] font-semibold text-text">
            {txn.counterparty ?? 'Unknown merchant'}
          </span>
          <span
            className={`tnum shrink-0 text-[13px] font-bold ${
              txn.transactionType === 'DEBIT' ? 'text-danger' : 'text-success'
            }`}
          >
            {txn.transactionType === 'DEBIT' ? '−' : '+'}
            {formatCurrency(txn.amount)}
          </span>
        </div>
        <p className="m-0 mt-1 text-[11px] text-muted">
          {formatDate(txn.transactionTime)} · {formatMode(txn.paymentMode)}
          {txn.category ? ` · ${categoryLabel(txn.category)}` : ''}
        </p>
      </div>
    </ConfirmDialog>
  )
}
