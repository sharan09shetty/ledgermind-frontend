import { createPortal } from 'react-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { formatCurrency, formatDate } from '../../utils/date'

function Modal({ txn, onConfirm, onCancel, isDeleting }) {
    const { theme } = useTheme()
    const isMobile = useIsMobile()

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                onClick={isDeleting ? undefined : onCancel}
            />

            {/* Modal card */}
            <div style={{
                position: 'fixed',
                top: isMobile ? 'auto' : '50%',
                bottom: isMobile ? 0 : 'auto',
                left: isMobile ? 0 : '50%',
                right: isMobile ? 0 : 'auto',
                transform: isMobile ? 'none' : 'translate(-50%, -50%)',
                zIndex: 9999,
                width: isMobile ? '100%' : '340px',
                background: theme.card,
                borderRadius: isMobile ? '20px 20px 0 0' : '20px',
                border: `1px solid ${theme.cardBorder}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}>
                <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244,63,94,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                        margin: '0 auto 14px',
                    }}>
                        🗑
                    </div>
                    <p style={{ fontWeight: 700, color: theme.text, fontSize: '15px', margin: 0 }}>Delete this transaction?</p>
                    <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px', lineHeight: 1.5 }}>
                        This action cannot be undone.
                    </p>

                    {/* Transaction summary */}
                    <div style={{
                        marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
                        background: theme.bg, border: `1px solid ${theme.cardBorder}`, textAlign: 'left',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
                                {txn.counterparty ?? 'Unknown merchant'}
                            </span>
                            <span style={{
                                fontSize: '13px', fontWeight: 700,
                                color: txn.transactionType === 'DEBIT' ? '#F43F5E' : '#10B981',
                            }}>
                                {txn.transactionType === 'DEBIT' ? '-' : '+'}{formatCurrency(txn.amount)}
                            </span>
                        </div>
                        <p style={{ fontSize: '11px', color: theme.textMuted, margin: '4px 0 0' }}>
                            {formatDate(txn.transactionTime)} · {txn.paymentMode}{txn.category ? ` · ${txn.category}` : ''}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '0 20px 20px' }}>
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        style={{
                            flex: 1, padding: '11px', borderRadius: '12px', border: `1.5px solid ${theme.inputBorder}`,
                            fontSize: '13px', fontWeight: 600, color: theme.textSub, background: 'transparent',
                            cursor: isDeleting ? 'default' : 'pointer', opacity: isDeleting ? 0.6 : 1,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        style={{
                            flex: 1, padding: '11px', borderRadius: '12px', border: 'none',
                            fontSize: '13px', fontWeight: 600, color: 'white', background: '#F43F5E',
                            cursor: isDeleting ? 'default' : 'pointer', opacity: isDeleting ? 0.6 : 1,
                            transition: 'opacity 0.15s',
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </>
    )
}

// Portal wrapper — renders outside Layout's DOM tree, fixing z-index issues
export default function ConfirmDeleteModal({ txn, onConfirm, onCancel, isDeleting }) {
    return createPortal(<Modal txn={txn} onConfirm={onConfirm} onCancel={onCancel} isDeleting={isDeleting} />, document.body)
}
