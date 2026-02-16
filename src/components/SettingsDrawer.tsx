// ADD THIS: Slide-out settings drawer with overlay and neumorphic controls
import type { BudgetCategoryType } from '@/types/budget'
import type { BudgetState } from '@/types/budget'
import { RecurringManager } from '@/components/RecurringManager'
import type { RecurringTransaction } from '@/types/recurring'

type ThemeMode = 'light' | 'dark'
type AccentKey = 'blue' | 'teal' | 'violet'
type CurrencySymbol = 'KR' | '$' | '€'

type SettingsDrawerProps = {
  isOpen: boolean
  onClose: () => void
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
  accent: AccentKey
  onAccentChange: (accent: AccentKey) => void
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
}

const accentPalette: Record<AccentKey, string> = {
  blue: '#6c7df0',
  teal: '#15b8a6',
  violet: '#8757eb',
}

export const SettingsDrawer = ({
  isOpen,
  onClose,
  themeMode,
  onThemeModeChange,
  accent,
  onAccentChange,
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
              <p className="text-xs text-text-muted">Theme mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onThemeModeChange('light')}
                  className={`settings-toggle ${themeMode === 'light' ? 'is-on' : ''}`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => onThemeModeChange('dark')}
                  className={`settings-toggle ${themeMode === 'dark' ? 'is-on' : ''}`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Primary accent</p>
              <div className="grid grid-cols-3 gap-2">
                {(['blue', 'teal', 'violet'] as const).map((accentKey) => (
                  <button
                    key={accentKey}
                    type="button"
                    onClick={() => onAccentChange(accentKey)}
                    className={`settings-swatch ${accent === accentKey ? 'is-on' : ''}`}
                  >
                    <span style={{ backgroundColor: accentPalette[accentKey] }} />
                    {accentKey}
                  </button>
                ))}
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
