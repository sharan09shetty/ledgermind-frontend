import Sidebar from './Sidebar'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function Layout({ children }) {
    const { theme } = useTheme()
    const isMobile = useIsMobile()

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : '224px',
                padding: isMobile ? '16px 16px 84px' : '32px',
                maxWidth: isMobile ? '100vw' : 'calc(100vw - 224px)',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
            }}>
                {children}
            </main>
        </div>
    )
}