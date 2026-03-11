import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Clock3, LogOut, MonitorSmartphone, Settings2 } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/authApi'
import { UserSettingsModal } from '@/components/UserSettingsModal'
import { useCurrentUser } from '@/context/CurrentUserContext'

const currentMonthLabel = new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
}).toUpperCase()

const formatTimestamp = (value: Date) =>
  value
    .toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')
    .replaceAll('/', '-')

const formatMemberSince = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

const getCurrentDeviceLabel = () => {
  if (typeof navigator === 'undefined') {
    return 'This device'
  }

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    'Unknown device'
  const userAgent = navigator.userAgent
  let browser = 'Browser'

  if (userAgent.includes('Edg/')) browser = 'Edge'
  else if (userAgent.includes('Chrome/')) browser = 'Chrome'
  else if (userAgent.includes('Firefox/')) browser = 'Firefox'
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari'

  return `${platform} - ${browser}`
}

type UserMenuActionProps = {
  icon: typeof Settings2
  label: string
  description: string
  onClick: () => void
}

const UserMenuAction = ({ icon: Icon, label, description, onClick }: UserMenuActionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[8px] border border-transparent px-2.5 py-2 text-left transition-all duration-150 hover:border-[#2a2a32] hover:bg-[#202026]"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-[#2a2a32] bg-[#18181c] text-[#b8b4ae] transition-colors duration-150 group-hover:border-[rgba(201,168,76,0.22)] group-hover:text-[#f0ede8]">
        <Icon size={15} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tracking-[0.01em] text-[#f0ede8]">{label}</span>
        <span className="mt-0.5 block text-[11px] text-[#6b6862]">{description}</span>
      </span>
      <ChevronRight
        size={15}
        strokeWidth={1.8}
        className="text-[#6b6862] transition-colors duration-150 group-hover:text-[#c9a84c]"
      />
    </button>
  )
}

export const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [sessionStartedAt] = useState(() => new Date())
  const [sessionNow, setSessionNow] = useState(() => new Date())
  const { currentUser } = useCurrentUser()

  const userInitial = useMemo(() => {
    const source = currentUser.displayName?.trim() || currentUser.email
    return source.charAt(0).toUpperCase() || 'U'
  }, [currentUser.displayName, currentUser.email])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSessionNow(new Date())
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const moreIsActive = ['/wishlist', '/loans', '/subscriptions', '/vacation'].some((path) =>
    location.pathname.startsWith(path),
  )

  const memberSinceLabel = useMemo(() => formatMemberSince(currentUser.createdAt), [currentUser.createdAt])
  const sessionStartedLabel = useMemo(() => formatTimestamp(sessionStartedAt), [sessionStartedAt])
  const deviceLabel = useMemo(() => getCurrentDeviceLabel(), [])
  const roleLabel = currentUser.isBootstrapAdmin ? 'OWNER' : 'MEMBER'
  const profileName = currentUser.displayName?.trim() || currentUser.email.split('@')[0] || 'User'
  const sessionDurationLabel = useMemo(() => {
    const diffMs = Math.max(sessionNow.getTime() - sessionStartedAt.getTime(), 0)
    const totalMinutes = Math.max(1, Math.floor(diffMs / 60_000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0) {
      return `${hours}H ${minutes}M ACTIVE`
    }

    return `${minutes}M ACTIVE`
  }, [sessionNow, sessionStartedAt])

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

  const handleSettingsClick = () => {
    setIsUserMenuOpen(false)
    setIsSettingsModalOpen(true)
  }

  return (
    <div className="relative z-[1] min-h-screen">
      <nav className="border-b border-[rgba(255,255,255,0.055)] px-8 py-[22px]">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-5">
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#f5d98a] text-[14px] font-bold text-[#0a0a0b]">
              F
            </div>
            <span className="text-[15px] font-semibold tracking-[0.02em] text-text-primary">Finance</span>
          </div>

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
          </div>

          <div className="flex flex-shrink-0 items-center gap-2.5">
            <div className="hidden rounded-[10px] border border-[rgba(255,255,255,0.055)] px-3.5 py-[7px] font-['DM_Mono',monospace] text-[12px] tracking-[0.06em] text-[#6b6862] sm:block">
              {currentMonthLabel}
            </div>
            <div
              ref={userMenuRef}
              className="relative"
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
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold transition ${
                  isUserMenuOpen
                    ? 'border-[#c9a84c] bg-[rgba(201,168,76,0.10)] text-[#c9a84c]'
                    : 'border-[#2a2a32] bg-[#202026] text-[#c9a84c] hover:border-[rgba(201,168,76,0.22)]'
                }`}
              >
                {userInitial}
              </button>

              {isUserMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-[272px] overflow-hidden rounded-[10px] border border-[rgba(201,168,76,0.22)] bg-[#111114] shadow-[0_0_0_1px_#2a2a32,0_24px_64px_rgba(0,0,0,0.75),0_0_40px_rgba(201,168,76,0.05)]"
                >
                  <div className="relative overflow-hidden border-b border-[#2a2a32] bg-gradient-to-br from-[#18181c] to-[#111114] px-4 py-4">
                    <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_70%)]" />

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.10)] text-[16px] font-bold text-[#c9a84c]">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-0.5 flex items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-[#f0ede8]">{profileName}</p>
                          <span className="rounded-[3px] border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.10)] px-1.5 py-[1px] font-['DM_Mono',monospace] text-[8px] font-semibold tracking-[0.1em] text-[#c9a84c]">
                            {roleLabel}
                          </span>
                        </div>
                        <p className="truncate font-['DM_Mono',monospace] text-[10px] text-[#6b6862]">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,189,151,0.22)] bg-[rgba(94,189,151,0.10)] px-2 py-1 font-['DM_Mono',monospace] text-[9px] font-semibold text-[#5ebd97]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5ebd97]" />
                        {sessionDurationLabel}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#2a2a32] bg-[#202026] px-2 py-1 font-['DM_Mono',monospace] text-[9px] text-[#6b6862]">
                        SINCE {memberSinceLabel}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-['DM_Mono',monospace] text-[9px] tracking-[0.08em]">
                      <span className="inline-flex items-center gap-1.5 text-[#6b6862]">
                        <Clock3 size={11} strokeWidth={1.8} />
                        SIGNED IN
                      </span>
                      <span className="truncate text-[#b8b4ae]">{sessionStartedLabel}</span>
                      <span className="inline-flex items-center gap-1.5 text-[#6b6862]">
                        <MonitorSmartphone size={11} strokeWidth={1.8} />
                        DEVICE
                      </span>
                      <span className="truncate text-[#b8b4ae]">{deviceLabel}</span>
                    </div>
                  </div>

                  <div className="px-1.5 py-1.5">
                    <UserMenuAction
                      icon={Settings2}
                      label="Settings"
                      description="Account, password & preferences"
                      onClick={handleSettingsClick}
                    />
                  </div>

                  <div className="mx-3 h-px bg-[#2a2a32]" />

                  <div className="px-1.5 py-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group flex w-full items-center gap-3 rounded-[8px] border border-transparent px-2.5 py-2 text-left transition-all duration-150 hover:border-[rgba(201,107,107,0.22)] hover:bg-[rgba(201,107,107,0.10)]"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-[#2a2a32] bg-[#18181c] text-[#6b6862] transition-colors duration-150 group-hover:border-[rgba(201,107,107,0.22)] group-hover:text-[#c96b6b]">
                        <LogOut size={15} strokeWidth={1.8} />
                      </span>
                      <span className="text-[14px] font-semibold tracking-[0.01em] text-[#f0ede8] transition-colors duration-150 group-hover:text-[#c96b6b]">
                        Logout
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <div className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-[1380px]">
          <Outlet />
        </div>
      </div>

      <UserSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  )
}
