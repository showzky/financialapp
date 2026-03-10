import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/services/authApi'
import { hasBackendConfig } from '@/services/backendClient'

export const Login = () => {
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(true)
  const [isCheckingRegistrationStatus, setIsCheckingRegistrationStatus] = useState(true)

  useEffect(() => {
    if (!hasBackendConfig()) {
      setIsCheckingRegistrationStatus(false)
      return
    }

    let isMounted = true

    void authApi
      .getRegistrationStatus()
      .then((result) => {
        if (!isMounted) return
        setIsRegistrationEnabled(result.publicRegistrationEnabled)
      })
      .catch(() => {
        if (!isMounted) return
        setIsRegistrationEnabled(true)
      })
      .finally(() => {
        if (!isMounted) return
        setIsCheckingRegistrationStatus(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!hasBackendConfig()) {
      setError('Backend URL is not configured. Set VITE_BACKEND_URL first.')
      return
    }

    if (mode === 'register' && !isRegistrationEnabled) {
      setError('Public registration is currently disabled.')
      return
    }

    setIsSubmitting(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response =
        mode === 'register'
          ? await authApi.register({
              email: normalizedEmail,
              password,
              displayName: displayName.trim(),
            })
          : await authApi.login({
              email: normalizedEmail,
              password,
            })

      if (!response.user?.id) {
        throw new Error('Session could not be created')
      }

      navigate('/', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060816] text-white">
      {/* ADD THIS: Sci-fi background glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        {/* ADD THIS: Glassmorphism login card */}
        <div className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-white/5 p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Personal Finance</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">Secure Access</h1>
            <p className="mt-2 text-sm text-white/70">Sign in to access your private dashboard.</p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-cyan-400/20 text-cyan-200' : 'text-white/70 hover:text-white'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError('')
              }}
              disabled={!isRegistrationEnabled || isCheckingRegistrationStatus}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'register' ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'text-white/70 hover:text-white'} ${!isRegistrationEnabled || isCheckingRegistrationStatus ? 'opacity-50' : ''}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' ? (
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-white/70">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Andre"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/30"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-white/70">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>

            {/* ADD THIS: Password input with show/hide */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-white/70">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 focus-within:border-cyan-300/60 focus-within:ring-2 focus-within:ring-cyan-400/30">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs text-cyan-300 hover:text-cyan-200"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (mode === 'register' && (isCheckingRegistrationStatus || !isRegistrationEnabled))
              }
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-[#05070f] transition hover:brightness-110"
            >
              {isSubmitting
                ? mode === 'register'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'register'
                  ? 'Create Account'
                  : 'Enter Dashboard'}
            </button>

            {mode === 'register' && !isCheckingRegistrationStatus && !isRegistrationEnabled ? (
              <p className="text-xs text-amber-300">
                Public registration is currently disabled by the administrator.
              </p>
            ) : null}

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </form>
        </div>
      </div>
    </div>
  )
}
