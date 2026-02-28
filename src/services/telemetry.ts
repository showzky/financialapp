export type TelemetryPayload = Record<string, string | number | boolean | null | undefined>

export const trackEvent = (eventName: string, payload: TelemetryPayload = {}): void => {
  if (import.meta.env.DEV) {
    console.debug('[telemetry]', eventName, payload)
  }
}
