import React, { useMemo, useState, useEffect } from 'react'
import type { VacationFund, VacationExpense, VacationSummary } from '../types/vacation'
import { AddExpenseModal } from '../components/AddExpenseModal'
import { AddFundsModal } from '../components/AddFundsModal'
import { SurplusSensor } from '../components/SurplusSensor'
import { ExpenseLedger } from '../components/ExpenseLedger'
import { vacationApi } from '../services/vacationApi'
import { getHudAlertMessage } from '../services/backendClient'
import '@/styles/hud.css'

export const VacationDash: React.FC = () => {
  const [vacationFund, setVacationFund] = useState<VacationFund | null>(null)
  const [expenses, setExpenses] = useState<VacationExpense[]>([])
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<VacationExpense | undefined>()
  const [loading, setLoading] = useState(true)
  const [hudAlert, setHudAlert] = useState('')
  const [initialTargetAmount, setInitialTargetAmount] = useState('')
  // days remaining override/editor state
  const [isEditingDays, setIsEditingDays] = useState(false)
  const [customDaysRemaining, setCustomDaysRemaining] = useState<number | null>(null)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vacations = await vacationApi.getVacations()
        if (vacations.length > 0) {
          const mainVacation = vacations[0]
          setVacationFund(mainVacation)
          if (mainVacation.durationDays !== undefined) {
            setCustomDaysRemaining(mainVacation.durationDays)
          }
          const expenseData = await vacationApi.getExpenses(mainVacation.id)
          setExpenses(expenseData)
        }
      } catch (error) {
        setHudAlert(getHudAlertMessage(error))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const createVault = async () => {
    const targetAmountInCents = Math.round(Number.parseFloat(initialTargetAmount || '0') * 100)
    if (!Number.isFinite(targetAmountInCents) || targetAmountInCents <= 0) {
      setHudAlert('HUD Alert: Target amount must be greater than 0.')
      return
    }

    setLoading(true)
    setHudAlert('')
    try {
      // minimal default dates: today til two weeks
      const today = new Date().toISOString().split('T')[0]
      const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const created = await vacationApi.createVacation({
        name: 'New Vacation',
        targetAmount: targetAmountInCents,
        startDate: today,
        endDate: twoWeeks,
      })
      setVacationFund(created)
      setExpenses([])
      setInitialTargetAmount('')
    } catch (err) {
      setHudAlert(getHudAlertMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseAdded = (expense: VacationExpense) => {
    if (editingExpense) {
      // Update existing
      setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)))
      setEditingExpense(undefined)
    } else {
      // Add new
      setExpenses((prev) => [...prev, expense])
    }
  }

  const handleExpenseDeleted = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const handleEditExpense = (expense: VacationExpense) => {
    setEditingExpense(expense)
    setIsAddExpenseOpen(true)
  }

  const handleFundsAdded = (fund: VacationFund) => {
    setVacationFund(fund)
  }
  const summary: VacationSummary | null = useMemo(() => {
    if (!vacationFund) return null

    const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0)
    const totalBudget = vacationFund.currentAmount
    const remainingBudget = totalBudget - totalSpent

    const today = new Date()
    const end = new Date(vacationFund.endDate)
    const diffTime = Math.max(0, end.getTime() - today.getTime())
    let daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    // allow user override from inline editor
    if (customDaysRemaining !== null) {
      daysRemaining = customDaysRemaining
    }

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      daysRemaining,
      dailyAllowance: remainingBudget / daysRemaining,
      progressPercentage: (remainingBudget / totalBudget) * 100,
    }
  }, [vacationFund, expenses, customDaysRemaining])

  // Chart calculations & custom category extraction
  const extractCategoryName = (description?: string | null) => {
    if (!description) return null
    const m = description.match(/^\[Custom Category:\s*(.+?)\]/)
    return m ? m[1].trim() : null
  }

  // Ensure base filter: is_vacation === true
  const vacationExpenses = useMemo(() => {
    return expenses.filter((e) => ((e as any).is_vacation ?? true) === true)
  }, [expenses])

  // Keep domain type strict while allowing custom labels for charting
  const displayExpenses = useMemo(() => {
    return vacationExpenses.map((e) => ({
      ...e,
      displayCategory:
        e.category === 'miscellaneous' ? (extractCategoryName(e.description) ?? e.category) : e.category,
    }))
  }, [vacationExpenses])

  const chartData = useMemo(() => {
    const priority = ['flights', 'food', 'hotel']
    const categoriesInData = Array.from(new Set(displayExpenses.map((d) => d.displayCategory)))

    const categories = [
      ...priority.filter((p) => categoriesInData.includes(p)),
      ...categoriesInData.filter((c) => !priority.includes(c)),
    ]

    const totals = categories.map((cat) =>
      displayExpenses.filter((e) => e.displayCategory === cat).reduce((a, b) => a + b.amount, 0),
    )
    const grandTotal = totals.reduce((a, b) => a + b, 0) || 1

    const circumference = 2 * Math.PI * 40
    let currentOffset = 62.8

    return categories.map((cat, i) => {
      const percentage = totals[i] / grandTotal
      const dashArray = `${percentage * circumference} ${circumference}`
      const offset = currentOffset
      currentOffset -= percentage * circumference
      return { cat, dashArray, offset, percentage, total: totals[i] }
    })
  }, [displayExpenses])

  const formatCategoryLabel = (category: string): string => {
    return category
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getCategoryStrokeClass = (category: string): string => {
    if (category === 'flights') return 'stroke-pink-400'
    if (category === 'food') return 'stroke-yellow-400'
    if (category === 'hotel') return 'stroke-emerald-400'
    return 'stroke-gray-400'
  }

  const getCategoryDotClass = (category: string): string => {
    if (category === 'flights') return 'bg-pink-400'
    if (category === 'food') return 'bg-yellow-400'
    if (category === 'hotel') return 'bg-emerald-400'
    return 'bg-gray-400'
  }

  const activeTooltipSegment = useMemo(() => {
    if (chartData.length === 0) return null
    return chartData.find((segment) => segment.cat === hoveredCategory) ?? chartData[0]
  }, [chartData, hoveredCategory])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--app-bg)] text-white">
        <div className="hud-monospaced animate-pulse">Initializing HUD...</div>
      </div>
    )
  }

  if (!vacationFund || !summary) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[var(--app-bg)] text-white p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No Active Vacation Found</h2>
        <p className="text-[var(--color-text-muted)] mb-6">
          Create a vacation vault to start tracking filters.
        </p>
        <div className="mb-4 w-full max-w-sm space-y-2 text-left">
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            Initial Target Amount (KR)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={initialTargetAmount}
            onChange={(e) => setInitialTargetAmount(e.target.value)}
            className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted"
            placeholder="0.00"
          />
          {hudAlert ? (
            <div className="glass-panel border border-red-400/30 px-3 py-2 text-xs text-red-200">
              {hudAlert}
            </div>
          ) : null}
        </div>
        <button
          onClick={createVault}
          disabled={Math.round(Number.parseFloat(initialTargetAmount || '0') * 100) <= 0}
          className="glass-panel px-6 py-3 font-bold hover:bg-white/10"
        >
          Initialize Vault
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pt-12 overflow-hidden bg-[var(--app-bg)]">
      {/* HUD Scanline */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-[var(--color-accent)]/10 shadow-[0_0_15px_var(--color-accent)_0.2)] z-[50] animate-scan" />

      <div className="vacation-hud-grid relative z-10 mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {hudAlert ? (
          <div className="obsidian-subpanel border border-[rgba(201,107,107,0.28)] bg-[rgba(201,107,107,0.08)] px-4 py-3 text-sm text-[#f1c3c3]">
            {hudAlert}
          </div>
        ) : null}
        {/* Top Row Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Ferie Tank / Savings */}
          <div className="obsidian-card group">
            <div className="mb-6 flex items-center gap-2">
              <span className="obsidian-dot" />
              <h3 className="obsidian-kicker m-0">
                Ferie Tank / Savings
              </h3>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <svg className="hud-chart-svg" viewBox="0 0 100 100">
                <circle className="hud-chart-circle hud-chart-bg" cx="50" cy="50" r="45" />
                <circle
                  className="hud-chart-circle hud-chart-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: '283',
                    strokeDashoffset: `${283 - (283 * summary.progressPercentage) / 100}`,
                  }}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.14em] text-[#6b6862]">
                  Total Saved
                </span>
                <span className="obsidian-metric block text-[1.9rem]">
                  <span className="hud-currency">KR</span>
                  {(summary.totalBudget / 100).toFixed(0)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setIsAddFundsOpen(true)}
                className="obsidian-button obsidian-button--gold px-4 py-2 text-sm font-semibold"
              >
                Add Funds
              </button>
            </div>
          </div>

          {/* Daily Allowance */}
          <div className="obsidian-card">
            <div className="mb-6 flex items-center gap-2">
              <span className="obsidian-dot animate-pulse-slow bg-[#5ba3c9]" />
              <h3 className="obsidian-kicker m-0">
                Daily Allowance
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.14em] text-[#6b6862]">
                  Projected Daily
                </span>
                <span className="obsidian-metric block text-[2rem] [text-shadow:0_0_18px_rgba(91,163,201,0.22)]">
                  <span className="hud-currency">KR</span>
                  {Math.floor(summary.dailyAllowance / 100)}
                </span>
              </div>

              <div className="mt-6 flex justify-between border-t border-[rgba(255,255,255,0.08)] pt-4">
                <div className="flex flex-col">
                  <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.14em] text-[#6b6862]">
                    Days
                  </span>
                  <div className="flex items-center">
                    {isEditingDays ? (
                      <input
                        type="number"
                        min={1}
                        value={customDaysRemaining ?? summary.daysRemaining}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (Number.isFinite(val) && val >= 1) {
                            setCustomDaysRemaining(val)
                          }
                        }}
                        onBlur={() => setIsEditingDays(false)}
                        className="obsidian-field w-16 px-2 py-1 text-sm appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                      />
                    ) : (
                      <>
                        <span className="obsidian-metric text-xl text-[#f0ede8]">
                          {summary.daysRemaining}
                        </span>
                        <button
                          onClick={() => {
                            setCustomDaysRemaining(summary.daysRemaining)
                            setIsEditingDays(true)
                          }}
                          className="ml-2 text-[#6b6862] transition-colors hover:text-[#f0ede8]"
                          aria-label="Edit days remaining"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 11l6-6m-6 6l-3 3v3h3l3-3"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.14em] text-[#6b6862]">
                    Health
                  </span>
                  <span className="obsidian-metric text-[0.8rem] text-[#5ebd97]">NOMINAL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Surplus Sensor */}
          <div className="h-full">
            <SurplusSensor totalPocketMoney={summary.remainingBudget} />
          </div>
        </div>

        {/* Expense sensors & Ledger Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Expense Sensors (Internal chart data) */}
          <div className="obsidian-panel p-6">
            <div className="mb-6 flex items-center gap-2">
              <span className="obsidian-dot" />
              <h3 className="obsidian-kicker m-0">
                Expense Sensors
              </h3>
            </div>

            <div className="relative flex flex-col items-center">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <svg className="hud-chart-svg w-32 h-32" viewBox="0 0 100 100">
                    {chartData.map((seg) => (
                      <circle
                        key={seg.cat}
                        className={`hud-chart-circle hud-segment ${getCategoryStrokeClass(seg.cat)}`}
                        cx="50"
                        cy="50"
                        r="40"
                        onMouseEnter={() => setHoveredCategory(seg.cat)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        aria-label={`${formatCategoryLabel(seg.cat)}: KR ${Math.floor(seg.total / 100)} (${Math.round(seg.percentage * 100)}%)`}
                        style={{
                          strokeDasharray: seg.dashArray,
                          strokeDashoffset: seg.offset,
                        }}
                      />
                    ))}
                  </svg>
                </div>

                <div className="space-y-2">
                  {activeTooltipSegment ? (
                    <div className="obsidian-pill px-3 py-2 text-[0.7rem] text-[#f0ede8]">
                      {`${formatCategoryLabel(activeTooltipSegment.cat)}: ${(
                        activeTooltipSegment.percentage * 100
                      ).toFixed(1)}% / KR ${Math.floor(activeTooltipSegment.total / 100)}`}
                    </div>
                  ) : null}
                  {chartData.map((seg) => (
                    <div
                      key={seg.cat}
                      className="flex items-center gap-2 text-[0.7rem] text-[#b8b4ae]"
                      onMouseEnter={() => setHoveredCategory(seg.cat)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${getCategoryDotClass(seg.cat)}`}
                      />
                      {formatCategoryLabel(seg.cat)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="obsidian-button obsidian-button--gold px-4 py-2 text-sm font-semibold"
              >
                Add Expense
              </button>
            </div>
          </div>

          {/* Expense Ledger */}
          <div className="w-full">
            <ExpenseLedger
              expenses={vacationExpenses}
              vacationId={vacationFund.id}
              onExpenseDeleted={handleExpenseDeleted}
              onEditExpense={handleEditExpense}
            />
          </div>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        vacationId={vacationFund!.id}
        onClose={() => {
          setIsAddExpenseOpen(false)
          setEditingExpense(undefined)
        }}
        onExpenseAdded={handleExpenseAdded}
        expenseToEdit={editingExpense}
      />

      <AddFundsModal
        isOpen={isAddFundsOpen}
        vacationId={vacationFund.id}
        onClose={() => setIsAddFundsOpen(false)}
        onFundsAdded={handleFundsAdded}
      />
    </div>
  )
}

export default VacationDash
