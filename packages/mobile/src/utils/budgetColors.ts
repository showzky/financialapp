/** Color and label helpers for budget progress bars.
 *  Thresholds: green < 80%, orange 80–100%, red > 100%
 */
export function getBarColor(pct: number): string {
  if (pct > 100) return '#ef4444' // red — over budget
  if (pct >= 80) return '#f59e0b' // orange — near limit
  return '#10b981'                // green — on track
}

export function getStatusLabel(pct: number): string {
  if (pct > 100) return 'Over budget'
  if (pct >= 80) return 'Near limit'
  return 'On track'
}
