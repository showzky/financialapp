// ADD THIS: Router shell for dashboard and history pages
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { History } from '@/pages/History'
import { HistorySnapshot } from '@/pages/HistorySnapshot'
import { Home } from '@/pages/Home'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<HistorySnapshot />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
