// ADD THIS: Slide-out settings drawer with overlay and neumorphic controls
import { Link } from 'react-router-dom'
import type { BudgetCategoryType } from '@/types/budget'
import type { BudgetState } from '@/types/budget'
import { RecurringManager } from '@/components/RecurringManager'
import { useFinanceData } from '@/context/FinanceDataContext'
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
          className={`rounded-[8px] border px-2 py-1.5 text-sm font-medium transition ${
            theme === opt
              ? 'border-[rgba(201,168,76,0.4)] bg-[#18181c] text-[#e2c06a] ring-1 ring-[#c9a84c]'
              : 'border-[rgba(255,255,255,0.055)] bg-[#111114] text-[#a09d98] hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]'
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
  isBootstrapAdmin?: boolean
  publicRegistrationEnabled?: boolean
  isAuthSettingsBusy?: boolean
  authSettingsError?: string
  onTogglePublicRegistration?: (enabled: boolean) => void
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
  isBootstrapAdmin = false,
  publicRegistrationEnabled = true,
  isAuthSettingsBusy = false,
  authSettingsError = '',
  onTogglePublicRegistration,
}: SettingsDrawerProps) => {
  const { captureMode, setCaptureMode } = useFinanceData()

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
            className="rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] px-3 py-1.5 text-sm font-medium text-[#a09d98] transition hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]"
          >
            Close
          </button>
        </div>

        <div className="settings-drawer-content space-y-4">
          <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
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
                        className={`relative w-full rounded-[10px] border px-3 py-2.5 text-left transition ${
                          isActive
                            ? 'border-[rgba(201,168,76,0.4)] bg-[#111114] ring-1 ring-[#c9a84c]'
                            : 'border-[rgba(255,255,255,0.055)] bg-[#111114] hover:border-[rgba(255,255,255,0.10)]'
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className={`block text-xs font-semibold uppercase tracking-[0.14em] ${isActive ? 'text-[#e2c06a]' : 'text-[#d4d0ca]'}`}>
                          {theme.name}
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-[#6b6862]">
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

          <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
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
                className="w-full rounded-[8px] border border-[rgba(255,255,255,0.055)] bg-[#111114] px-3 py-2 text-sm text-[#d4d0ca] outline-none transition hover:border-[rgba(255,255,255,0.10)] focus:border-[rgba(201,168,76,0.4)] focus:ring-1 focus:ring-[#c9a84c]"
              >
                <option value="KR">KR</option>
                <option value="$">$</option>
                <option value="€">€</option>
              </select>
            </div>
          </section>

          <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
              History Capture
            </h3>

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Default capture action</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCaptureMode('current-payday')}
                  className={`rounded-[8px] border px-3 py-1.5 text-sm font-medium transition ${captureMode === 'current-payday' ? 'border-[rgba(201,168,76,0.4)] bg-[#111114] text-[#e2c06a] ring-1 ring-[#c9a84c]' : 'border-[rgba(255,255,255,0.055)] bg-[#111114] text-[#a09d98] hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]'}`}
                >
                  Current payday
                </button>
                <button
                  type="button"
                  onClick={() => setCaptureMode('manual')}
                  className={`rounded-[8px] border px-3 py-1.5 text-sm font-medium transition ${captureMode === 'manual' ? 'border-[rgba(201,168,76,0.4)] bg-[#111114] text-[#e2c06a] ring-1 ring-[#c9a84c]' : 'border-[rgba(255,255,255,0.055)] bg-[#111114] text-[#a09d98] hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]'}`}
                >
                  Manual period
                </button>
              </div>
              <p className="text-[11px] leading-4 text-[#6b6862]">
                Stored through the history settings layer so a database adapter can replace local
                storage later.
              </p>
            </div>
          </section>

          <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
              Layout Defaults
            </h3>

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Default new category type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onDefaultCategoryTypeChange('budget')}
                  className={`rounded-[8px] border px-3 py-1.5 text-sm font-medium transition ${defaultCategoryType === 'budget' ? 'border-[rgba(201,168,76,0.4)] bg-[#111114] text-[#e2c06a] ring-1 ring-[#c9a84c]' : 'border-[rgba(255,255,255,0.055)] bg-[#111114] text-[#a09d98] hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]'}`}
                >
                  Budget
                </button>
                <button
                  type="button"
                  onClick={() => onDefaultCategoryTypeChange('fixed')}
                  className={`rounded-[8px] border px-3 py-1.5 text-sm font-medium transition ${defaultCategoryType === 'fixed' ? 'border-[rgba(201,168,76,0.4)] bg-[#111114] text-[#e2c06a] ring-1 ring-[#c9a84c]' : 'border-[rgba(255,255,255,0.055)] bg-[#111114] text-[#a09d98] hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]'}`}
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
                className={`w-full rounded-[8px] border px-3 py-1.5 text-sm font-medium transition ${isEditing ? 'border-[rgba(201,168,76,0.4)] bg-[#111114] text-[#e2c06a] ring-1 ring-[#c9a84c]' : 'border-[rgba(255,255,255,0.055)] bg-[#111114] text-[#a09d98] hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]'}`}
              >
                {isEditing ? 'Editing enabled' : 'Editing disabled'}
              </button>
            </div>
          </section>

          <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
            {/* ADD THIS: compact shortcut badges for near-term loan follow-up */}
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
              Loan Shortcut
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.08)] px-2.5 py-1 text-xs font-semibold text-[#e2c06a]">
                Due soon {loanShortcut?.dueSoonCount ?? 0}
              </span>
              <span className="inline-flex items-center rounded-full border border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.08)] px-2.5 py-1 text-xs font-semibold text-[#c96b6b]">
                Overdue {loanShortcut?.overdueCount ?? 0}
              </span>
            </div>
            <Link
              to="/loans"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-[8px] border border-[rgba(91,163,201,0.30)] bg-[rgba(91,163,201,0.08)] px-3 py-1.5 text-sm font-medium text-[#5ba3c9] transition hover:border-[rgba(91,163,201,0.50)] hover:bg-[rgba(91,163,201,0.14)]"
            >
              Open loans
            </Link>
          </section>

          {isBootstrapAdmin ? (
            <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
                Auth Admin
              </h3>

              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">Public registration</p>
                  <p className="text-xs text-text-muted">
                    {publicRegistrationEnabled ? 'Enabled for new users' : 'Disabled for new users'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAuthSettingsBusy}
                  onClick={() => onTogglePublicRegistration?.(!publicRegistrationEnabled)}
                  className={`rounded-[8px] border px-3 py-1.5 text-sm font-medium transition ${publicRegistrationEnabled ? 'border-[rgba(76,201,141,0.35)] bg-[rgba(76,201,141,0.14)] text-[#8fe0b6]' : 'border-[rgba(201,107,107,0.30)] bg-[rgba(201,107,107,0.12)] text-[#d89a9a]'} ${isAuthSettingsBusy ? 'opacity-60' : ''}`}
                >
                  {isAuthSettingsBusy ? 'Saving...' : publicRegistrationEnabled ? 'Turn Off' : 'Turn On'}
                </button>
              </div>

              {authSettingsError ? (
                <p className="text-xs text-[#c96b6b]">{authSettingsError}</p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] space-y-3 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
              Data Management
            </h3>
            <div className="grid gap-2">
              <button type="button" onClick={onExportData} className="w-full rounded-[8px] border border-[rgba(255,255,255,0.055)] bg-[#111114] px-3 py-1.5 text-sm font-medium text-[#a09d98] transition hover:border-[rgba(255,255,255,0.10)] hover:text-[#d4d0ca]">
                Export data
              </button>
              <button
                type="button"
                onClick={handleResetClick}
                className="w-full rounded-[8px] border border-[rgba(201,107,107,0.25)] bg-[rgba(201,107,107,0.06)] px-3 py-1.5 text-sm font-medium text-[#c96b6b] transition hover:bg-[rgba(201,107,107,0.12)]"
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
