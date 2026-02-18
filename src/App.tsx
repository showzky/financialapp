// ADD THIS: Router shell for dashboard and history pages
import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { History } from '@/pages/History'
import { HistorySnapshot } from '@/pages/HistorySnapshot'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Notes } from '@/pages/Notes'
import { userApi } from '@/services/userApi'
import { Wishlist } from '@/pages/Wishlist'

// ADD THIS: Protected route guard based on backend session cookie validation
const RequireFrontendLogin = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let isMounted = true

    void userApi
      .getMe()
      .then(() => {
        if (!isMounted) return
        setHasSession(true)
      })
      .catch(() => {
        if (!isMounted) return
        setHasSession(false)
      })
      .finally(() => {
        if (!isMounted) return
        setIsCheckingSession(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (isCheckingSession) {
    return <div className="mx-auto max-w-6xl p-6 text-sm text-text-muted">Checking session...</div>
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireFrontendLogin />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<HistorySnapshot />} />
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
