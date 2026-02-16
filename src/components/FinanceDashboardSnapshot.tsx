// ADD THIS: Reusable read-only dashboard snapshot renderer for history records
import { BudgetCategoryCard } from '@/components/BudgetCategoryCard'
import { NeoCard } from '@/components/NeoCard'
import { ProgressBar } from '@/components/ProgressBar'
import { SummaryStat } from '@/components/SummaryStat'
import type { BudgetState } from '@/types/budget'
import { formatCurrency } from '@/utils/currency'

type FinanceDashboardSnapshotProps = {
  data: BudgetState
  currencySymbol?: string
}

export const FinanceDashboardSnapshot = ({
  data,
  currencySymbol = 'KR',
}: FinanceDashboardSnapshotProps) => {
  const allocated = data.categories.reduce((sum, category) => sum + category.allocated, 0)
  const spent = data.categories.reduce((sum, category) => sum + category.spent, 0)
  const freeToAssign = Math.max(data.income - allocated, 0)
  const utilization = allocated === 0 ? 0 : Math.round((spent / allocated) * 100)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryStat
          label="Monthly income"
          value={formatCurrency(data.income, currencySymbol)}
          helper="Read-only snapshot"
          icon="💰"
        />
        <SummaryStat
          label="Allocated"
          value={formatCurrency(allocated, currencySymbol)}
          helper={`${utilization}% of plan`}
          icon="🗂️"
        />
        <SummaryStat
          label="Free to assign"
          value={formatCurrency(freeToAssign, currencySymbol)}
          helper="Captured at archive time"
          tone="positive"
          icon="✨"
        />
      </section>

      <NeoCard className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-muted">Cash flow snapshot</p>
            <p className="text-xl font-semibold text-text-primary">
              {formatCurrency(freeToAssign, currencySymbol)} left to allocate
            </p>
          </div>
          <div className="flex gap-3 text-sm text-text-muted">
            <span className="rounded-full bg-surface-strong px-3 py-1 shadow-neo-sm">
              Spent {formatCurrency(spent, currencySymbol)}
            </span>
            <span className="rounded-full bg-surface-strong px-3 py-1 shadow-neo-sm">
              Planned {formatCurrency(allocated, currencySymbol)}
            </span>
          </div>
        </div>
        <ProgressBar value={spent} max={Math.max(allocated, 1)} />
      </NeoCard>

      <section className="grid gap-4 md:grid-cols-2">
        {data.categories.map((category) => (
          <BudgetCategoryCard
            key={category.id}
            category={category}
            onChangeAmounts={() => {}}
            readOnly
            currencySymbol={currencySymbol}
          />
        ))}
      </section>
    </div>
  )
}
