import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  icon: Icon = AlertTriangle,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmingLabel,
  isConfirming = false,
  danger = true,
  children,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal onClose={onCancel} dismissible={!isConfirming} hideHeader width="max-w-[360px]">
      <div className="px-5 pb-5 pt-6 text-center">
        <div
          className={`animate-pop mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-full ${
            danger ? 'bg-danger/10 text-danger' : 'bg-accent-soft text-accent-strong'
          }`}
        >
          <Icon size={22} />
        </div>
        <p className="m-0 text-[15px] font-bold text-text">{title}</p>
        {message && <p className="m-0 mt-1.5 text-xs leading-relaxed text-muted">{message}</p>}
        {children}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" disabled={isConfirming} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            className="flex-1"
            loading={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? (confirmingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
