// ADD THIS: Soft progress bar matching neumorphic palette
import { useMemo } from 'react'

type ProgressBarProps = {
  value: number
  max: number
}

export const ProgressBar = ({ value, max }: ProgressBarProps) => {
  const percent = useMemo(() => {
    if (max === 0) return 0
    return Math.min(100, Math.max(0, (value / max) * 100))
  }, [value, max])

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface shadow-neo-inset">
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
