import { useTheme } from '../../context/ThemeContext'
import lockupLight from '../../assets/lockup-light.svg'
import lockupDark from '../../assets/lockup-dark.svg'

/**
 * LedgerMind brand mark — the official icon: an "L" (ledger rule) whose foot
 * lifts into an ascending trend line, ending in a node. Inlined so it stays
 * crisp at any size with no asset fetch.
 */
export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      className={className}
      role="img"
      aria-label="LedgerMind"
    >
      <defs>
        <linearGradient id="lm-mark-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="56" fill="#0B1220" />
      <path
        d="M 92 62 L 92 176 C 92 182 96 186 102 186 L 132 186 L 158 158 L 176 176 L 208 130"
        fill="none"
        stroke="url(#lm-mark-g)"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="208" cy="130" r="12" fill="url(#lm-mark-g)" />
    </svg>
  )
}

/**
 * Full lockup (icon + wordmark). `variant` picks the artwork:
 *   'auto'  — follows the active theme (default)
 *   'dark'  — light text, for dark surfaces (sidebar, login)
 *   'light' — dark text, for light surfaces
 * `height` is the rendered height in px; the SVG is 640×160 (4:1).
 */
export function Logo({ height = 30, variant = 'auto', className = '' }) {
  const { themeName } = useTheme() ?? {}
  const src =
    variant === 'dark' ? lockupDark
    : variant === 'light' ? lockupLight
    : themeName === 'light' ? lockupLight
    : lockupDark
  return (
    <img
      src={src}
      alt="LedgerMind"
      height={height}
      style={{ height, width: 'auto' }}
      className={className}
      draggable={false}
    />
  )
}
