import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUserTheme } from '../api/endpoints'

/**
 * Visual styling lives in CSS variables (see index.css) keyed off
 * <html data-theme="...">. This context only tracks which theme is active,
 * plus the raw color values that non-CSS consumers (Recharts, meta tags,
 * theme previews) need.
 */
export const THEMES = {
  light: {
    name: 'Light',
    tagline: 'Clean & bright',
    meta: '#F6F8FB',
    accent: '#10B981',
    chart: {
      grid: '#E2E8F0',
      tick: '#94A3B8',
      text: '#0F172A',
      sub: '#475569',
      tooltipBg: '#FFFFFF',
      tooltipBorder: '#E2E8F0',
    },
    preview: { bg: '#F6F8FB', card: '#FFFFFF', sidebar: '#0F172A', accent: '#10B981', line: '#CBD5E1' },
  },
  dark: {
    name: 'Dark',
    tagline: 'Easy on the eyes',
    meta: '#0F172A',
    accent: '#34D399',
    chart: {
      grid: '#2C3B52',
      tick: '#64748B',
      text: '#F1F5F9',
      sub: '#94A3B8',
      tooltipBg: '#1E293B',
      tooltipBorder: '#334155',
    },
    preview: { bg: '#0F172A', card: '#1E293B', sidebar: '#020617', accent: '#34D399', line: '#475569' },
  },
  midnight: {
    name: 'Midnight',
    tagline: 'Pure black, violet glow',
    meta: '#09090B',
    accent: '#A78BFA',
    chart: {
      grid: '#232327',
      tick: '#71717A',
      text: '#FAFAFA',
      sub: '#A1A1AA',
      tooltipBg: '#18181B',
      tooltipBorder: '#27272A',
    },
    preview: { bg: '#09090B', card: '#18181B', sidebar: '#000000', accent: '#A78BFA', line: '#3F3F46' },
  },
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(() => {
    const saved = localStorage.getItem('lm-theme')
    return THEMES[saved] ? saved : 'light'
  })

  const queryClient = useQueryClient()

  // User-initiated theme change: apply locally and save to the account so it
  // follows them to other devices / the installed PWA. `persist: false` is
  // for applying the server's stored theme without echoing it back.
  const setThemeName = useCallback((name, { persist = true } = {}) => {
    if (!THEMES[name]) return
    setThemeNameState(name)
    if (persist && localStorage.getItem('token')) {
      setUserTheme(name)
        // Keep the cached /users/status in step, or navigating (which re-runs
        // the server-theme sync against the stale cache) would revert the pick
        .then((data) => queryClient.setQueryData(['status'], data))
        .catch(() => {}) // best-effort; local apply already done
    }
  }, [queryClient])

  const theme = THEMES[themeName] ?? THEMES.light

  useEffect(() => {
    localStorage.setItem('lm-theme', themeName)
    document.documentElement.setAttribute('data-theme', themeName)

    // Keep the browser/PWA chrome in sync with the app background
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = theme.meta
  }, [themeName, theme])

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
