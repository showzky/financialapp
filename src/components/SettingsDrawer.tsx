// ADD THIS: Slide-out settings drawer with overlay and neumorphic controls
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
          className={`rounded-neo border px-2 py-1 text-sm font-medium transition ${theme === opt ? 'ring-2 ring-accent/30 text-text-primary' : 'text-text-muted'}`}
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

type SettingsDrawerProps = {
  isOpen: boolean
  onClose: () => void
  selectedThemeId: string
  availableThemes: ThemePreset[]
  onThemeSelect: (themeId: string) => void
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

export const SettingsDrawer = ({
  isOpen,
  onClose,
  selectedThemeId,
  availableThemes,
  onThemeSelect,
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
              <div className="grid gap-2">
                {availableThemes.map((theme) => {
                  const isActive = selectedThemeId === theme.id || selectedPresetId === theme.id

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        try {
                          setSelectedPresetId(theme.id)
                        } catch {}
                        onThemeSelect(theme.id)
                      }}
                      className={`relative rounded-neo border border-transparent bg-surface px-3 py-2 text-left shadow-neo-sm transition hover:text-text-primary ${
                        isActive ? 'ring-2 ring-accent/35 text-text-primary' : 'text-text-muted'
                      }`}
                      aria-pressed={isActive}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em]">
                        {theme.name}
                      </span>
                      <span className="mt-1 block text-[11px] leading-4 opacity-85">{theme.description}</span>
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
                        <span className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-blue-600 p-1 text-white">
                          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
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
