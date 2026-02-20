// ADD THIS: shared backend client using secure cookie-based auth
const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() ?? ''
const isDevelopmentMode = import.meta.env.DEV

if (isDevelopmentMode && configuredBackendUrl.length === 0) {
  throw new Error('VITE_BACKEND_URL must be set in development (for example: http://localhost:4000/api/v1)')
}

export const apiBaseUrl = configuredBackendUrl

export const hasBackendConfig = (): boolean => apiBaseUrl.length > 0

const createHeaders = (initHeaders?: HeadersInit): Headers => {
  const headers = new Headers(initHeaders)
  headers.set('Content-Type', 'application/json')

  return headers
}

export const backendRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!hasBackendConfig()) {
    throw new Error('VITE_BACKEND_URL is not configured')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: createHeaders(init?.headers),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
