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
        group relative flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 
        hover:shadow-md md:p-4
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
      `}
    >
      {/* Label Row */}
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>

      {/* Value + Icon Row */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {value}
        </h3>
        <div className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-500">
          <div className="h-6 w-6">{icon}</div>
        </div>
      </div>

      {/* Footer Row: Helper + Trend */}
      {(helper || trend) && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-1">
          {helper && <span className="truncate text-sm text-slate-600">{helper}</span>}
          {trend && (
            <span
              className={`flex items-center text-sm font-bold ${
                trend.direction === 'up' ? 'text-emerald-500' : 'text-rose-500'
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
