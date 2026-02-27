// ADD THIS: Persistent navigation shell for Dashboard and History routes
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/authApi'

export const AppLayout = () => {
  // ADD THIS: navigate user back to login after token clear
  const navigate = useNavigate()
  const location = useLocation()

  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreIsActive = ['/wishlist', '/loans', '/subscriptions', '/vacation'].some((path) =>
    location.pathname.startsWith(path)
  )

  const navItemClass = (isActive: boolean) =>
    `rounded-neo px-4 py-2 text-sm font-semibold transition bg-surface shadow-neo-sm border border-white/10 ${
      isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
    }`

  const dropdownItemClass = (isActive: boolean) =>
    `block w-full rounded-neo px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
    }`

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="space-y-6">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-neo bg-surface p-3 shadow-neo-sm border border-white/10">
        <div className="flex items-center gap-4">
          <p className="px-2 text-sm font-semibold uppercase tracking-[0.16em] text-text-muted">
            Finance Views
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) => navItemClass(isActive)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => navItemClass(isActive)}
          >
            Monthly Records
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setIsMoreOpen(true)}
            onMouseLeave={() => setIsMoreOpen(false)}
            onBlur={(event) => {
              const nextFocused = event.relatedTarget as Node | null
              if (nextFocused && event.currentTarget.contains(nextFocused)) return
              setIsMoreOpen(false)
            }}
          >
            <button
              id="more-menu-button"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              aria-controls="more-menu"
              className={navItemClass(moreIsActive)}
              onClick={() => setIsMoreOpen((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsMoreOpen(false)
                  ;(event.currentTarget as HTMLButtonElement).focus()
                }
                if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                  setIsMoreOpen(true)
                }
              }}
            >
              More
            </button>

            {isMoreOpen ? (
              <div
                id="more-menu"
                role="menu"
                aria-labelledby="more-menu-button"
                className="absolute right-0 top-full z-50 w-56 pt-2"
              >
                <div className="rounded-neo bg-surface p-2 shadow-neo-sm border border-white/10">
                  <NavLink
                    to="/wishlist"
                    role="menuitem"
                    className={({ isActive }) => dropdownItemClass(isActive)}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Wishlist
                  </NavLink>
                  <NavLink
                    to="/loans"
                    role="menuitem"
                    className={({ isActive }) => dropdownItemClass(isActive)}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Loans
                  </NavLink>
                  <NavLink
                    to="/vacation"
                    role="menuitem"
                    className={({ isActive }) => dropdownItemClass(isActive)}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Vacation
                  </NavLink>
                  <NavLink
                    to="/subscriptions"
                    role="menuitem"
                    className={({ isActive }) => dropdownItemClass(isActive)}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Subscriptions
                  </NavLink>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-neo px-4 py-2 text-sm font-semibold bg-surface shadow-neo-sm border border-white/10 text-text-muted transition hover:text-text-primary"
          >
            Logout
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  )
}
