// ADD THIS: Neumorphic home dashboard layout
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Sortable from 'sortablejs'
import { AddCategoryModal } from '@/components/AddCategoryModal'
import { BudgetCategoryCard } from '@/components/BudgetCategoryCard'
import { NeoCard } from '@/components/NeoCard'
import { ProgressBar } from '@/components/ProgressBar'
import { RecurringAutomationToast } from '@/components/RecurringAutomationToast'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { SummaryStat } from '@/components/SummaryStat'
import { UpdateIncomeModal } from '@/components/UpdateIncomeModal'
import type { BudgetCategoryType } from '@/types/budget'
import { useBudgets } from '@/hooks/useBudgets'
import { useRecurringAutomation } from '@/hooks/useRecurringAutomation'
import { formatCurrency } from '@/utils/currency'

const accentPalette = {
  blue: { accent: '#6c7df0', strong: '#4f61d8' },
  teal: { accent: '#15b8a6', strong: '#0f8f82' },
  violet: { accent: '#8757eb', strong: '#6e42ca' },
} as const

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
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false) // ADD THIS: modal visibility
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false) // ADD THIS: income modal visibility
  const [isEditing, setIsEditing] = useState(false) // ADD THIS: settings edit mode toggle
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.localStorage.getItem('finance-theme-mode') === 'dark' ? 'dark' : 'light'
  })
  const [accent, setAccent] = useState<keyof typeof accentPalette>('blue')
  const [currencySymbol, setCurrencySymbol] = useState<'KR' | '$' | '€'>('KR')
  const [defaultCategoryType, setDefaultCategoryType] = useState<BudgetCategoryType>('budget')
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const sortableRef = useRef<HTMLElement | null>(null)
  const sortableInstanceRef = useRef<Sortable | null>(null)
  const { automationMessage, clearAutomationMessage } = useRecurringAutomation()
  const utilization = Math.round((totals.spent / totals.allocated) * 100) || 0 // ADD THIS
  const freeCash = Math.max(state.income - totals.allocated, 0) // ADD THIS

  const syncOrderFromDom = useCallback(() => {
    // ADD THIS: persist visual drag order into state array
    const container = sortableRef.current
    if (!container) return

    const orderedIds = Array.from(container.querySelectorAll<HTMLElement>('[data-category-id]'))
      .map((item) => item.dataset.categoryId)
      .filter((id): id is string => Boolean(id))

    if (orderedIds.length) {
      reorderCategories(orderedIds)
    }
  }, [reorderCategories])

  useEffect(() => {
    if (!isEditing || !sortableRef.current) {
      sortableInstanceRef.current?.destroy()
      sortableInstanceRef.current = null
      return
    }

    sortableInstanceRef.current = Sortable.create(sortableRef.current, {
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

    return () => {
      sortableInstanceRef.current?.destroy()
      sortableInstanceRef.current = null
    }
  }, [isEditing, syncOrderFromDom])

  useEffect(() => {
    // ADD THIS: apply theme globally so all routes/pages follow dark mode
    document.documentElement.setAttribute('data-theme', themeMode)
    window.localStorage.setItem('finance-theme-mode', themeMode)
  }, [themeMode])

  useEffect(() => {
    // ADD THIS: lock page scroll while settings drawer is open
    if (!isSettingsOpen) return

    // ADD THIS: preserve current scroll position (iOS + desktop safe lock)
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
    // ADD THIS: animate shrink/fade before deleting from state
    setDeletingCategoryId(id)
    window.setTimeout(() => {
      removeCategory(id)
      setDeletingCategoryId(null)
    }, 220)
  }

  const handleDoneEditing = () => {
    // ADD THIS: commit current visual order and exit editing mode
    syncOrderFromDom()
    setIsEditing(false)
  }

  const handleExportData = () => {
    // ADD THIS: export dashboard snapshot as JSON
    const payload = {
      exportedAt: new Date().toISOString(),
      state,
      settings: {
        themeMode,
        accent,
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

  const accentColors = accentPalette[accent]

  return (
    <div
      className="app-shell min-h-screen px-4 py-10 md:px-8 lg:px-12"
      style={
        {
          '--color-accent': accentColors.accent,
          '--color-accent-strong': accentColors.strong,
        } as CSSProperties
      }
    >
      <div className={`mx-auto max-w-6xl space-y-8 ${isEditing ? 'editing-mode' : ''}`}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Financial Budget Tracker
            </p>
            <h1 className="text-3xl font-semibold text-text-primary">{state.month}</h1>
            <p className="text-sm text-text-muted">Neumorphism baseline ready for iteration</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="neo-card neo-pressable px-3 py-2 text-sm font-semibold text-text-primary shadow-neo-sm"
              aria-label="Toggle settings"
            >
              ⚙ Edit Layout
            </button>
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(true)}
              className="neo-card neo-pressable px-4 py-2 text-sm font-semibold text-text-primary shadow-neo-sm"
            >
              + Add category
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="neo-card px-3 py-2 text-sm font-semibold text-text-muted shadow-neo-sm"
              aria-label="Open settings"
            >
              ⚙
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={handleDoneEditing}
                className="neo-card neo-pressable px-4 py-2 text-sm font-semibold text-accent-strong shadow-neo-sm"
              >
                Done
              </button>
            ) : null}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryStat
            label="Monthly income"
            value={formatCurrency(state.income, currencySymbol)}
            helper="Tap to update"
            icon="💰"
            onClick={() => setIsIncomeModalOpen(true)}
          />
          <SummaryStat
            label="Allocated"
            value={formatCurrency(totals.allocated, currencySymbol)}
            helper={`${utilization}% of plan`}
            icon="🗂️"
          />
          <SummaryStat
            label="Free to assign"
            value={formatCurrency(Math.max(state.income - totals.allocated, 0), currencySymbol)}
            helper="Before savings goals"
            tone="positive"
            icon="✨"
          />
        </section>

        <NeoCard className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-text-muted">Cash flow snapshot</p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(freeCash, currencySymbol)} left to allocate
              </p>
            </div>
            <div className="flex gap-3 text-sm text-text-muted">
              <span className="rounded-full bg-surface-strong px-3 py-1 shadow-neo-sm">
                Spent {formatCurrency(totals.spent, currencySymbol)}
              </span>
              <span className="rounded-full bg-surface-strong px-3 py-1 shadow-neo-sm">
                Planned {formatCurrency(totals.allocated, currencySymbol)}
              </span>
            </div>
          </div>
          <ProgressBar value={totals.spent} max={Math.max(totals.allocated, 1)} />
        </NeoCard>

        <section ref={sortableRef} className="grid gap-4 md:grid-cols-2">
          {state.categories.map((category) => (
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
          ))}
        </section>

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
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          accent={accent}
          onAccentChange={setAccent}
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
        />

        {automationMessage ? (
          <RecurringAutomationToast message={automationMessage} onClose={clearAutomationMessage} />
        ) : null}
      </div>
    </div>
  )
}
