// @ts-nocheck
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BackendError } from '../services/backendClient'
import { authApi, type AuthUser } from '../services/authApi'

type AuthStatus = 'checking' | 'signedOut' | 'signedIn'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [user, setUser] = useState<AuthUser | null>(null)

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.getCurrentUser()
      setUser({ id: me.id, email: me.email, displayName: me.displayName })
      setStatus('signedIn')
    } catch (err) {
      if (err instanceof BackendError && err.status === 401) {
        setUser(null)
        setStatus('signedOut')
        return
      }

      // Treat unexpected errors as signed-out to avoid blocking the app forever.
      setUser(null)
      setStatus('signedOut')
    }
  }, [])

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      await authApi.login(input)
      await refresh()
    },
    [refresh],
  )

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout failures; clear local auth state anyway.
    } finally {
      setUser(null)
      setStatus('signedOut')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn,
      signOut,
      refresh,
    }),
    [status, user, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
