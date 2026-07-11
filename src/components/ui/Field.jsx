import { ChevronDown } from 'lucide-react'

export function Label({ children, optional = false }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
      {optional && <span className="ml-1 font-normal normal-case tracking-normal">(optional)</span>}
    </label>
  )
}

const baseControl =
  'w-full rounded-xl border-[1.5px] border-border bg-input px-3 text-[13px] text-text outline-none transition-colors placeholder:text-muted focus:border-accent'

export function Input({ className = '', ...props }) {
  return <input className={`${baseControl} h-10 ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select className={`${baseControl} h-10 cursor-pointer appearance-none pr-9 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  )
}
