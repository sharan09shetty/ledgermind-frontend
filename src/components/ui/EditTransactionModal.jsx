import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTransaction } from '../../api/endpoints'
import { CATEGORIES, PAYMENT_MODES, categoryLabel, formatMode } from '../../utils/categories'
import { useToast } from '../../context/ToastContext'
import Modal from './Modal'
import Button from './Button'
import { Label, Input, Select } from './Field'

export default function EditTransactionModal({ txn, onClose }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState({
    counterparty: txn.counterparty ?? '',
    paymentMode: txn.paymentMode ?? '',
    category: txn.category ?? '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const mutation = useMutation({
    mutationFn: () =>
      updateTransaction(txn.id, {
        counterparty: form.counterparty.trim() || null,
        paymentMode: form.paymentMode || null,
        category: form.category || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-recent'] })
      toast('Transaction updated')
      onClose()
    },
  })

  return (
    <Modal title="Edit transaction" subtitle="Update merchant, mode or category" onClose={onClose}>
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
      >
        <div>
          <Label>Merchant</Label>
          <Input
            placeholder="e.g. Amazon, Swiggy…"
            value={form.counterparty}
            onChange={(e) => set('counterparty', e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <Label>Payment mode</Label>
          <Select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)}>
            <option value="">—</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>{formatMode(m)}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </Select>
        </div>

        {mutation.isError && (
          <p className="m-0 text-xs font-medium text-danger">Failed to save changes. Please try again.</p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[2]" loading={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
