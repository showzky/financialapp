import React, { useMemo, useState } from 'react'
import { VictoryPie, VictoryTooltip } from 'victory'
import type { VacationExpense } from '../../types/vacation'
import {
  formatVacationCategoryLabel,
  formatVacationCurrency,
  getVacationCategoryColor,
  getVacationExpenseDisplayCategory,
} from '../../utils/vacationPresentation'

type VacationExpenseSensorsProps = {
  expenses: VacationExpense[]
  onAddExpense: () => void
}

type Segment = {
  key: string
  amount: number
  color: string
  percentage: number
}

export const VacationExpenseSensors: React.FC<VacationExpenseSensorsProps> = ({
  expenses,
  onAddExpense,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const segments = useMemo<Segment[]>(() => {
    const totals = new Map<string, number>()

    expenses.forEach((expense) => {
      const displayCategory = getVacationExpenseDisplayCategory(expense)
      totals.set(displayCategory, (totals.get(displayCategory) ?? 0) + expense.amount)
    })

    const sortedCategories = [...totals.entries()].sort((left, right) => right[1] - left[1])
    const grandTotal = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0)

    return sortedCategories.map(([key, amount]) => ({
      key,
      amount,
      color: getVacationCategoryColor(key),
      percentage: grandTotal > 0 ? amount / grandTotal : 0,
    }))
  }, [expenses])

  const activeSegment =
    segments.find((segment) => segment.key === hoveredCategory) ?? segments[0] ?? null

  return (
    <section className="vacation-panel p-6 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="vacation-kicker mb-2">Expense Sensors</p>
          <h2 className="font-italiana text-[2rem] leading-none tracking-[-0.02em] text-[#f0ede8] sm:text-[2.35rem]">
            Spend Map
          </h2>
        </div>
        <button
          type="button"
          onClick={onAddExpense}
          className="vacation-action vacation-action--gold px-4 py-2.5 text-sm font-semibold"
        >
          Add Expense
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="mx-auto w-full max-w-[220px]">
          <div className="relative h-[220px] w-[220px]">
            {segments.length > 0 ? (
              <VictoryPie
                width={220}
                height={220}
                innerRadius={72}
                padAngle={2}
                animate={{ duration: 700, easing: 'expOut' }}
                colorScale={segments.map((segment) => segment.color)}
                data={segments.map((segment) => ({
                  x: segment.key,
                  y: segment.amount,
                  label: `${formatVacationCategoryLabel(segment.key)} · ${Math.round(segment.percentage * 100)}%`,
                }))}
                labels={() => null}
                labelComponent={
                  <VictoryTooltip
                    pointerLength={8}
                    cornerRadius={12}
                    style={{
                      fill: '#f0ede8',
                      fontFamily: 'DM Mono, monospace',
                      fontSize: 10,
                    }}
                    flyoutStyle={{
                      fill: 'rgba(17,17,20,0.92)',
                      stroke: 'rgba(255,255,255,0.08)',
                    }}
                  />
                }
                style={{
                  data: {
                    stroke: '#111114',
                    strokeWidth: 2,
                    opacity: ({ datum }) =>
                      hoveredCategory === null || hoveredCategory === datum.x ? 1 : 0.34,
                    cursor: 'pointer',
                  },
                }}
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onMouseEnter: () => ({ mutation: ({ datum }) => setHoveredCategory(String(datum.x)) }),
                      onMouseLeave: () => ({ mutation: () => setHoveredCategory(null) }),
                    },
                  },
                ]}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-full border border-dashed border-[rgba(255,255,255,0.08)] text-center text-sm text-[#6b6862]">
                No expenses yet
              </div>
            )}

            {activeSegment ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="vacation-kicker mb-2">Active Sensor</span>
                <span className="vacation-metric text-[1.4rem] text-[#f0ede8]">
                  {formatVacationCategoryLabel(activeSegment.key)}
                </span>
                <span className="mt-2 text-sm text-[#b8b4ae]">
                  {formatVacationCurrency(activeSegment.amount)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          {segments.length > 0 ? (
            segments.map((segment) => {
              const isActive = hoveredCategory === null ? segment === activeSegment : hoveredCategory === segment.key
              return (
                <button
                  key={segment.key}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(segment.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex w-full items-center justify-between rounded-[1rem] border px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)]'
                      : 'border-[rgba(255,255,255,0.06)] bg-[#18181c]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: segment.color, boxShadow: `0 0 14px ${segment.color}55` }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#f0ede8]">
                        {formatVacationCategoryLabel(segment.key)}
                      </div>
                      <div className="vacation-kicker mt-1 text-[0.6rem]">
                        {Math.round(segment.percentage * 100)}% of trip spend
                      </div>
                    </div>
                  </div>
                  <span className="vacation-metric text-sm text-[#b8b4ae]">
                    {formatVacationCurrency(segment.amount)}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="rounded-[1.1rem] border border-dashed border-[rgba(255,255,255,0.08)] px-5 py-8 text-center text-sm text-[#6b6862]">
              Add your first vacation expense to bring the sensor ring online.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
