import { Link } from 'react-router-dom'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { AddCategoryModal } from '@/components/AddCategoryModal'
import { BudgetCategoryCard } from '@/components/BudgetCategoryCard'
import { RecurringAutomationToast } from '@/components/RecurringAutomationToast'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { UpdateIncomeModal } from '@/components/UpdateIncomeModal'
import type { BudgetCategory, BudgetCategoryType } from '@/types/budget'
import type { LoanSummary } from '@/types/loan'
import { useBudgets } from '@/hooks/useBudgets'
import { useRecurringAutomation } from '@/hooks/useRecurringAutomation'
import { loanApi } from '@/services/loanApi'
import { themePresets } from '@/styles/themePresets'
import { formatCurrency } from '@/utils/currency'
import { useTheme } from '@/context/ThemeContext'

const findCategoryByKeywords = (categories: BudgetCategory[], keywords: string[]) =>
  categories.find((category) => {
    const name = category.name.toLowerCase()
    return keywords.some((keyword) => name.includes(keyword))
  })

const getBudgetPressure = (category?: BudgetCategory) => {
  if (!category || category.type !== 'budget' || category.allocated <= 0) {
    return {
      title: 'No pressure',
      toneClass: 'bg-[rgba(var(--accent-rgb),0.12)] text-accent',
      meta: 'No active category pressure yet',
      rate: 0,
      categoryName: 'Telemetry pending',
      left: 0,
      spent: 0,
    }
  }

  const rate = Math.min(category.spent / Math.max(category.allocated, 1), 1)

  if (rate >= 0.8) {
    return {
      title: 'High pressure',
      toneClass: 'bg-red-500/10 text-red-300',
      meta: `${Math.round(rate * 100)}% used`,
      rate,
      categoryName: category.name,
      left: Math.max(category.allocated - category.spent, 0),
      spent: category.spent,
    }
  }

  if (rate >= 0.45) {
    return {
      title: 'Watch',
      toneClass: 'bg-amber-400/10 text-amber-200',
      meta: `${Math.round(rate * 100)}% used`,
      rate,
      categoryName: category.name,
      left: Math.max(category.allocated - category.spent, 0),
      spent: category.spent,
    }
  }

  return {
    title: 'Low',
    toneClass: 'bg-emerald-400/10 text-emerald-200',
    meta: `${Math.round(rate * 100)}% used`,
    rate,
    categoryName: category.name,
    left: Math.max(category.allocated - category.spent, 0),
    spent: category.spent,
  }
}

export const Home = () => {
  const {
    state,
    totals,
    addCategory,
    updateIncome,
    updateCategoryAmounts,
    removeCategory,
    reorderCategories,
    resetDashboard,
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
  } = useBudgets()

  const { selectedPresetId } = useTheme()
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null)
  const [isLoanSummaryLoading, setIsLoanSummaryLoading] = useState(true)
  const [loanSummaryError, setLoanSummaryError] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState<'KR' | '$' | '€'>('KR')
  const [defaultCategoryType, setDefaultCategoryType] = useState<BudgetCategoryType>('budget')
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const budgetSortableRef = useRef<HTMLElement | null>(null)
  const fixedSortableRef = useRef<HTMLElement | null>(null)
  const sortableInstancesRef = useRef<Sortable[]>([])
  const { automationMessage, clearAutomationMessage } = useRecurringAutomation()

  const budgetCategories = useMemo(
    () => state.categories.filter((category) => category.type === 'budget'),
    [state.categories],
  )
  const fixedCategories = useMemo(
    () => state.categories.filter((category) => category.type === 'fixed'),
    [state.categories],
  )
  const freeCash = Math.max(state.income - totals.allocated, 0)
  const fixedCommitted = fixedCategories.reduce((sum, category) => sum + category.allocated, 0)
  const averageDailySafeSpend = Math.round(freeCash / 30)
  const allocationRate = state.income > 0 ? Math.round((totals.allocated / state.income) * 100) : 0

  const budgetPressure = useMemo(() => {
    const priorityCategory =
      findCategoryByKeywords(budgetCategories, ['food', 'mat', 'fuel', 'drivstoff', 'fun']) ??
      [...budgetCategories].sort((left, right) => {
        const leftRate = left.allocated === 0 ? 0 : left.spent / left.allocated
        const rightRate = right.allocated === 0 ? 0 : right.spent / right.allocated
        return rightRate - leftRate
      })[0]

    return getBudgetPressure(priorityCategory)
  }, [budgetCategories])

  const pocketHealth = useMemo(() => {
    if (freeCash >= Math.max(state.income * 0.18, 2500)) {
      return {
        title: 'Stable',
        toneClass: 'bg-emerald-400/10 text-emerald-200',
        meta: `Safe daily spend: ${formatCurrency(averageDailySafeSpend, currencySymbol)}`,
      }
    }

    if (freeCash >= Math.max(state.income * 0.08, 1000)) {
      return {
        title: 'Watch',
        toneClass: 'bg-amber-400/10 text-amber-200',
        meta: `Buffer remaining: ${formatCurrency(freeCash, currencySymbol)}`,
      }
    }

    return {
      title: 'Tight',
      toneClass: 'bg-red-500/10 text-red-300',
      meta: `Only ${formatCurrency(freeCash, currencySymbol)} unassigned`,
    }
  }, [averageDailySafeSpend, currencySymbol, freeCash, state.income])

  const fixedLoad = useMemo(() => {
    const fixedRate = state.income > 0 ? fixedCommitted / state.income : 0

    if (fixedRate >= 0.45) {
      return {
        title: 'Heavy',
        toneClass: 'bg-red-500/10 text-red-300',
        meta: `${Math.round(fixedRate * 100)}% of income committed`,
      }
    }

    if (fixedRate >= 0.25) {
      return {
        title: 'Watch',
        toneClass: 'bg-amber-400/10 text-amber-200',
        meta: `${Math.round(fixedRate * 100)}% of income committed`,
      }
    }

    return {
      title: 'Light',
      toneClass: 'bg-[rgba(var(--accent-rgb),0.12)] text-accent',
      meta: `${Math.round(fixedRate * 100)}% of income committed`,
    }
  }, [fixedCommitted, state.income])

  const loanRisk = useMemo(() => {
    if ((loanSummary?.overdueCount ?? 0) > 0) {
      return {
        title: 'High',
        toneClass: 'bg-red-500/10 text-red-300',
        meta: `${loanSummary?.overdueCount ?? 0} overdue right now`,
      }
    }

    if ((loanSummary?.dueSoonCount ?? 0) > 0) {
      return {
        title: 'Medium',
        toneClass: 'bg-amber-400/10 text-amber-200',
        meta: `${loanSummary?.dueSoonCount ?? 0} due soon this cycle`,
      }
    }

    return {
      title: isLoanSummaryLoading ? 'Loading' : 'Low',
      toneClass: 'bg-emerald-400/10 text-emerald-200',
      meta: isLoanSummaryLoading ? 'Checking active loans' : 'No urgent loan follow-up',
    }
  }, [isLoanSummaryLoading, loanSummary])

  const telemetryRows = useMemo(
    () =>
      [...budgetCategories]
        .sort((left, right) => {
          const leftRate = left.allocated === 0 ? 0 : left.spent / left.allocated
          const rightRate = right.allocated === 0 ? 0 : right.spent / right.allocated
          return rightRate - leftRate
        })
        .slice(0, 3)
        .map((category) => {
          const pressure = getBudgetPressure(category)
          return {
            id: category.id,
            name: category.name,
            spent: category.spent,
            left: Math.max(category.allocated - category.spent, 0),
            rate: pressure.rate,
            title: pressure.title,
            toneClass: pressure.toneClass,
          }
        }),
    [budgetCategories],
  )

  const getOrderedIdsFromRef = (container: HTMLElement | null) =>
    container
      ? Array.from(container.querySelectorAll<HTMLElement>('[data-category-id]'))
          .map((item) => item.dataset.categoryId)
          .filter((id): id is string => Boolean(id))
      : []

  const syncOrderFromDom = useCallback(() => {
    const budgetIds = getOrderedIdsFromRef(budgetSortableRef.current)
    const fixedIds = getOrderedIdsFromRef(fixedSortableRef.current)
    const knownIds = new Set([...budgetIds, ...fixedIds])
    const remainingIds = state.categories
      .map((category) => category.id)
      .filter((id) => !knownIds.has(id))
    const orderedIds = [...budgetIds, ...fixedIds, ...remainingIds]

    if (orderedIds.length) {
      reorderCategories(orderedIds)
    }
  }, [reorderCategories, state.categories])

  useEffect(() => {
    sortableInstancesRef.current.forEach((instance) => instance.destroy())
    sortableInstancesRef.current = []

    if (!isEditing) {
      return
    }

    ;[budgetSortableRef.current, fixedSortableRef.current].forEach((container) => {
      if (!container) {
        return
      }

      const instance = Sortable.create(container, {
        animation: 300,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: false,
        onEnd: () => {
          syncOrderFromDom()
        },
      })

      sortableInstancesRef.current.push(instance)
    })

    return () => {
      sortableInstancesRef.current.forEach((instance) => instance.destroy())
      sortableInstancesRef.current = []
    }
  }, [isEditing, syncOrderFromDom])

  useEffect(() => {
    let isMounted = true

    const loadLoanSummary = async () => {
      try {
        const summary = await loanApi.getSummary()
        if (!isMounted) return
        setLoanSummary(summary)
        setLoanSummaryError('')
      } catch (error) {
        if (!isMounted) return
        setLoanSummaryError(error instanceof Error ? error.message : 'Could not load loan summary')
      } finally {
        if (isMounted) {
          setIsLoanSummaryLoading(false)
        }
      }
    }

    void loadLoanSummary()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isSettingsOpen) return

    const scrollY = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousLeft = document.body.style.left
    const previousRight = document.body.style.right
    const previousWidth = document.body.style.width
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.left = previousLeft
      document.body.style.right = previousRight
      document.body.style.width = previousWidth
      document.body.style.paddingRight = previousPaddingRight
      window.scrollTo({ top: scrollY })
    }
  }, [isSettingsOpen])

  const handleDeleteCategory = (id: string) => {
    setDeletingCategoryId(id)
    window.setTimeout(() => {
      removeCategory(id)
      setDeletingCategoryId(null)
    }, 220)
  }

  const handleDoneEditing = () => {
    syncOrderFromDom()
    setIsEditing(false)
  }

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      state,
      settings: {
        themePresetId: selectedPresetId,
        currencySymbol,
        defaultCategoryType,
      },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `budget-dashboard-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleResetDashboard = () => {
    resetDashboard()
    setIsEditing(false)
  }

  return (
    <div className={isEditing ? 'editing-mode' : ''}>
      {/* ── PAGE HEADER ── */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#c9a84c] opacity-80">
            Financial Budget Tracker
          </p>
          <h1 className="font-italiana text-[clamp(36px,5vw,52px)] leading-none tracking-[-0.01em] text-text-primary">
            {state.month}
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6b6862]">Andre sin finance tracker</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-transparent px-[18px] py-2.5 text-[12px] font-semibold tracking-[0.04em] text-[#b8b4ae] transition hover:border-[rgba(255,255,255,0.16)] hover:bg-[#18181c] hover:text-text-primary"
          >
            {isEditing ? 'Stop Editing' : 'Edit Layout'}
          </button>
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#c9a84c] bg-[#c9a84c] px-[18px] py-2.5 text-[12px] font-semibold tracking-[0.04em] text-[#0a0a0b] transition hover:bg-[#e2c06a] hover:border-[#e2c06a]"
          >
            + Add Category
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex cursor-pointer items-center rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-transparent px-3 py-2.5 text-[15px] leading-none text-[#6b6862] transition hover:border-[rgba(255,255,255,0.16)] hover:text-[#b8b4ae]"
            aria-label="Settings"
          >
            ⚙
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={handleDoneEditing}
              className="inline-flex cursor-pointer items-center rounded-[10px] border border-[rgba(94,189,151,0.3)] bg-[rgba(94,189,151,0.10)] px-[18px] py-2.5 text-[12px] font-semibold text-[#5ebd97] transition hover:bg-[rgba(94,189,151,0.16)]"
            >
              Done
            </button>
          ) : null}
        </div>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Income */}
        <button
          type="button"
          onClick={() => setIsIncomeModalOpen(true)}
          className="relative overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-[22px_24px] text-left transition hover:-translate-y-px hover:border-[rgba(255,255,255,0.10)]"
        >
          <span className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
          <p className="mb-3.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6862]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
            Monthly Income
          </p>
          <p className="font-italiana mb-2 text-[42px] leading-none tracking-[-0.01em] text-[#e2c06a]">
            {formatCurrency(state.income, currencySymbol)}
          </p>
          <p className="text-[12px] text-[#6b6862] transition hover:text-[#b8b4ae]">Tap to update</p>
        </button>

        {/* Allocated */}
        <div className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-[22px_24px] transition hover:-translate-y-px hover:border-[rgba(255,255,255,0.10)]">
          <p className="mb-3.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6862]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5ba3c9] shadow-[0_0_8px_rgba(91,163,201,0.6)]" />
            Allocated
          </p>
          <p className="font-italiana mb-2 text-[42px] leading-none tracking-[-0.01em] text-text-primary">
            {formatCurrency(totals.allocated, currencySymbol)}
          </p>
          <p className="text-[12px] text-[#6b6862]">{allocationRate}% of income assigned</p>
        </div>

        {/* Free to Assign */}
        <div className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-[22px_24px] transition hover:-translate-y-px hover:border-[rgba(255,255,255,0.10)]">
          <p className="mb-3.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6862]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5ebd97] shadow-[0_0_8px_rgba(94,189,151,0.6)]" />
            Free to Assign
          </p>
          <p className="font-italiana mb-2 text-[42px] leading-none tracking-[-0.01em] text-[#5ebd97]">
            {formatCurrency(freeCash, currencySymbol)}
          </p>
          <p className="text-[12px] font-medium text-[#5ebd97]">Before savings goals</p>
        </div>
      </div>

      {/* ── CASH FLOW SNAPSHOT ── */}
      <div className="mb-3.5 rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-[22px_24px]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6862]">
              Cash Flow Snapshot
            </p>
            <p className="font-italiana text-[26px] leading-none tracking-[-0.01em] text-text-primary">
              {formatCurrency(freeCash, currencySymbol)} left to allocate
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[10px] border border-[rgba(91,163,201,0.2)] bg-[rgba(91,163,201,0.10)] px-3 py-1.5 font-['DM_Mono',monospace] text-[11px] font-medium tracking-[0.04em] text-[#5ba3c9]">
              Spent {formatCurrency(totals.spent, currencySymbol)}
            </span>
            <span className="rounded-[10px] border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.10)] px-3 py-1.5 font-['DM_Mono',monospace] text-[11px] font-medium tracking-[0.04em] text-[#e2c06a]">
              Planned {formatCurrency(totals.allocated, currencySymbol)}
            </span>
          </div>
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full bg-[#202026]">
          <span
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#e2c06a] opacity-35 transition-[width] duration-700"
            style={{ width: `${Math.min(allocationRate, 100)}%` }}
          />
          <span
            className="absolute left-0 top-0 h-full rounded-full bg-[#5ba3c9] shadow-[0_0_12px_rgba(91,163,201,0.4)] transition-[width] duration-700"
            style={{
              width: `${totals.allocated > 0 ? Math.min((totals.spent / totals.allocated) * 100, 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* ── LOANS PANEL ── */}
      <div className="mb-7 rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-[22px_24px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6862]">
              Loans Given
            </p>
            <p className="font-italiana text-[28px] leading-none tracking-[-0.01em] text-text-primary">
              {loanSummary
                ? `${formatCurrency(loanSummary.totalOutstandingAmount, currencySymbol)} outstanding`
                : isLoanSummaryLoading
                  ? 'Loading...'
                  : '--'}
            </p>
            {!isLoanSummaryLoading && loanSummaryError ? (
              <p className="mt-1 text-[12px] text-[#c96b6b]">{loanSummaryError}</p>
            ) : null}
          </div>
          <Link
            to="/loans"
            className="inline-flex items-center rounded-[10px] border border-[rgba(91,163,201,0.25)] bg-transparent px-4 py-2.5 text-[12px] font-semibold text-[#5ba3c9] transition hover:bg-[rgba(91,163,201,0.08)]"
          >
            Open Loan Area →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Active', value: loanSummary?.activeCount ?? 0, tone: '' },
            { label: 'Due Soon', value: loanSummary?.dueSoonCount ?? 0, tone: 'text-[#e2c06a]' },
            { label: 'Overdue', value: loanSummary?.overdueCount ?? 0, tone: 'text-[#c96b6b]' },
            { label: 'Repaid', value: loanSummary?.repaidCount ?? 0, tone: 'text-[#5ebd97]' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] p-[16px_18px] transition hover:border-[rgba(255,255,255,0.10)]"
            >
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b6862]">
                {item.label}
              </p>
              <p className={`font-italiana text-[34px] leading-none text-text-primary ${item.tone}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BUDGET CATEGORIES ── */}
      <div className="mb-5 flex items-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6862]">
          Budget Categories
        </span>
        <span className="h-px flex-1 bg-[rgba(255,255,255,0.055)]" />
        <span className="rounded-full border border-[rgba(255,255,255,0.055)] bg-transparent px-3 py-1 font-['DM_Mono',monospace] text-[11px] text-[#6b6862]">
          {budgetCategories.length}
        </span>
      </div>

      <section
        ref={budgetSortableRef as React.RefObject<HTMLElement>}
        className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {budgetCategories.length > 0 ? (
          budgetCategories.map((category) => (
            <div key={category.id} data-category-id={category.id} className="sortable-item">
              <BudgetCategoryCard
                category={category}
                onChangeAmounts={updateCategoryAmounts}
                isEditing={isEditing}
                isDeleting={deletingCategoryId === category.id}
                onDelete={handleDeleteCategory}
                currencySymbol={currencySymbol}
              />
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-[16px] border border-dashed border-[rgba(255,255,255,0.055)] px-4 py-8 text-center text-sm text-[#6b6862]">
            No budget categories yet. Add one to start planning variable spending.
          </div>
        )}
      </section>

      {/* ── FIXED COSTS ── */}
      <div className="mb-5 flex items-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6862]">
          Fixed Costs
        </span>
        <span className="h-px flex-1 bg-[rgba(255,255,255,0.055)]" />
        <span className="rounded-full border border-[rgba(255,255,255,0.055)] bg-transparent px-3 py-1 font-['DM_Mono',monospace] text-[11px] text-[#6b6862]">
          {fixedCategories.length}
        </span>
      </div>

      <section
        ref={fixedSortableRef as React.RefObject<HTMLElement>}
        className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {fixedCategories.length > 0 ? (
          fixedCategories.map((category) => (
            <div key={category.id} data-category-id={category.id} className="sortable-item">
              <BudgetCategoryCard
                category={category}
                onChangeAmounts={updateCategoryAmounts}
                isEditing={isEditing}
                isDeleting={deletingCategoryId === category.id}
                onDelete={handleDeleteCategory}
                currencySymbol={currencySymbol}
              />
            </div>
          ))
        ) : (
          <div className="col-span-3 rounded-[16px] border border-dashed border-[rgba(255,255,255,0.055)] px-4 py-8 text-center text-sm text-[#6b6862]">
            No fixed costs yet. Add one to keep monthly commitments visible.
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <div className="flex justify-end">
        <Link
          to="/history"
          className="inline-flex items-center rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-transparent px-4 py-2.5 text-[12px] font-semibold tracking-[0.04em] text-[#6b6862] transition hover:border-[rgba(255,255,255,0.16)] hover:text-[#b8b4ae]"
        >
          Open Monthly Records →
        </Link>
      </div>

        {isAddCategoryOpen ? (
          <AddCategoryModal
            isOpen={isAddCategoryOpen}
            onClose={() => setIsAddCategoryOpen(false)}
            onSubmit={addCategory}
            defaultType={defaultCategoryType}
          />
        ) : null}

        {isIncomeModalOpen ? (
          <UpdateIncomeModal
            currentIncome={state.income}
            onClose={() => setIsIncomeModalOpen(false)}
            onSubmit={updateIncome}
          />
        ) : null}

        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          availableThemes={themePresets}
          currencySymbol={currencySymbol}
          onCurrencyChange={setCurrencySymbol}
          onExportData={handleExportData}
          onResetDashboard={handleResetDashboard}
          isEditing={isEditing}
          onEditModeChange={setIsEditing}
          defaultCategoryType={defaultCategoryType}
          onDefaultCategoryTypeChange={setDefaultCategoryType}
          recurringTransactions={recurringTransactions}
          dashboardState={state}
          onAddRecurring={addRecurringTransaction}
          onUpdateRecurring={updateRecurringTransaction}
          onDeleteRecurring={deleteRecurringTransaction}
          loanShortcut={{
            dueSoonCount: loanSummary?.dueSoonCount ?? 0,
            overdueCount: loanSummary?.overdueCount ?? 0,
          }}
        />

        {automationMessage ? (
          <RecurringAutomationToast message={automationMessage} onClose={clearAutomationMessage} />
        ) : null}
    </div>
  )
}
