// ADD THIS: Compact stat tile for dashboard highlights
import type { ReactNode } from 'react'
import { NeoCard } from './NeoCard'

const toneStyles: Record<'neutral' | 'positive' | 'warning', string> = {
  neutral: 'text-text-muted',
  positive: 'text-green-600',
  warning: 'text-amber-600',
}

type SummaryStatProps = {
  label: string
  value: string
  helper?: string
  icon?: ReactNode
  tone?: 'neutral' | 'positive' | 'warning'
  onClick?: () => void
}

export const SummaryStat = ({
  label,
  value,
  helper,
  icon,
  tone = 'neutral',
  onClick,
}: SummaryStatProps) => (
  <NeoCard
    as={onClick ? 'button' : 'div'}
    className={`flex flex-col gap-2 p-4 text-left md:p-5 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      {icon ? <span className="text-lg text-accent">{icon}</span> : null}
    </div>
    <p className="text-2xl font-semibold text-text-primary">{value}</p>
    {helper ? <p className={`text-xs ${toneStyles[tone]}`}>{helper}</p> : null}
  </NeoCard>
)
