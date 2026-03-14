import React from 'react'
import { Pencil, LoaderCircle } from 'lucide-react'
import { VictoryPie } from 'victory'
import type { VacationSummary } from '../../types/vacation'
import {
  formatVacationCompactCurrency,
  formatVacationCurrency,
} from '../../utils/vacationPresentation'

type VacationSummaryCardsProps = {
  summary: VacationSummary
  targetAmount: number
  currentAmount: number
  daysInputValue: number | ''
  isEditingDays: boolean
  isSavingDays: boolean
  onDaysInputChange: (value: string) => void
  onStartEditingDays: () => void
  onCommitDays: () => void
  onCancelEditingDays: () => void
  onAddFunds: () => void
}

const ringSize = 172
const ringInnerRadius = 52

const getBudgetHealthClass = (remainingBudget: number, totalBudget: number): string => {
  if (remainingBudget < 0) return 'vacation-status-badge vacation-status-badge--danger'
  if (totalBudget > 0 && remainingBudget / totalBudget < 0.2) {
    return 'vacation-status-badge vacation-status-badge--warning'
  }
  return 'vacation-status-badge vacation-status-badge--healthy'
}

export const VacationSummaryCards: React.FC<VacationSummaryCardsProps> = ({
  summary,
  targetAmount,
  currentAmount,
  daysInputValue,
  isEditingDays,
  isSavingDays,
  onDaysInputChange,
  onStartEditingDays,
  onCommitDays,
  onCancelEditingDays,
  onAddFunds,
}) => {
  const savedProgress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0
  const spentPercentage = summary.totalBudget > 0 ? Math.min((summary.totalSpent / summary.totalBudget) * 100, 100) : 0
  const remainingRatio = summary.totalBudget > 0 ? Math.max(summary.remainingBudget / summary.totalBudget, 0) : 0
  const dailyBudgetLeft = summary.daysRemaining > 0 ? Math.max(Math.floor(summary.remainingBudget / summary.daysRemaining), 0) : 0

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.12fr_0.9fr_1fr]">
      <section className="vacation-panel p-6 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="vacation-kicker mb-2">Ferie Tank / Savings</p>
            <h2 className="font-italiana text-[2rem] leading-none tracking-[-0.02em] text-[#f0ede8] sm:text-[2.4rem]">
              Vault Status
            </h2>
          </div>
          <span className="vacation-status-badge vacation-status-badge--healthy">
            {Math.round(savedProgress)}% funded
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[190px_1fr] lg:items-center">
          <div className="relative mx-auto h-[172px] w-[172px]">
            <VictoryPie
              width={ringSize}
              height={ringSize}
              innerRadius={ringInnerRadius}
              startAngle={-90}
              endAngle={270}
              animate={{ duration: 700, easing: 'expOut' }}
              data={[
                { x: 'saved', y: Math.max(savedProgress, 0.0001), color: '#5ba3c9' },
                { x: 'remaining', y: Math.max(100 - savedProgress, 0), color: '#2a2a32' },
              ]}
              labels={() => null}
              style={{
                data: {
                  fill: ({ datum }) => datum.color,
                  stroke: '#111114',
                  strokeWidth: 2,
                },
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="vacation-kicker mb-2">Saved</span>
              <span className="vacation-metric text-[1.6rem] sm:text-[1.85rem]">
                {formatVacationCompactCurrency(currentAmount)}
              </span>
              <span className="mt-2 text-[0.72rem] uppercase tracking-[0.14em] text-[#6b6862]">
                Goal {formatVacationCompactCurrency(targetAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="vacation-kicker mb-2">Total saved</p>
              <div className="vacation-metric text-[2.3rem] sm:text-[2.7rem]">
                {formatVacationCurrency(currentAmount)}
              </div>
              <p className="mt-2 text-sm text-[#b8b4ae]">
                Target {formatVacationCurrency(targetAmount)} with {Math.round(savedProgress)}% of the trip fund ready.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[#6b6862]">
                <span>Funding runway</span>
                <span>{Math.round(savedProgress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#202026]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#5ba3c9_0%,#5ebd97_100%)] transition-[width] duration-500"
                  style={{ width: `${savedProgress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onAddFunds}
              className="vacation-action vacation-action--sky px-4 py-2.5 text-sm font-semibold"
            >
              Add Funds
            </button>
          </div>
        </div>
      </section>

      <section className="vacation-panel p-6 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="vacation-kicker mb-2">Daily Allowance</p>
            <h2 className="font-italiana text-[2rem] leading-none tracking-[-0.02em] text-[#f0ede8] sm:text-[2.25rem]">
              Burn Rate
            </h2>
          </div>
          <span className={getBudgetHealthClass(summary.remainingBudget, summary.totalBudget)}>
            {summary.remainingBudget < 0 ? 'Over budget' : 'Nominal'}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <p className="vacation-kicker mb-2">Projected daily</p>
            <div className="vacation-metric text-[2.5rem] leading-none text-[#f0ede8] [text-shadow:0_0_18px_rgba(91,163,201,0.16)]">
              {formatVacationCurrency(Math.floor(summary.dailyAllowance))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.1rem] border border-[rgba(255,255,255,0.06)] bg-[#18181c] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="vacation-kicker">Days tracked</span>
                {isSavingDays ? <LoaderCircle className="h-4 w-4 animate-spin text-[#8fc6e1]" /> : null}
              </div>
              {isEditingDays ? (
                <input
                  type="number"
                  min={1}
                  value={daysInputValue}
                  onChange={(event) => onDaysInputChange(event.target.value)}
                  onBlur={onCommitDays}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onCommitDays()
                    }

                    if (event.key === 'Escape') {
                      event.preventDefault()
                      onCancelEditingDays()
                    }
                  }}
                  className="vacation-field w-24 px-3 py-2 font-['DM_Mono',monospace] text-lg"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={onStartEditingDays}
                  className="flex items-center gap-2 text-left"
                >
                  <span className="vacation-metric text-[2rem] leading-none">{summary.daysRemaining}</span>
                  <Pencil className="h-4 w-4 text-[#6b6862]" />
                </button>
              )}
            </div>

            <div className="rounded-[1.1rem] border border-[rgba(94,189,151,0.18)] bg-[rgba(94,189,151,0.08)] p-4">
              <span className="vacation-kicker mb-2 block">Per day left</span>
              <div className="vacation-metric text-[1.8rem] leading-none text-[#7ad1ad]">
                {summary.remainingBudget < 0 ? '—' : formatVacationCurrency(dailyBudgetLeft)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="vacation-panel p-6 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="vacation-kicker mb-2">Budget Remaining</p>
            <h2 className="font-italiana text-[2rem] leading-none tracking-[-0.02em] text-[#f0ede8] sm:text-[2.25rem]">
              Pocket View
            </h2>
          </div>
          <span className={getBudgetHealthClass(summary.remainingBudget, summary.totalBudget)}>
            {Math.round(remainingRatio * 100)}% left
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <p className="vacation-kicker mb-2">Remaining</p>
            <div
              className={`vacation-metric text-[2.4rem] leading-none ${summary.remainingBudget < 0 ? 'text-[#df9b9b]' : 'text-[#f0ede8]'}`}
            >
              {summary.remainingBudget < 0 ? '-' : ''}
              {formatVacationCurrency(Math.abs(summary.remainingBudget))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[#6b6862]">
              <span>Spent versus vault</span>
              <span>{Math.round(spentPercentage)}% used</span>
            </div>
            <div className="h-2 rounded-full bg-[#202026]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${spentPercentage}%`,
                  background:
                    summary.remainingBudget < 0
                      ? '#c96b6b'
                      : spentPercentage > 80
                        ? '#d4874a'
                        : 'linear-gradient(90deg,#5ebd97_0%,#5ba3c9_100%)',
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.1rem] border border-[rgba(255,255,255,0.06)] bg-[#18181c] p-4">
              <span className="vacation-kicker mb-2 block">Total budget</span>
              <div className="vacation-metric text-xl">{formatVacationCurrency(summary.totalBudget)}</div>
            </div>
            <div className="rounded-[1.1rem] border border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.08)] p-4">
              <span className="vacation-kicker mb-2 block">Target horizon</span>
              <div className="vacation-metric text-xl text-[#e2c06a]">
                {formatVacationCurrency(targetAmount)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
