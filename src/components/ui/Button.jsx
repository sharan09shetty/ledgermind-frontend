import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-accent text-white border-transparent shadow-[0_2px_12px_var(--accent-glow)] hover:brightness-110',
  secondary:
    'bg-card text-sub border-border hover:bg-elev hover:text-text',
  ghost:
    'bg-transparent text-sub border-transparent hover:bg-elev hover:text-text',
  danger:
    'bg-danger text-white border-transparent shadow-[0_2px_12px_rgba(244,63,94,0.3)] hover:brightness-110',
  dangerOutline:
    'bg-transparent text-danger border-border hover:border-danger/40 hover:bg-danger/5',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-sm gap-2 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon: Icon,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer select-none items-center justify-center border font-semibold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {children}
    </button>
  )
}
