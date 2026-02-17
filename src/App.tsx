// ADD THIS: Router shell for dashboard and history pages
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { History } from '@/pages/History'
import { HistorySnapshot } from '@/pages/HistorySnapshot'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Notes } from '@/pages/Notes'
import { getBackendAccessToken } from '@/services/backendClient'

// ADD THIS: Frontend-only route guard for locked pages
const RequireFrontendLogin = () => {
  const hasToken = Boolean(getBackendAccessToken())

  if (!hasToken) {
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
