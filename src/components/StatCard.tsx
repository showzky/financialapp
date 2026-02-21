import React, { type ReactNode } from 'react'

/**
 * ADD THIS: Compact, scannable card for dashboard summary statistics.
 * Designed for high-density grids (2 per row on mobile, 4 on desktop).
 */

export interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  helper?: string
  trend?: {
    value: string
    direction: 'up' | 'down'
  }
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  helper,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-panel group relative flex flex-col gap-1 p-3 transition-all duration-200 
        md:p-4
        ${onClick ? 'cursor-pointer hover:bg-white/10 active:scale-95' : ''}
      `}
    >
      {/* Label Row */}
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>

      {/* Value + Icon Row */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
          {value}
        </h3>
        <div className="shrink-0 text-text-muted transition-colors group-hover:text-accent">
          <div className="h-6 w-6">{icon}</div>
        </div>
      </div>

      {/* Footer Row: Helper + Trend */}
      {(helper || trend) && (
        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1">
          {helper && <span className="truncate text-sm text-text-muted">{helper}</span>}
          {trend && (
            <span
              className={`flex items-center text-sm font-bold ${
                trend.direction === 'up' ? 'text-success' : 'text-error'
              }`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
