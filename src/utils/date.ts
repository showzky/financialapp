// Utility helpers for date formatting used across the app.

/**
 * Format an ISO date/time string for display in Central European Time (UTC+1/UTC+2 with DST)
 * using an English-style pattern (day/month/year, 24‑hour time).
 *
 * The implementation relies on `toLocaleString` with a fixed IANA timezone so the
 * output is consistent regardless of the user's local machine timezone. CET is
 * represented with the `Europe/Berlin` locale which handles DST automatically.
 */
export function formatCETDateTime(isoString: string | Date): string {
  const dt = typeof isoString === 'string' ? new Date(isoString) : isoString
  return dt.toLocaleString('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
