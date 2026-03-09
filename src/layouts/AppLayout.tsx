import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/authApi'

const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

export const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const moreIsActive = ['/wishlist', '/loans', '/subscriptions', '/vacation'].some((path) =>
    location.pathname.startsWith(path),
  )

  const navLinkClass = (isActive: boolean) =>
    `inline-flex items-center rounded-[10px] px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-all duration-[180ms] ${
      isActive
        ? 'bg-[#202026] text-[#f0ede8]'
        : 'bg-transparent text-[#6b6862] hover:bg-[#18181c] hover:text-[#b8b4ae]'
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

            <button
              type="button"
              onClick={handleLogout}
              className={navLinkClass(false)}
            >
              Logout
            </button>
          </div>

          {/* Right: month label + avatar */}
          <div className="flex flex-shrink-0 items-center gap-2.5">
            <div className="hidden rounded-[10px] border border-[rgba(255,255,255,0.055)] px-3.5 py-[7px] font-['DM_Mono',monospace] text-[12px] tracking-[0.06em] text-[#6b6862] sm:block">
              {currentMonthLabel}
            </div>
            <div className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,0.10)] bg-[#202026] text-[12px] font-semibold text-[#e2c06a]">
              A
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

