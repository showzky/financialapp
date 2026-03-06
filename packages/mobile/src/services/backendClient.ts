type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type BackendClientOptions = {
  baseUrl?: string
  authToken?: string
}

export type BackendRequestOptions = {
  method?: HttpMethod
  path: string
  body?: unknown
  headers?: Record<string, string>
  authToken?: string | null
  withCredentials?: boolean
}

const defaultBaseUrl = (): string => {
  const raw = process.env.EXPO_PUBLIC_BACKEND_URL?.trim()
  if (raw) return raw.replace(/\/+$/, '')
  return 'http://10.0.2.2:4000/api/v1'
}

const defaultAuthToken = (): string | undefined => {
  const raw = process.env.EXPO_PUBLIC_BACKEND_AUTH_TOKEN?.trim()
  return raw && raw.length > 0 ? raw : undefined
}

const buildUrl = (baseUrl: string, path: string): string => {
  if (!path.startsWith('/')) return `${baseUrl}/${path}`
  return `${baseUrl}${path}`
}

export class BackendError extends Error {
  status: number
  bodyText?: string

  constructor(message: string, input: { status: number; bodyText?: string }) {
    super(message)
    this.name = 'BackendError'
    this.status = input.status
    this.bodyText = input.bodyText
  }
}

// In-memory token store – set by authApi after login, cleared on logout.
let savedAuthToken: string | undefined

export const setAuthToken = (token: string | undefined) => {
  savedAuthToken = token
}

export const getAuthToken = (): string | undefined => savedAuthToken

export const createBackendClient = (options: BackendClientOptions = {}) => {
  const baseUrl = options.baseUrl?.replace(/\/+$/, '') ?? defaultBaseUrl()
  const authToken = options.authToken ?? defaultAuthToken()

  const request = async <TResponse>(input: BackendRequestOptions): Promise<TResponse> => {
    const effectiveAuthToken =
      input.authToken === undefined
        ? savedAuthToken ?? authToken
        : input.authToken === null
          ? undefined
          : input.authToken

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(input.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(effectiveAuthToken ? { Authorization: `Bearer ${effectiveAuthToken}` } : {}),
      ...(input.headers ?? {}),
    }

    const response = await fetch(buildUrl(baseUrl, input.path), {
      method: input.method ?? 'GET',
      headers,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      // Let native cookie storage work (needed for local auth mode).
      credentials: input.withCredentials === false ? 'omit' : 'include',
    })

    if (!response.ok) {
      let bodyText: string | undefined
      try {
        bodyText = await response.text()
      } catch {
        bodyText = undefined
      }

      throw new BackendError(`Request failed (${response.status})`, {
        status: response.status,
        bodyText,
      })
    }

    // 204 / empty response
    if (response.status === 204) {
      return undefined as TResponse
    }

    return (await response.json()) as TResponse
  }

  return {
    request,
    get: async <TResponse>(path: string, headers?: Record<string, string>) =>
      request<TResponse>({ path, method: 'GET', headers }),
    post: async <TResponse>(path: string, body: unknown, headers?: Record<string, string>) =>
      request<TResponse>({ path, method: 'POST', body, headers }),
    patch: async <TResponse>(path: string, body: unknown, headers?: Record<string, string>) =>
      request<TResponse>({ path, method: 'PATCH', body, headers }),
    delete: async (path: string, headers?: Record<string, string>) =>
      request<void>({ path, method: 'DELETE', headers }),
  }
}

export const backendClient = createBackendClient()
