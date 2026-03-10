// ADD THIS: Router shell for dashboard and history pages
import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useOutletContext } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { History } from '@/pages/History'
import { HistorySnapshot } from '@/pages/HistorySnapshot'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Loans } from '@/pages/Loans'
import { Notes } from '@/pages/Notes'
import { SubscriptionsDash } from '@/pages/SubscriptionsDash'
import { VacationDash } from '@/pages/VacationDash'
import { userApi } from '@/services/userApi'
import { Wishlist } from '@/pages/Wishlist'
import { Flow } from '@/pages/flow'
import { CurrentUserProvider } from '@/context/CurrentUserContext'

const shouldBypassLoginOnLocalhost = (): boolean => {
  // ADD THIS: always require login on localhost to prevent unauthorized API calls
  return false
}

type SessionUser = {
  id: string
  email: string
  displayName: string
  monthlyIncome: number
  createdAt: string
  isBootstrapAdmin?: boolean
}

type ProtectedRouteContext = {
  currentUser: SessionUser
}

const WithCurrentUser = () => {
  const { currentUser } = useOutletContext<ProtectedRouteContext>()

  return (
    <CurrentUserProvider currentUser={currentUser}>
      <Outlet />
    </CurrentUserProvider>
  )
}

// ADD THIS: Protected route guard based on backend session cookie validation
const RequireFrontendLogin = () => {
  const shouldBypassLogin = shouldBypassLoginOnLocalhost()

  const [isCheckingSession, setIsCheckingSession] = useState(!shouldBypassLogin)
  const [hasSession, setHasSession] = useState(shouldBypassLogin)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    if (shouldBypassLogin) {
      return
    }

    let isMounted = true

    void userApi
      .getMe()
      .then((user) => {
        if (!isMounted) return
        setCurrentUser(user)
        setHasSession(true)
      })
      .catch(() => {
        if (!isMounted) return
        setCurrentUser(null)
        setHasSession(false)
      })
      .finally(() => {
        if (!isMounted) return
        setIsCheckingSession(false)
      })

    return () => {
      isMounted = false
    }
  }, [shouldBypassLogin])

  if (shouldBypassLogin) {
    return <Outlet />
  }

  if (isCheckingSession) {
    return <div className="mx-auto max-w-6xl p-6 text-sm text-text-muted">Checking session...</div>
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />
  }

  if (!currentUser) {
    return <div className="mx-auto max-w-6xl p-6 text-sm text-text-muted">Loading profile...</div>
  }

  return <Outlet context={{ currentUser }} />
}

function App() {
  const bypassLoginScreen = shouldBypassLoginOnLocalhost()

  return (
    <Routes>
      <Route path="/login" element={bypassLoginScreen ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<RequireFrontendLogin />}>
        <Route element={<WithCurrentUser />}>
          {/* /flow renders outside the shared app shell — layout isolated */}
          <Route path="/flow" element={<Flow />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/subscriptions" element={<SubscriptionsDash />} />
            <Route path="/vacation" element={<VacationDash />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:id" element={<HistorySnapshot />} />
          </Route>
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/app" element={<Navigate to="/" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
