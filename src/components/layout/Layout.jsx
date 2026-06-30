import Sidebar from './Sidebar'
import { useTheme } from '../../context/ThemeContext'

export default function Layout({ children }) {
    const { theme } = useTheme()

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: '224px', padding: '32px', maxWidth: 'calc(100vw - 224px)' }}>
                {children}
            </main>
        </div>
    )
}