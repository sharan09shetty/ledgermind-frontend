import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const THEMES = {
    light: {
        name: 'Light',
        icon: '☀',
        sidebar: '#0F172A',
        sidebarText: '#94A3B8',
        sidebarActive: '#10B981',
        sidebarActiveBg: 'rgba(16,185,129,0.15)',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        cardBorder: '#E2E8F0',
        cardHover: '#F8FAFC',
        text: '#0F172A',
        textSub: '#64748B',
        textMuted: '#94A3B8',
        inputBg: '#FFFFFF',
        inputBorder: '#E2E8F0',
        tableRowAlt: '#F8FAFC',
        tableHeaderBg: '#FFFFFF',
        shadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    dark: {
        name: 'Dark',
        icon: '🌙',
        sidebar: '#020617',
        sidebarText: '#94A3B8',
        sidebarActive: '#34D399',
        sidebarActiveBg: 'rgba(52,211,153,0.15)',
        bg: '#0F172A',
        card: '#1E293B',
        cardBorder: '#334155',
        cardHover: '#273449',
        text: '#F1F5F9',
        textSub: '#94A3B8',
        textMuted: '#64748B',
        inputBg: '#0F172A',
        inputBorder: '#334155',
        tableRowAlt: '#19283F',
        tableHeaderBg: '#1E293B',
        shadow: '0 1px 4px rgba(0,0,0,0.4)',
    },
    midnight: {
        name: 'Midnight',
        icon: '✦',
        sidebar: '#000000',
        sidebarText: '#71717A',
        sidebarActive: '#A78BFA',
        sidebarActiveBg: 'rgba(167,139,250,0.15)',
        bg: '#09090B',
        card: '#18181B',
        cardBorder: '#27272A',
        cardHover: '#1F1F23',
        text: '#FAFAFA',
        textSub: '#A1A1AA',
        textMuted: '#71717A',
        inputBg: '#09090B',
        inputBorder: '#27272A',
        tableRowAlt: '#141417',
        tableHeaderBg: '#18181B',
        shadow: '0 1px 4px rgba(0,0,0,0.5)',
    },
}

export function ThemeProvider({ children }) {
    const [themeName, setThemeName] = useState(() =>
        localStorage.getItem('lm-theme') || 'light'
    )

    const theme = THEMES[themeName] || THEMES.light

    useEffect(() => {
        localStorage.setItem('lm-theme', themeName)
        document.body.style.background = theme.bg
        document.body.style.color = theme.text
        document.body.style.transition = 'background 0.2s ease'
    }, [themeName, theme])

    return (
        <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)