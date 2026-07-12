import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import GmailReconnectBanner from './GmailReconnectBanner'
import CommandPalette from './CommandPalette'
import AddToHomeScreen from './AddToHomeScreen'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useTheme, THEMES } from '../../context/ThemeContext'
import { getUserStatus } from '../../api/endpoints'

/**
 * Applies the theme saved on the user's account once per mount — this is what
 * makes the theme follow the user onto a new device / the installed PWA,
 * where localStorage starts empty.
 */
function useServerThemeSync() {
  const { setThemeName } = useTheme()
  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })
  const synced = useRef(false)

  useEffect(() => {
    if (synced.current || !status?.theme || !THEMES[status.theme]) return
    synced.current = true
    setThemeName(status.theme, { persist: false })
  }, [status, setThemeName])
}

export default function Layout({ children, mobileBare = false }) {
  const isMobile = useIsMobile()
  const bare = mobileBare && isMobile

  useServerThemeSync()

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar hideMobileTopBar={bare} />
      {bare ? (
        // Full-bleed pages (mobile chat) manage their own chrome/scrolling
        <main className="overflow-x-hidden">{children}</main>
      ) : (
        <main
          className={`overflow-x-hidden ${
            isMobile
              ? 'px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-4'
              : 'ml-60 px-8 py-8'
          }`}
        >
          <div className="animate-fade-in-up mx-auto w-full max-w-6xl">
            <GmailReconnectBanner />
            {children}
          </div>
        </main>
      )}
      {!isMobile && <CommandPalette />}
      {isMobile && <AddToHomeScreen />}
    </div>
  )
}
