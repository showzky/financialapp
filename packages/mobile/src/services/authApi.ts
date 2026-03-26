import { backendClient, setAuthToken } from './backendClient'
import { clearStoredRefreshToken, getStoredRefreshToken, storeRefreshToken } from './authSessionStorage'

export type AuthUser = {
  id: string
  email: string
  displayName: string
}

type LoginResponseDto = {
  tokenType: string
  accessToken: string
  refreshToken?: string
  expiresIn: string
  refreshTokenExpiresAt?: string
  user: AuthUser
}

type CurrentUserDto = AuthUser & {
  monthlyIncome: number
  createdAt: string
}

export const authApi = {
  async login(input: { email: string; password: string }): Promise<AuthUser> {
    const response = await backendClient.request<LoginResponseDto>({
      path: '/auth/login',
      method: 'POST',
      body: {
        email: input.email,
        password: input.password,
      },
      authToken: null,
    })

    // Store the JWT for subsequent authenticated requests
    if (response.accessToken) {
      setAuthToken(response.accessToken)
    }

    if (response.refreshToken) {
      await storeRefreshToken(response.refreshToken)
    }

    return response.user
  },

  async refreshSession(): Promise<AuthUser | null> {
    const refreshToken = await getStoredRefreshToken()
    if (!refreshToken) {
      return null
    }

    try {
      const response = await backendClient.request<LoginResponseDto>({
        path: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
        authToken: null,
      })

      if (response.accessToken) {
        setAuthToken(response.accessToken)
      }

      if (response.refreshToken) {
        await storeRefreshToken(response.refreshToken)
      }

      return response.user
    } catch {
      setAuthToken(undefined)
      await clearStoredRefreshToken()
      return null
    }
  },

  async logout(): Promise<void> {
    const refreshToken = await getStoredRefreshToken()

    try {
      await backendClient.request<void>({
        path: '/auth/logout',
        method: 'POST',
        body: refreshToken ? { refreshToken } : undefined,
        authToken: null,
      })
    } finally {
      setAuthToken(undefined)
      await clearStoredRefreshToken()
    }
  },

  async getCurrentUser(): Promise<CurrentUserDto> {
    return backendClient.get<CurrentUserDto>('/users/me')
  },

  // ADDED THIS
  async updateIncome(monthlyIncome: number): Promise<void> {
    await backendClient.patch<void>('/users/me', { monthlyIncome })
  },
}
