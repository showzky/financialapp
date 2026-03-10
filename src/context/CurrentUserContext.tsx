import { createContext, useContext, type ReactNode } from 'react'

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
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

export const CurrentUserProvider = ({
  currentUser,
  children,
}: {
  currentUser: CurrentUser
  children: ReactNode
}) => {
  return <CurrentUserContext.Provider value={{ currentUser }}>{children}</CurrentUserContext.Provider>
}

export const useCurrentUser = (): CurrentUserContextValue => {
  const context = useContext(CurrentUserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider')
  }

  return context
}
