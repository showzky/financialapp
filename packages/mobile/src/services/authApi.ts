import { backendClient, setAuthToken } from './backendClient'

export type AuthUser = {
  id: string
  email: string
  displayName: string
}

type LoginResponseDto = {
  tokenType: string
  accessToken: string
  expiresIn: string
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

    return response.user
  },

  async logout(): Promise<void> {
    try {
      await backendClient.request<void>({
        path: '/auth/logout',
        method: 'POST',
        authToken: null,
      })
    } finally {
      setAuthToken(undefined)
    }
  },

  async getCurrentUser(): Promise<CurrentUserDto> {
    return backendClient.get<CurrentUserDto>('/users/me')
  },
}
