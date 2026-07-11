import Sidebar from './Sidebar'
import GmailReconnectBanner from './GmailReconnectBanner'
import CommandPalette from './CommandPalette'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function Layout({ children }) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar />
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
      {!isMobile && <CommandPalette />}
    </div>
  )
}
