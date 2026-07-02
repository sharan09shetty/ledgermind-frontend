import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { format } from 'date-fns'

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'ENTERTAINMENT', 'HEALTH', 'INVESTMENT', 'SALARY', 'TRANSFER', 'OTHER']
const PAYMENT_MODES = ['UPI', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'CHEQUE', 'NEFT', 'IMPS', 'RTGS']

const logTransaction = async ({ amount, type, category, counterparty, paymentMode, transactionTime }) => {
  const token = localStorage.getItem('token')
  const res = await fetch('/api/transactions/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      amount: parseFloat(amount),
      transactionType: type,
      category,
      counterparty: counterparty || null,
      paymentMode,
      transactionTime,
    }),
  })
  if (!res.ok) throw new Error('Failed to log')
  return res.json()
}

function Modal({ onClose }) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
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
    mutationFn: () => logTransaction({
      amount: form.amount,
      type: form.type,
      category: form.category,
      counterparty: form.counterparty,
      paymentMode: form.paymentMode,
      transactionTime: form.date,
    }),
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-txns'] })
      setTimeout(onClose, 1300)
    },
  })

  const canSubmit = form.amount && parseFloat(form.amount) > 0
  const label = { fontSize: '11px', fontWeight: 500, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const input = { width: '100%', border: `1.5px solid ${theme.inputBorder}`, borderRadius: '12px', padding: '10px 12px', fontSize: '13px', color: theme.text, background: theme.inputBg, outline: 'none', boxSizing: 'border-box' }

  return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

        <div style={{
          position: 'fixed',
          bottom: isMobile ? 0 : '24px',
          right: isMobile ? 0 : '24px',
          left: isMobile ? 0 : 'auto',
          zIndex: 9999,
          width: isMobile ? '100%' : '340px',
          background: theme.card,
          borderRadius: isMobile ? '20px 20px 0 0' : '20px',
          border: `1px solid ${theme.cardBorder}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, position: 'sticky', top: 0, background: theme.card, zIndex: 1 }}>
            <div>
              <p style={{ fontWeight: 600, color: theme.text, fontSize: '14px', margin: 0 }}>Log Transaction</p>
              <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>UPI, cash, card, cheque & more</p>
            </div>
            <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>

          {success ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                <p style={{ color: '#10B981', fontWeight: 600, fontSize: '14px', margin: 0 }}>Transaction logged!</p>
              </div>
          ) : (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Amount */}
                <div>
                  <label style={label}>Amount (₹)</label>
                  <input type="number" placeholder="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} autoFocus
                         style={{ ...input, fontSize: '17px', fontWeight: 700 }} />
                </div>

                {/* Type toggle */}
                <div>
                  <label style={label}>Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '4px', background: theme.bg, borderRadius: '14px' }}>
                    {[['DEBIT', '↑ Debit', '#F43F5E'], ['CREDIT', '↓ Credit', '#10B981']].map(([t, lbl, color]) => (
                        <button key={t} onClick={() => set('type', t)} style={{
                          padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          background: form.type === t ? color : 'transparent', color: form.type === t ? 'white' : theme.textSub,
                          boxShadow: form.type === t ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        }}>{lbl}</button>
                    ))}
                  </div>
                </div>

                {/* Payment mode */}
                <div>
                  <label style={label}>Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)} style={input}>
                    {PAYMENT_MODES.map((m) => <option key={m} style={{ background: theme.card }}>{m}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={label}>Category</label>
                  <select value={form.category} onChange={(e) => set('category', e.target.value)} style={input}>
                    {CATEGORIES.map((c) => <option key={c} style={{ background: theme.card }}>{c}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label style={label}>Date & Time</label>
                  <input type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} style={input} />
                </div>

                {/* Merchant */}
                <div>
                  <label style={label}>Merchant / Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input placeholder="e.g. Auto, Darshini..." value={form.counterparty} onChange={(e) => set('counterparty', e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && canSubmit && mutation.mutate()} style={input} />
                </div>

                {mutation.isError && <p style={{ fontSize: '12px', color: '#F43F5E', margin: 0 }}>Failed to log. Please try again.</p>}

                <button
                    onClick={() => mutation.mutate()}
                    disabled={!canSubmit || mutation.isPending}
                    style={{
                      width: '100%', padding: '11px', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: 600, color: 'white',
                      cursor: canSubmit ? 'pointer' : 'not-allowed', background: form.type === 'DEBIT' ? '#F43F5E' : '#10B981',
                      opacity: !canSubmit || mutation.isPending ? 0.45 : 1,
                    }}
                >
                  {mutation.isPending ? 'Logging...' : `Log ${form.type === 'DEBIT' ? 'Debit' : 'Credit'}`}
                </button>
              </div>
          )}
        </div>
      </>
  )
}

export default function LogTransactionModal({ onClose }) {
  return createPortal(<Modal onClose={onClose} />, document.body)
}
