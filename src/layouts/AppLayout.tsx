// ADD THIS: Persistent navigation shell for Dashboard and History routes
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearBackendAccessToken } from '@/services/backendClient'

export const AppLayout = () => {
  // ADD THIS: navigate user back to login after token clear
  const navigate = useNavigate()

  const handleLogout = () => {
    clearBackendAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-neo bg-surface p-3 shadow-neo-md">
        <div className="flex items-center gap-4">
          <p className="px-2 text-sm font-semibold uppercase tracking-[0.16em] text-text-muted">
            Finance Views
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-neo px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-surface shadow-neo-inset text-text-primary'
                  : 'bg-surface shadow-neo-sm text-text-muted'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `rounded-neo px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-surface shadow-neo-inset text-text-primary'
                  : 'bg-surface shadow-neo-sm text-text-muted'
              }`
            }
          >
            Monthly Records
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-neo px-4 py-2 text-sm font-semibold bg-surface shadow-neo-sm text-text-muted transition hover:text-text-primary"
          >
            Logout
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  )
}
