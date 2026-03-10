// ADD THIS: backend auth API client for secure login token retrieval
import { apiBaseUrl, hasBackendConfig } from './backendClient'

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = {
  email: string
  password: string
  displayName: string
}

type AuthSettingsResponse = {
  publicRegistrationEnabled: boolean
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

  async register(payload: RegisterPayload): Promise<LoginResponse> {
    if (!hasBackendConfig()) {
      throw new Error('VITE_BACKEND_URL is not configured')
    }

    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMessage = `Registration failed with status ${response.status}`

      try {
        const errorBody = (await response.json()) as { message?: string }
        if (errorBody.message) {
          errorMessage = errorBody.message
        }
      } catch {
        // Ignore non-JSON errors and keep the generic message.
      }

      throw new Error(errorMessage)
    }

    return (await response.json()) as LoginResponse
  },

  async getRegistrationStatus(): Promise<AuthSettingsResponse> {
    if (!hasBackendConfig()) {
      throw new Error('VITE_BACKEND_URL is not configured')
    }

    const response = await fetch(`${apiBaseUrl}/auth/register-status`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Unable to check registration status (${response.status})`)
    }

    return (await response.json()) as AuthSettingsResponse
  },

  async getAuthSettings(): Promise<AuthSettingsResponse> {
    if (!hasBackendConfig()) {
      throw new Error('VITE_BACKEND_URL is not configured')
    }

    const response = await fetch(`${apiBaseUrl}/auth/settings`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Unable to load auth settings (${response.status})`)
    }

    return (await response.json()) as AuthSettingsResponse
  },

  async updateAuthSettings(payload: AuthSettingsResponse): Promise<AuthSettingsResponse> {
    if (!hasBackendConfig()) {
      throw new Error('VITE_BACKEND_URL is not configured')
    }

    const response = await fetch(`${apiBaseUrl}/auth/settings`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMessage = `Unable to update auth settings (${response.status})`

      try {
        const errorBody = (await response.json()) as { message?: string }
        if (errorBody.message) {
          errorMessage = errorBody.message
        }
      } catch {
        // Ignore non-JSON errors and keep the generic message.
      }

      throw new Error(errorMessage)
    }

    return (await response.json()) as AuthSettingsResponse
  },
}
