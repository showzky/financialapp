import * as SecureStore from 'expo-secure-store'

const REFRESH_TOKEN_STORAGE_KEY = 'financialapp.auth.refresh-token'

let cachedRefreshToken: string | null | undefined

export const getStoredRefreshToken = async (): Promise<string | undefined> => {
  if (cachedRefreshToken !== undefined) {
    return cachedRefreshToken ?? undefined
  }

  const storedValue = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY)
  cachedRefreshToken = storedValue ?? null
  return storedValue ?? undefined
}

export const storeRefreshToken = async (refreshToken: string): Promise<void> => {
  cachedRefreshToken = refreshToken
  await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
}

export const clearStoredRefreshToken = async (): Promise<void> => {
  cachedRefreshToken = null
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY)
}