// ADD THIS: backend auth API client for secure login token retrieval
import { apiBaseUrl, hasBackendConfig } from './backendClient'

type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  tokenType: 'Bearer'
  expiresIn: string
  user: {
    id: string
    email: string
    displayName: string
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    if (!hasBackendConfig()) {
      throw new Error('VITE_BACKEND_URL is not configured')
    }

    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMessage = `Login failed with status ${response.status}`

      try {
        const errorBody = (await response.json()) as { message?: string }
        if (errorBody.message) {
          errorMessage = errorBody.message
        }
      } catch {
        // ADD THIS: fallback keeps generic error message on non-JSON responses
      }

      throw new Error(errorMessage)
    }

    return (await response.json()) as LoginResponse
  },

  async logout(): Promise<void> {
    if (!hasBackendConfig()) {
      throw new Error('VITE_BACKEND_URL is not configured')
    }

    const response = await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok && response.status !== 204) {
      throw new Error(`Logout failed with status ${response.status}`)
    }
  },
}
