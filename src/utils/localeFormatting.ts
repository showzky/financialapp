export const DEFAULT_CURRENCY = 'NOK'

const fallbackLocale = 'en-US'

export const getDefaultLocale = (): string => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }

  return fallbackLocale
}

export type LocaleCurrencyConfig = {
  locale: string
  currency: string
}

export const getLocaleCurrencyConfig = (
  overrides?: Partial<LocaleCurrencyConfig>,
): LocaleCurrencyConfig => {
  const rawLocale = overrides?.locale?.trim() || getDefaultLocale()
  const rawCurrency = overrides?.currency?.trim().toUpperCase() || DEFAULT_CURRENCY

  let locale = fallbackLocale
  try {
    locale = Intl.getCanonicalLocales(rawLocale)[0] ?? fallbackLocale
  } catch {
    locale = fallbackLocale
  }

  const currency = /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY

  return {
    locale,
    currency,
  }
}
