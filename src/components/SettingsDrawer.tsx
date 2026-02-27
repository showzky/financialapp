// ADD THIS: Slide-out settings drawer with overlay and neumorphic controls
import { Link } from 'react-router-dom'
import type { BudgetCategoryType } from '@/types/budget'
import type { BudgetState } from '@/types/budget'
import { RecurringManager } from '@/components/RecurringManager'
import { useTheme } from '@/context/ThemeContext'
import { type Theme } from '@/context/ThemeContext'

// ADD THIS: small Theme mode buttons component
const ThemeModeButtons = () => {
  const { theme, setTheme } = useTheme()

  const options: Theme[] = ['light', 'dark', 'system']

  return (
    <>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setTheme(opt)}
          aria-label={`Set color mode to ${opt}`}
          className={`rounded-neo border px-2 py-1 text-sm font-medium transition ${
            theme === opt
              ? 'ring-2 ring-accent/90 text-text-primary focus-visible:ring-offset-2 focus-visible:ring-accent/90'
              : 'text-text-muted focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/60'
          }`}
          aria-pressed={theme === opt}
        >
          {opt === 'system' ? 'System' : opt[0].toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </>
  )
}
import type { RecurringTransaction } from '@/types/recurring'
import type { ThemePreset } from '@/styles/themePresets'

type CurrencySymbol = 'KR' | '$' | '€'

type LoanShortcut = {
  dueSoonCount: number
  overdueCount: number
}

type SettingsDrawerProps = {
  isOpen: boolean
  onClose: () => void
  availableThemes: ThemePreset[]
  currencySymbol: CurrencySymbol
  onCurrencyChange: (symbol: CurrencySymbol) => void
  onExportData: () => void
  onResetDashboard: () => void
  isEditing: boolean
  onEditModeChange: (enabled: boolean) => void
  defaultCategoryType: BudgetCategoryType
  onDefaultCategoryTypeChange: (type: BudgetCategoryType) => void
  recurringTransactions: RecurringTransaction[]
  dashboardState: BudgetState
  onAddRecurring: (entry: Omit<RecurringTransaction, 'id' | 'lastAppliedDate'>) => void
  onUpdateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void
  onDeleteRecurring: (id: string) => void
  loanShortcut?: LoanShortcut
}

export const SettingsDrawer = ({
  isOpen,
  onClose,
  availableThemes,
  currencySymbol,
  onCurrencyChange,
  onExportData,
  onResetDashboard,
  isEditing,
  onEditModeChange,
  defaultCategoryType,
  onDefaultCategoryTypeChange,
  recurringTransactions,
  dashboardState,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  loanShortcut,
}: SettingsDrawerProps) => {
  const handleResetClick = () => {
    // ADD THIS: secondary confirmation warning before destructive reset
    const confirmed = window.confirm(
      'This will reset all dashboard values and layout. Are you sure you want to continue?',
    )
    if (!confirmed) return
    onResetDashboard()
    onClose()
  }

  const { selectedPresetId, setSelectedPresetId } = useTheme()

  return (
    <>
      <button
        type="button"
        aria-label="Close settings panel"
        className={`settings-overlay ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
      />

      <aside
        className={`settings-drawer ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
        aria-label="Dashboard settings"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="neo-card neo-pressable px-3 py-1 text-sm font-semibold text-text-muted"
          >
            Close
          </button>
        </div>

        <div className="settings-drawer-content space-y-4">
          <section className="neo-card space-y-3 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">
              Appearance
            </h3>

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Theme preset</p>
              <div className="grid gap-2" role="list" aria-label="Theme presets">
                {availableThemes.map((theme) => {
                  const isActive = selectedPresetId === theme.id

                  return (
                    <div key={theme.id} role="listitem">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            setSelectedPresetId(theme.id)
                          } catch {
                            // Ignore preset write errors and keep current selection.
                          }
                        }}
                        aria-label={`${theme.name} theme preset`}
                        className={`relative rounded-neo border border-transparent bg-surface px-3 py-2 text-left shadow-neo-sm transition ${
                          isActive
                            ? 'ring-2 ring-accent/90 text-text-primary focus-visible:ring-offset-2 focus-visible:ring-accent/90'
                            : 'text-text-muted focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/60'
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.14em]">
                          {theme.name}
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 opacity-85">
                          {theme.description}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                          {theme.swatches.map((swatchColor) => (
                            <span
                              key={swatchColor}
                              className="h-3 w-3 rounded-full border border-white/70 shadow-sm"
                              style={{ backgroundColor: swatchColor }}
                            />
                          ))}
                        </span>

                        {isActive ? (
                          <span
                            className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full p-1 text-white"
                            style={{
                              backgroundColor: 'var(--color-accent)',
                              boxShadow: '0 0 0 3px rgba(0,0,0,0.12)',
                            }}
                            aria-hidden="true"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-text-muted">Color mode</p>
              <div className="grid grid-cols-3 gap-2">
                {/* ADD THIS: use ThemeContext to toggle color mode */}
                <ThemeModeButtons />
              </div>
            </div>
          </section>

          <section className="neo-card space-y-3 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">
              Regional
            </h3>

            <div className="space-y-2">
              <label htmlFor="currency-setting" className="text-xs text-text-muted">
                Currency symbol
              </label>
              <select
                id="currency-setting"
                value={currencySymbol}
                onChange={(event) => onCurrencyChange(event.target.value as CurrencySymbol)}
                className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="KR">KR</option>
                <option value="$">$</option>
                <option value="€">€</option>
              </select>
            </div>
          </section>

          <section className="neo-card space-y-3 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">
              Layout Defaults
            </h3>

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Default new category type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onDefaultCategoryTypeChange('budget')}
                  className={`settings-toggle ${defaultCategoryType === 'budget' ? 'is-on' : ''}`}
                >
                  Budget
                </button>
                <button
                  type="button"
                  onClick={() => onDefaultCategoryTypeChange('fixed')}
                  className={`settings-toggle ${defaultCategoryType === 'fixed' ? 'is-on' : ''}`}
                >
                  Fixed
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Layout editing mode</p>
              <button
                type="button"
                onClick={() => onEditModeChange(!isEditing)}
                className={`settings-toggle w-full ${isEditing ? 'is-on' : ''}`}
              >
                {isEditing ? 'Editing enabled' : 'Editing disabled'}
              </button>
            </div>
          </section>

          <section className="neo-card space-y-3 p-4">
            {/* ADD THIS: compact shortcut badges for near-term loan follow-up */}
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">
              Loan Shortcut
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-surface-strong px-2.5 py-1 text-xs font-semibold text-amber-700">
                Due soon {loanShortcut?.dueSoonCount ?? 0}
              </span>
              <span className="inline-flex items-center rounded-full bg-surface-strong px-2.5 py-1 text-xs font-semibold text-red-700">
                Overdue {loanShortcut?.overdueCount ?? 0}
              </span>
            </div>
            <Link
              to="/loans"
              onClick={onClose}
              className="settings-action inline-flex items-center justify-center"
            >
              Open loans
            </Link>
          </section>

          <section className="neo-card space-y-3 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">
              Data Management
            </h3>
            <div className="grid gap-2">
              <button type="button" onClick={onExportData} className="settings-action">
                Export data
              </button>
              <button
                type="button"
                onClick={handleResetClick}
                className="settings-action text-rose-600"
              >
                Reset dashboard
              </button>
            </div>
          </section>

          <RecurringManager
            recurringTransactions={recurringTransactions}
            dashboardState={dashboardState}
            onAdd={onAddRecurring}
            onUpdate={onUpdateRecurring}
            onDelete={onDeleteRecurring}
          />
        </div>
      </aside>
    </>
  )
}
