import React from 'react'
import type { VacationSummary } from '../types/vacation'
import { formatCurrency } from '../utils/currency'
import { NeoCard } from './NeoCard'

interface FerieTankCardProps {
  summary: VacationSummary
}

export const FerieTankCard: React.FC<FerieTankCardProps> = ({ summary }) => {
  const { dailyAllowance, remainingBudget, daysRemaining, progressPercentage } = summary

  return (
    <NeoCard className="p-6 backdrop-blur-[20px] bg-slate-900/40 border-slate-700/50 relative overflow-hidden group">
      {/* Custom Glow Effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all duration-700" />

      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-slate-400 font-mono text-sm tracking-wider uppercase">
            Daily Allowance
          </h3>
          <span className="text-xs font-mono text-slate-500">{daysRemaining} days left</span>
        </div>

        <div className="flex flex-col">
          <span className="text-4xl font-mono font-bold text-white tracking-tighter">
            {formatCurrency(dailyAllowance / 100)}
          </span>
          <span className="text-xs text-slate-500 font-mono mt-1">
            Remaining: {formatCurrency(remainingBudget / 100)}
          </span>
        </div>

        <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden border border-slate-700/30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
      </div>
    </NeoCard>
  )
}
