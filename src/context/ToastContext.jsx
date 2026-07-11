import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

const ICONS = {
  success: <CheckCircle2 size={17} className="text-success shrink-0" />,
  error: <AlertCircle size={17} className="text-danger shrink-0" />,
  info: <Info size={17} className="text-info shrink-0" />,
}

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((message, { type = 'success', duration = 3500 } = {}) => {
    const id = nextId++
    setToasts((t) => [...t.slice(-3), { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[10000] flex flex-col items-center gap-2 px-4 pointer-events-none md:inset-x-auto md:bottom-6 md:right-6 md:items-end"
        >
          {toasts.map(({ id, message, type }) => (
            <div
              key={id}
              className="animate-fade-in-up pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-border bg-card py-2.5 pl-3.5 pr-2 text-[13px] font-medium text-text shadow-pop"
            >
              {ICONS[type] ?? ICONS.info}
              <span className="min-w-0">{message}</span>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="ml-1 grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-muted transition-colors hover:bg-elev hover:text-text"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
