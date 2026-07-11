import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react'
import api from '../../api/axios'
import { CATEGORIES, PAYMENT_MODES, categoryLabel, formatMode } from '../../utils/categories'
import { useToast } from '../../context/ToastContext'
import Modal from './Modal'
import Button from './Button'
import { Label, Input, Select } from './Field'

const logTransaction = (payload) =>
  api.post('/transactions/manual', payload).then((r) => r.data)

export default function LogTransactionModal({ onClose }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState({
    amount: '',
    type: 'DEBIT',
    category: 'FOOD',
    counterparty: '',
    paymentMode: 'UPI',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  })
  const [success, setSuccess] = useState(false)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const mutation = useMutation({
    mutationFn: () =>
      logTransaction({
        amount: parseFloat(form.amount),
        transactionType: form.type,
        category: form.category,
        counterparty: form.counterparty || null,
        paymentMode: form.paymentMode,
        transactionTime: form.date,
      }),
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-txns'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-recent'] })
      toast('Transaction logged')
      setTimeout(onClose, 1100)
    },
  })

  const canSubmit = form.amount && parseFloat(form.amount) > 0

  return (
    <Modal title="Log transaction" subtitle="UPI, cash, card, cheque & more" onClose={onClose}>
      {success ? (
        <div className="px-5 py-12 text-center">
          <div className="animate-pop mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
            <Check size={26} strokeWidth={3} />
          </div>
          <p className="m-0 text-sm font-bold text-success">Transaction logged!</p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) mutation.mutate()
          }}
        >
          <div>
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              autoFocus
              className="tnum !h-12 text-lg font-bold"
            />
          </div>

          <div>
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-elev p-1">
              {[
                { t: 'DEBIT', label: 'Debit', icon: ArrowUpRight, color: 'bg-danger' },
                { t: 'CREDIT', label: 'Credit', icon: ArrowDownLeft, color: 'bg-success' },
              ].map(({ t, label, icon: Icon, color }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type', t)}
                  className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none text-xs font-semibold transition-all ${
                    form.type === t ? `${color} text-white shadow-pop` : 'bg-transparent text-sub'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payment mode</Label>
              <Select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{formatMode(m)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Date & time</Label>
            <Input
              type="datetime-local"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>

          <div>
            <Label optional>Merchant / description</Label>
            <Input
              placeholder="e.g. Auto, Darshini…"
              value={form.counterparty}
              onChange={(e) => set('counterparty', e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="m-0 text-xs font-medium text-danger">Failed to log. Please try again.</p>
          )}

          <Button
            type="submit"
            variant={form.type === 'DEBIT' ? 'danger' : 'primary'}
            disabled={!canSubmit}
            loading={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? 'Logging…' : `Log ${form.type === 'DEBIT' ? 'debit' : 'credit'}`}
          </Button>
        </form>
      )}
    </Modal>
  )
}
