import Button from './Button'

/**
 * Friendly empty state with a soft icon tile, message and optional CTA.
 * Pass a lucide icon component via `icon`.
 */
export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  actionIcon,
  onAction,
  secondaryAction,
  onSecondaryAction,
  compact = false,
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-10' : 'py-16'}`}>
      {Icon && (
        <div className="animate-pop mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
          <Icon size={26} strokeWidth={1.8} />
        </div>
      )}
      <p className="m-0 text-[15px] font-bold text-text">{title}</p>
      {message && <p className="m-0 mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">{message}</p>}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action && (
            <Button onClick={onAction} icon={actionIcon} size="md">
              {action}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={onSecondaryAction} variant="secondary" size="md">
              {secondaryAction}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
