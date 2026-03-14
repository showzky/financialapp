import React, { useMemo, useState, useEffect } from 'react'
import type { VacationFund, VacationExpense, VacationSummary } from '../types/vacation'
import { AddExpenseModal } from '../components/AddExpenseModal'
import { AddFundsModal } from '../components/AddFundsModal'
import { ExpenseLedger } from '../components/ExpenseLedger'
import { VacationExpenseSensors } from '../components/vacation/VacationExpenseSensors'
import { VacationSummaryCards } from '../components/vacation/VacationSummaryCards'
import { vacationApi } from '../services/vacationApi'
import { getHudAlertMessage } from '../services/backendClient'
import { calculateDailyAllowance, calculateDaysRemaining } from '../utils/vacationMath'
import { formatVacationCurrency } from '../utils/vacationPresentation'
import '@/styles/hud.css'
import '@/styles/vacation.css'

const defaultVacationDurationDays = 14

export const VacationDash: React.FC = () => {
  const [vacationFund, setVacationFund] = useState<VacationFund | null>(null)
  const [expenses, setExpenses] = useState<VacationExpense[]>([])
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<VacationExpense | undefined>()
  const [loading, setLoading] = useState(true)
  const [hudAlert, setHudAlert] = useState('')
  const [initialTargetAmount, setInitialTargetAmount] = useState('')
  const [isEditingDays, setIsEditingDays] = useState(false)
  const [isSavingDays, setIsSavingDays] = useState(false)
  const [customDaysRemaining, setCustomDaysRemaining] = useState<number | null>(null)
  const [daysInputValue, setDaysInputValue] = useState<number | ''>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vacations = await vacationApi.getVacations()
        if (vacations.length > 0) {
          const mainVacation = vacations[0]
          setVacationFund(mainVacation)
          setCustomDaysRemaining(mainVacation.durationDays ?? null)
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
        durationDays: defaultVacationDurationDays,
      })
      setVacationFund(created)
      setCustomDaysRemaining(created.durationDays ?? defaultVacationDurationDays)
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

  const handleStartEditingDays = () => {
    if (!summary) return
    setDaysInputValue(customDaysRemaining ?? summary.daysRemaining)
    setIsEditingDays(true)
  }

  const handleCancelEditingDays = () => {
    setIsEditingDays(false)
    setDaysInputValue('')
  }

  const handleCommitDays = async () => {
    if (!vacationFund || !summary) {
      handleCancelEditingDays()
      return
    }

    const parsedDays = Number(daysInputValue)
    if (!Number.isFinite(parsedDays) || parsedDays < 1) {
      setHudAlert('HUD Alert: Days tracked must be at least 1.')
      return
    }

    const roundedDays = Math.floor(parsedDays)
    if (roundedDays === (customDaysRemaining ?? summary.daysRemaining)) {
      handleCancelEditingDays()
      return
    }

    setIsSavingDays(true)
    setHudAlert('')

    try {
      const updated = await vacationApi.updateVacation(vacationFund.id, {
        durationDays: roundedDays,
      })
      setVacationFund(updated)
      setCustomDaysRemaining(updated.durationDays ?? roundedDays)
      handleCancelEditingDays()
    } catch (error) {
      setHudAlert(getHudAlertMessage(error))
    } finally {
      setIsSavingDays(false)
    }
  }

  const summary: VacationSummary | null = useMemo(() => {
    if (!vacationFund) return null

    const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0)
    const totalBudget = vacationFund.currentAmount
    const remainingBudget = totalBudget - totalSpent

    const today = new Date()
    const computedDaysRemaining = calculateDaysRemaining(
      vacationFund.startDate,
      vacationFund.endDate,
      today,
    )
    const daysRemaining = Math.max(1, customDaysRemaining ?? computedDaysRemaining)
    const dailyAllowance = calculateDailyAllowance(
      remainingBudget,
      vacationFund.startDate,
      vacationFund.endDate,
      today,
      daysRemaining,
    )
    const progressPercentage = totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      daysRemaining,
      dailyAllowance,
      progressPercentage,
    }
  }, [vacationFund, expenses, customDaysRemaining])

  const vacationExpenses = useMemo(() => {
    return expenses.filter((e) => e.isVacation)
  }, [expenses])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--app-bg)] text-white">
        <div className="hud-monospaced animate-pulse">Initializing HUD...</div>
      </div>
    )
  }

  if (!vacationFund || !summary) {
    return (
      <div className="vacation-shell flex min-h-screen items-center justify-center px-4 py-10 text-white">
        <div className="vacation-panel relative z-10 w-full max-w-2xl px-6 py-8 text-center sm:px-10 sm:py-10">
          <p className="vacation-kicker mb-3">Vacation Control Surface</p>
          <h1 className="font-italiana text-[2.6rem] leading-none tracking-[-0.03em] text-[#f0ede8] sm:text-[3.4rem]">
            Open a New Vault
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#b8b4ae] sm:text-base">
            There is no active vacation yet. Start with a funding target and the dashboard will spin up
            savings, burn rate, and expense sensors for the trip.
          </p>

          <div className="mx-auto mt-8 w-full max-w-md space-y-3 text-left">
            <label className="vacation-kicker block">Initial Target Amount (KR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={initialTargetAmount}
              onChange={(e) => setInitialTargetAmount(e.target.value)}
              className="vacation-field px-4 py-3 text-base"
              placeholder="80000"
            />
          </div>

          <div className="mx-auto mt-5 grid w-full max-w-md gap-3 sm:grid-cols-2">
            <div className="rounded-[1.1rem] border border-[rgba(255,255,255,0.06)] bg-[#18181c] p-4 text-left">
              <div className="vacation-kicker mb-2">Default duration</div>
              <div className="vacation-metric text-xl">{defaultVacationDurationDays} days</div>
            </div>
            <div className="rounded-[1.1rem] border border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.08)] p-4 text-left">
              <div className="vacation-kicker mb-2">Launch profile</div>
              <div className="vacation-metric text-xl text-[#e2c06a]">Prototype HUD</div>
            </div>
          </div>

          <input
            type="hidden"
            value={initialTargetAmount}
            readOnly
          />

          {hudAlert ? (
            <div className="mx-auto mt-4 max-w-md rounded-[1rem] border border-[rgba(201,107,107,0.28)] bg-[rgba(201,107,107,0.08)] px-4 py-3 text-left text-sm text-[#f1c3c3]">
              {hudAlert}
            </div>
          ) : null}

          <button
            onClick={createVault}
            disabled={Math.round(Number.parseFloat(initialTargetAmount || '0') * 100) <= 0}
            className="vacation-action vacation-action--gold mt-8 px-6 py-3 text-sm font-semibold"
          >
            Initialize Vault
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vacation-shell pt-10 sm:pt-12">
      <div className="fixed top-0 left-0 w-full h-[2px] bg-[var(--color-accent)]/10 shadow-[0_0_15px_var(--color-accent)_0.2)] z-[50] animate-scan" />

      <div className="relative z-10 mx-auto w-full max-w-[1380px] space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
        {hudAlert ? (
          <div className="rounded-[1.1rem] border border-[rgba(201,107,107,0.28)] bg-[rgba(201,107,107,0.08)] px-4 py-3 text-sm text-[#f1c3c3]">
            {hudAlert}
          </div>
        ) : null}
        <section className="vacation-panel px-6 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="vacation-kicker mb-2">Flow · Vacation Control Surface</p>
              <h1 className="font-italiana text-[3rem] leading-none tracking-[-0.04em] text-[#f0ede8] sm:text-[4.2rem]">
                {vacationFund.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#b8b4ae] sm:text-base">
                Track savings, daily burn, and live trip spending from a single HUD tuned for vacation planning.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.1rem] border border-[rgba(255,255,255,0.06)] bg-[#18181c] px-4 py-3">
                <div className="vacation-kicker mb-2">Saved</div>
                <div className="vacation-metric text-lg">{formatVacationCurrency(vacationFund.currentAmount)}</div>
              </div>
              <div className="rounded-[1.1rem] border border-[rgba(255,255,255,0.06)] bg-[#18181c] px-4 py-3">
                <div className="vacation-kicker mb-2">Spent</div>
                <div className="vacation-metric text-lg">{formatVacationCurrency(summary.totalSpent)}</div>
              </div>
              <div className="rounded-[1.1rem] border border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.08)] px-4 py-3">
                <div className="vacation-kicker mb-2">Target</div>
                <div className="vacation-metric text-lg text-[#e2c06a]">{formatVacationCurrency(vacationFund.targetAmount)}</div>
              </div>
            </div>
          </div>
        </section>

        <VacationSummaryCards
          summary={summary}
          targetAmount={vacationFund.targetAmount}
          currentAmount={vacationFund.currentAmount}
          daysInputValue={daysInputValue}
          isEditingDays={isEditingDays}
          isSavingDays={isSavingDays}
          onDaysInputChange={(value) => {
            if (value === '') {
              setDaysInputValue('')
              return
            }

            const numericValue = Number(value)
            if (Number.isFinite(numericValue) && numericValue >= 1) {
              setDaysInputValue(Math.floor(numericValue))
            }
          }}
          onStartEditingDays={handleStartEditingDays}
          onCommitDays={() => {
            void handleCommitDays()
          }}
          onCancelEditingDays={handleCancelEditingDays}
          onAddFunds={() => setIsAddFundsOpen(true)}
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <VacationExpenseSensors
            expenses={vacationExpenses}
            onAddExpense={() => setIsAddExpenseOpen(true)}
          />

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
        currentAmount={vacationFund.currentAmount}
        targetAmount={vacationFund.targetAmount}
        onClose={() => setIsAddFundsOpen(false)}
        onFundsAdded={handleFundsAdded}
      />
    </div>
  )
}

export default VacationDash
