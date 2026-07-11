import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { DateRangeProvider } from './context/DateRangeContext'
import { getUserStatus } from './api/endpoints'
import { LogoMark } from './components/brand/Logo'
import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function SplashScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="animate-pop">
        <LogoMark size={56} />
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

/**
 * First-time users are walked through onboarding before seeing the app.
 * Preserves query params on redirect so the Gmail consent round-trip
 * (which lands on /settings?gmail=…) resumes onboarding cleanly.
 */
function OnboardingGate({ children }) {
  const location = useLocation()
  const { data: status, isLoading, isError } = useQuery({ queryKey: ['status'], queryFn: getUserStatus })

  if (isLoading) return <SplashScreen />
  // If the status check itself fails, let pages render their own error states
  if (!isError && status && !status.onboarded) {
    return <Navigate to={`/onboarding${location.search}`} replace />
  }
  return children
}

const guarded = (page) => (
  <ProtectedRoute>
    <OnboardingGate>{page}</OnboardingGate>
  </ProtectedRoute>
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <DateRangeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<Callback />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/" element={guarded(<Dashboard />)} />
                <Route path="/transactions" element={guarded(<Transactions />)} />
                <Route path="/analytics" element={guarded(<Analytics />)} />
                <Route path="/settings" element={guarded(<Settings />)} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DateRangeProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
