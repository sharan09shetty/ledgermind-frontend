import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import { updateTransaction } from '../../api/endpoints'

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'ENTERTAINMENT', 'HEALTH', 'INVESTMENT', 'SALARY', 'TRANSFER', 'OTHER']
const MODES = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'CHEQUE', 'NEFT', 'IMPS', 'RTGS']

function Modal({ txn, onClose }) {
    const { theme } = useTheme()
    const queryClient = useQueryClient()
    const [form, setForm] = useState({
        counterparty: txn.counterparty ?? '',
        paymentMode: txn.paymentMode ?? '',
        category: txn.category ?? '',
    })

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

    const mutation = useMutation({
        mutationFn: () => updateTransaction(txn.id, {
            counterparty: form.counterparty.trim() || null,
            paymentMode: form.paymentMode || null,
            category: form.category || null,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['merchants'] })
            onClose()
        },
    })

    const inputStyle = {
        width: '100%', border: `1.5px solid ${theme.inputBorder}`, borderRadius: '12px',
        padding: '10px 12px', fontSize: '13px', color: theme.text,
        background: theme.card, outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle = { fontSize: '11px', fontWeight: 500, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Modal card */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                width: '360px',
                background: theme.card,
                borderRadius: '20px',
                border: `1px solid ${theme.cardBorder}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <div>
                        <p style={{ fontWeight: 600, color: theme.text, fontSize: '14px', margin: 0 }}>Edit Transaction</p>
                        <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>Update merchant, mode or category</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Merchant */}
                    <div>
                        <label style={labelStyle}>Merchant</label>
                        <input
                            placeholder="e.g. Amazon, Swiggy..."
                            value={form.counterparty}
                            onChange={(e) => set('counterparty', e.target.value)}
                            autoFocus
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = '#10B981'}
                            onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                        />
                    </div>

                    {/* Mode */}
                    <div>
                        <label style={labelStyle}>Payment Mode</label>
                        <select
                            value={form.paymentMode}
                            onChange={(e) => set('paymentMode', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">—</option>
                            {MODES.map((m) => <option key={m} value={m} style={{ background: theme.card }}>{m}</option>)}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label style={labelStyle}>Category</label>
                        <select
                            value={form.category}
                            onChange={(e) => set('category', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">—</option>
                            {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: theme.card }}>{c}</option>)}
                        </select>
                    </div>

                    {mutation.isError && (
                        <p style={{ fontSize: '12px', color: '#F43F5E', margin: 0 }}>Failed to save changes. Please try again.</p>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '11px', borderRadius: '12px', border: `1.5px solid ${theme.inputBorder}`,
                                fontSize: '13px', fontWeight: 600, color: theme.textSub, background: 'transparent', cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending}
                            style={{
                                flex: 2, padding: '11px', borderRadius: '12px', border: 'none',
                                fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer',
                                background: '#10B981',
                                opacity: mutation.isPending ? 0.6 : 1,
                                transition: 'opacity 0.15s',
                            }}
                        >
                            {mutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// Portal wrapper — renders outside Layout's DOM tree, fixing z-index issues
export default function EditTransactionModal({ txn, onClose }) {
    return createPortal(<Modal txn={txn} onClose={onClose} />, document.body)
}