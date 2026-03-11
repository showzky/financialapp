import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type CurrentUser = {
  id: string
  email: string
  displayName: string
  monthlyIncome: number
  createdAt: string
  isBootstrapAdmin?: boolean
}

type CurrentUserContextValue = {
  currentUser: CurrentUser
  setCurrentUser: (user: CurrentUser) => void
  mergeCurrentUser: (updates: Partial<CurrentUser>) => void
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

export const CurrentUserProvider = ({
  currentUser: initialCurrentUser,
  children,
}: {
  currentUser: CurrentUser
  children: ReactNode
}) => {
  const [currentUser, setCurrentUser] = useState(initialCurrentUser)

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      mergeCurrentUser: (updates: Partial<CurrentUser>) => {
        setCurrentUser((existing) => ({ ...existing, ...updates }))
      },
    }),
    [currentUser],
  )

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
}

export const useCurrentUser = (): CurrentUserContextValue => {
  const context = useContext(CurrentUserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider')
  }

  return context
}
