import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * Base modal: centered dialog on desktop, bottom sheet on mobile.
 * Handles backdrop, Escape, scroll-lock and enter animations.
 */
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 'max-w-sm',
  dismissible = true,
  hideHeader = false,
}) {
  const isMobile = useIsMobile()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && dismissible && onClose?.()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, dismissible])

  return createPortal(
    <div className="fixed inset-0 z-[9990]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="animate-fade-in absolute inset-0 bg-black/45 backdrop-blur-[3px]"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        className={
          isMobile
            ? 'animate-slide-up absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-modal'
            : `animate-scale-in absolute left-1/2 top-1/2 w-full ${width} max-h-[86vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card shadow-modal`
        }
      >
        {isMobile && <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-border-strong" />}
        {!hideHeader && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4">
            <div className="min-w-0">
              <p className="m-0 text-sm font-bold text-text">{title}</p>
              {subtitle && <p className="m-0 mt-0.5 text-xs text-muted">{subtitle}</p>}
            </div>
            {dismissible && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-muted transition-colors hover:bg-elev hover:text-text"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
