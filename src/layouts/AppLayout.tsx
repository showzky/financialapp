import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/authApi'
import { useCurrentUser } from '@/context/CurrentUserContext'

const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

export const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { currentUser } = useCurrentUser()

  const userInitial = useMemo(() => {
    const source = currentUser.displayName?.trim() || currentUser.email
    return source.charAt(0).toUpperCase() || 'U'
  }, [currentUser.displayName, currentUser.email])

  const moreIsActive = ['/wishlist', '/loans', '/subscriptions', '/vacation'].some((path) =>
    location.pathname.startsWith(path),
  )

  const navLinkClass = (isActive: boolean) =>
    `inline-flex items-center rounded-[10px] px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-all duration-[180ms] ${
      isActive
        ? 'bg-[#202026] text-[#f0ede8]'
        : 'bg-transparent text-[#6b6862] hover:bg-[#18181c] hover:text-[#b8b4ae]'
    }`

  const flowLinkClass = (isActive: boolean) =>
    `inline-flex items-center rounded-[10px] border px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-all duration-[180ms] ${
      isActive
        ? 'border-[#c9a84c] bg-[rgba(201,168,76,0.14)] text-[#f5d98a]'
        : 'border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.04)] text-[#c9a84c] hover:border-[rgba(201,168,76,0.32)] hover:bg-[rgba(201,168,76,0.10)] hover:text-[#f5d98a]'
    }`

  const dropdownItemClass = (isActive: boolean) =>
    `block w-full rounded-[10px] px-3 py-2 text-[13px] font-medium tracking-[0.01em] text-left transition-all duration-[180ms] ${
      isActive
        ? 'bg-[#202026] text-[#f0ede8]'
        : 'text-[#6b6862] hover:bg-[#18181c] hover:text-[#b8b4ae]'
    }`

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="relative z-[1] min-h-screen">
      {/* ── NAV ── */}
      <nav className="border-b border-[rgba(255,255,255,0.055)] px-8 py-[22px]">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-5">

          {/* Brand */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#f5d98a] text-[14px] font-bold text-[#0a0a0b]">
              F
            </div>
            <span className="text-[15px] font-semibold tracking-[0.02em] text-text-primary">
              Finance
            </span>
          </div>

          {/* Nav links */}
          <div className="flex flex-1 flex-wrap items-center justify-center gap-0.5">
            <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
              Dashboard
            </NavLink>
            <NavLink to="/flow" className={({ isActive }) => flowLinkClass(isActive)}>
              Flow
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => navLinkClass(isActive)}>
              Monthly Records
            </NavLink>

            {/* More dropdown */}
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
                className={navLinkClass(moreIsActive)}
                onClick={() => setIsMoreOpen((prev) => !prev)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsMoreOpen(false)
                    ;(event.currentTarget as HTMLButtonElement).focus()
                  }
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
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
                  className="absolute left-0 top-full z-50 w-52 pt-2"
                >
                  <div className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
                    <NavLink to="/wishlist" role="menuitem" className={({ isActive }) => dropdownItemClass(isActive)} onClick={() => setIsMoreOpen(false)}>Wishlist</NavLink>
                    <NavLink to="/loans" role="menuitem" className={({ isActive }) => dropdownItemClass(isActive)} onClick={() => setIsMoreOpen(false)}>Loans</NavLink>
                    <NavLink to="/vacation" role="menuitem" className={({ isActive }) => dropdownItemClass(isActive)} onClick={() => setIsMoreOpen(false)}>Vacation</NavLink>
                    <NavLink to="/subscriptions" role="menuitem" className={({ isActive }) => dropdownItemClass(isActive)} onClick={() => setIsMoreOpen(false)}>Subscriptions</NavLink>
                  </div>
                </div>
              ) : null}
            </div>

          </div>

          {/* Right: month label + avatar */}
          <div className="flex flex-shrink-0 items-center gap-2.5">
            <div className="hidden rounded-[10px] border border-[rgba(255,255,255,0.055)] px-3.5 py-[7px] font-['DM_Mono',monospace] text-[12px] tracking-[0.06em] text-[#6b6862] sm:block">
              {currentMonthLabel}
            </div>
            <div
              className="relative"
              onMouseLeave={() => setIsUserMenuOpen(false)}
              onBlur={(event) => {
                const nextFocused = event.relatedTarget as Node | null
                if (nextFocused && event.currentTarget.contains(nextFocused)) return
                setIsUserMenuOpen(false)
              }}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[12px] font-semibold text-[var(--color-accent)] transition hover:border-[var(--color-accent-soft)]"
              >
                {userInitial}
              </button>

              {isUserMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
                >
                  <div className="rounded-[10px] bg-[var(--color-surface-alt)] px-3 py-2">
                    <p className="text-sm font-semibold text-text-primary">{currentUser.displayName}</p>
                    <p className="truncate text-xs text-text-muted">{currentUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 block w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-left text-sm font-medium text-text-primary transition hover:border-[var(--color-accent-soft)]"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-[1380px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
