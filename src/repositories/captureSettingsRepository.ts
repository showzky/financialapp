import type { CaptureSettings, CaptureSettingsRepository } from '@/types/history'

const CAPTURE_SETTINGS_STORAGE_KEY = 'finance-capture-settings-v1'

const defaultCaptureSettings: CaptureSettings = {
  captureMode: 'current-payday',
}

const normalizeCaptureSettings = (value: unknown): CaptureSettings => {
  if (
    value &&
    typeof value === 'object' &&
    'captureMode' in value &&
    (value.captureMode === 'manual' || value.captureMode === 'current-payday')
  ) {
    return {
      captureMode: value.captureMode,
    }
  }

  return defaultCaptureSettings
}

export const createLocalStorageCaptureSettingsRepository = (): CaptureSettingsRepository => ({
  read: () => {
    if (typeof window === 'undefined') return defaultCaptureSettings

    try {
      const raw = window.localStorage.getItem(CAPTURE_SETTINGS_STORAGE_KEY)
      if (!raw) return defaultCaptureSettings
      return normalizeCaptureSettings(JSON.parse(raw))
    } catch {
      return defaultCaptureSettings
    }
  },
  write: (settings) => {
    const normalized = normalizeCaptureSettings(settings)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CAPTURE_SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
    }

    return normalized
  },
})
