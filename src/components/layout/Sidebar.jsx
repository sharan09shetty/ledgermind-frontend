import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const links = [
    { to: '/', label: 'Dashboard', icon: '▦' },
    { to: '/transactions', label: 'Transactions', icon: '⇄' },
    { to: '/analytics', label: 'Analytics', icon: '∿' },
    { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
    const { theme } = useTheme()

    const handleLogout = () => {
        localStorage.removeItem('token')
        window.location.href = '/login'
    }

    return (
        <aside style={{
            position: 'fixed', left: 0, top: 0, height: '100vh', width: '224px',
            display: 'flex', flexDirection: 'column', background: theme.sidebar,
            borderRight: `1px solid rgba(255,255,255,0.05)`,
        }}>
            {/* Logo */}
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', color: theme.sidebarActive }}>◈</span>
                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '16px', letterSpacing: '-0.02em' }}>LedgerMind</span>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {links.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px',
                            fontSize: '13px', fontWeight: isActive ? 600 : 500,
                            textDecoration: 'none', transition: 'all 0.15s',
                            background: isActive ? theme.sidebarActiveBg : 'transparent',
                            color: isActive ? theme.sidebarActive : theme.sidebarText,
                        })}
                    >
                        <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{icon}</span>
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Sign out */}
            <div style={{ padding: '8px 8px 16px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px', border: 'none',
                        background: 'transparent', cursor: 'pointer', fontSize: '13px',
                        fontWeight: 500, color: theme.sidebarText, transition: 'color 0.15s',
                    }}
                >
                    <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>↑</span>
                    Sign out
                </button>
            </div>
        </aside>
    )
}