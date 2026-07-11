import { CloudOff } from 'lucide-react'
import Button from './Button'

export default function ErrorState({
  title = "We're having trouble loading this page",
  message = 'Check your connection and try again in a moment.',
  onRetry,
  isRetrying = false,
  minHeight = 320,
}) {
  return (
    <div
      className="animate-fade-in flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-card"
      style={{ minHeight }}
    >
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
        <CloudOff size={26} strokeWidth={1.8} />
      </div>
      <p className="m-0 text-[15px] font-bold text-text">{title}</p>
      <p className="m-0 mt-1.5 max-w-xs text-[13px] text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-5" loading={isRetrying} onClick={onRetry}>
          {isRetrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </div>
  )
}
