// ADD THIS: Persistent navigation shell for Dashboard and History routes
import { NavLink, Outlet } from 'react-router-dom'

export const AppLayout = () => {
  return (
    <div className="space-y-6">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-neo bg-surface p-3 shadow-neo-md">
        <p className="px-2 text-sm font-semibold uppercase tracking-[0.16em] text-text-muted">
          Finance Views
        </p>
        <div className="flex gap-2">
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
        </div>
      </nav>

      <Outlet />
    </div>
  )
}
