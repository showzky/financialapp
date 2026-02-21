// ADD THIS: shared backend client using explicit environment configuration
const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() ?? ''
const isDevelopmentMode = import.meta.env.DEV

if (isDevelopmentMode && configuredBackendUrl.length === 0) {
  throw new Error(
    'VITE_BACKEND_URL must be set in development (for example: http://localhost:4000/api/v1)',
  )
}

export const apiBaseUrl = configuredBackendUrl

export const hasBackendConfig = (): boolean => apiBaseUrl.length > 0

const createHeaders = (initHeaders?: HeadersInit): Headers => {
  const headers = new Headers(initHeaders)
  headers.set('Content-Type', 'application/json')

  return headers
}

const formatBackendError = (rawMessage: string, status: number): string => {
  if (!rawMessage) {
    return `HUD Alert: Request failed (${status}). Please try again.`
  }

  try {
    const parsed = JSON.parse(rawMessage) as {
      message?: string
      issues?: {
        fieldErrors?: Record<string, string[]>
      }
    }

    const fieldErrors = parsed.issues?.fieldErrors ?? {}
    const firstFieldError = Object.values(fieldErrors).flat()[0]
    if (firstFieldError) {
      return `HUD Alert: ${firstFieldError}`
    }

    if (parsed.message) {
      return `HUD Alert: ${parsed.message}`
    }
  } catch {
    return `HUD Alert: ${rawMessage}`
  }

  return `HUD Alert: Request failed (${status}). Please try again.`
}

export const getHudAlertMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'HUD Alert: Unable to complete request. Please retry.'
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
    const rawMessage = await response.text()
    throw new Error(formatBackendError(rawMessage, response.status))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
