import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'ENTERTAINMENT', 'HEALTH', 'INVESTMENT', 'SALARY', 'TRANSFER', 'OTHER']

const logCashDirect = async ({ amount, type, category, counterparty }) => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/transactions/cash/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            amount: parseFloat(amount),
            transactionType: type,
            category,
            counterparty: counterparty || null,
        }),
    })
    if (!res.ok) throw new Error('Failed to log')
    return res.json()
}

function Modal({ onClose }) {
    const { theme } = useTheme()
    const queryClient = useQueryClient()
    const [form, setForm] = useState({ amount: '', type: 'DEBIT', category: 'FOOD', counterparty: '' })
    const [success, setSuccess] = useState(false)

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

    const mutation = useMutation({
        mutationFn: logCashDirect,
        onSuccess: () => {
            setSuccess(true)
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['analytics-txns'] })
            setTimeout(onClose, 1400)
        },
    })

    const canSubmit = form.amount && parseFloat(form.amount) > 0

    return (
        <>
            {/* Backdrop — rendered at document root via portal */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Modal card */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                width: '320px',
                background: theme.card,
                borderRadius: '20px',
                border: `1px solid ${theme.cardBorder}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <div>
                        <p style={{ fontWeight: 600, color: theme.text, fontSize: '14px', margin: 0 }}>Log Cash Transaction</p>
                        <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>Record a manual payment</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
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
                            <label style={{ fontSize: '11px', fontWeight: 500, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={form.amount}
                                onChange={(e) => set('amount', e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%', border: `1.5px solid ${theme.inputBorder}`, borderRadius: '12px',
                                    padding: '10px 12px', fontSize: '16px', fontWeight: 700, color: theme.text,
                                    background: theme.card, outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10B981'}
                                onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                            />
                        </div>

                        {/* Type toggle */}
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 500, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '4px', background: theme.bg, borderRadius: '14px' }}>
                                {[['DEBIT', '↑ Debit', '#F43F5E'], ['CREDIT', '↓ Credit', '#10B981']].map(([t, label, color]) => (
                                    <button
                                        key={t}
                                        onClick={() => set('type', t)}
                                        style={{
                                            padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                                            background: form.type === t ? color : 'transparent',
                                            color: form.type === t ? 'white' : theme.textSub,
                                            boxShadow: form.type === t ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 500, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => set('category', e.target.value)}
                                style={{ width: '100%', border: `1.5px solid ${theme.inputBorder}`, borderRadius: '12px', padding: '10px 12px', fontSize: '13px', color: theme.text, background: theme.card, outline: 'none', boxSizing: 'border-box' }}
                            >
                                {CATEGORIES.map((c) => <option key={c} style={{ background: theme.card }}>{c}</option>)}
                            </select>
                        </div>

                        {/* Merchant */}
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 500, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Merchant <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                            <input
                                placeholder="e.g. Auto, Darshini..."
                                value={form.counterparty}
                                onChange={(e) => set('counterparty', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && canSubmit && mutation.mutate(form)}
                                style={{ width: '100%', border: `1.5px solid ${theme.inputBorder}`, borderRadius: '12px', padding: '10px 12px', fontSize: '13px', color: theme.text, background: theme.card, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={(e) => e.target.style.borderColor = '#10B981'}
                                onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                            />
                        </div>

                        {mutation.isError && (
                            <p style={{ fontSize: '12px', color: '#F43F5E', margin: 0 }}>Failed to log. Please try again.</p>
                        )}

                        <button
                            onClick={() => mutation.mutate(form)}
                            disabled={!canSubmit || mutation.isPending}
                            style={{
                                width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
                                fontSize: '13px', fontWeight: 600, color: 'white', cursor: canSubmit ? 'pointer' : 'not-allowed',
                                background: form.type === 'DEBIT' ? '#F43F5E' : '#10B981',
                                opacity: !canSubmit || mutation.isPending ? 0.45 : 1,
                                transition: 'opacity 0.15s',
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

// Portal wrapper — renders outside Layout's DOM tree, fixing z-index issues
export default function CashLogModal({ onClose }) {
    return createPortal(<Modal onClose={onClose} />, document.body)
}