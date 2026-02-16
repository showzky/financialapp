// ADD THIS: Manage recurring items list + add/edit form
import { useMemo, useState, type FormEvent } from 'react'
import type { BudgetState } from '@/types/budget'
import type {
  RecurringFrequency,
  RecurringTransaction,
  RecurringTransactionType,
} from '@/types/recurring'

type RecurringManagerProps = {
  recurringTransactions: RecurringTransaction[]
  dashboardState: BudgetState
  onAdd: (entry: Omit<RecurringTransaction, 'id' | 'lastAppliedDate'>) => void
  onUpdate: (id: string, updates: Partial<RecurringTransaction>) => void
  onDelete: (id: string) => void
}

const dayOfWeekOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const

const formatSchedule = (item: RecurringTransaction) => {
  // ADD THIS: readable schedule text in the list
  if (item.frequency === 'monthly') {
    return `Monthly • Day ${item.recurringDayOfMonth ?? 1}`
  }

  const weekday = dayOfWeekOptions.find((option) => option.value === (item.recurringDayOfWeek ?? 1))
  return `Weekly • ${weekday?.label ?? 'Monday'}`
}

const formatLastApplied = (lastAppliedDate: string) => {
  // ADD THIS: avoid showing epoch placeholder for rules that have never run
  if (!lastAppliedDate) return 'Not applied yet'
  const parsed = new Date(lastAppliedDate)
  if (Number.isNaN(parsed.getTime())) return 'Not applied yet'
  return parsed.toLocaleDateString()
}

const emptyForm = {
  name: '',
  amount: '0',
  type: 'expense' as RecurringTransactionType,
  categoryID: '',
  frequency: 'monthly' as RecurringFrequency,
  recurringDayOfMonth: 1,
  recurringDayOfWeek: 1,
}

export const RecurringManager = ({
  recurringTransactions,
  dashboardState,
  onAdd,
  onUpdate,
  onDelete,
}: RecurringManagerProps) => {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const categoryOptions = useMemo(
    () => dashboardState.categories.map((category) => ({ id: category.id, name: category.name })),
    [dashboardState.categories],
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // ADD THIS: add/update recurring item with shared form
    event.preventDefault()
    const trimmedName = form.name.trim()
    const amount = Math.max(0, Number(form.amount) || 0)
    const categoryID = form.type === 'expense' ? form.categoryID : ''

    if (!trimmedName || amount === 0) return

    const payload = {
      name: trimmedName,
      amount,
      type: form.type,
      categoryID,
      frequency: form.frequency,
      // ADD THIS: save only relevant recurring date field based on frequency
      recurringDayOfMonth:
        form.frequency === 'monthly'
          ? Math.min(31, Math.max(1, form.recurringDayOfMonth))
          : undefined,
      recurringDayOfWeek:
        form.frequency === 'weekly' ? Math.min(6, Math.max(0, form.recurringDayOfWeek)) : undefined,
    }

    if (editingId) {
      onUpdate(editingId, payload)
    } else {
      onAdd(payload)
    }

    resetForm()
  }

  const handleEdit = (item: RecurringTransaction) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      amount: String(item.amount),
      type: item.type,
      categoryID: item.categoryID,
      frequency: item.frequency,
      recurringDayOfMonth: item.recurringDayOfMonth ?? 1,
      recurringDayOfWeek: item.recurringDayOfWeek ?? 1,
    })
  }

  return (
    <section className="neo-card space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">
        Manage Recurring Items
      </h3>

      <div className="space-y-2">
        {recurringTransactions.length === 0 ? (
          <p className="rounded-neo bg-surface-strong px-3 py-2 text-xs text-text-muted shadow-neo-inset">
            No recurring rules yet.
          </p>
        ) : (
          recurringTransactions.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-neo bg-surface-strong px-3 py-2 shadow-neo-inset"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {item.name} • {item.type === 'income' ? 'Income' : 'Expense'}
                </p>
                <p className="text-xs text-text-muted">
                  {formatSchedule(item)} • Last applied {formatLastApplied(item.lastAppliedDate)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Edit ${item.name}`}
                onClick={() => handleEdit(item)}
                className="neo-card px-2 py-1 text-xs font-semibold text-text-primary"
              >
                ✎
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                onClick={() => onDelete(item.id)}
                className="neo-card px-2 py-1 text-xs font-semibold text-rose-600"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Name (Rent, Salary, Netflix...)"
          className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step={1}
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            placeholder="Amount"
            className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
          />

          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as RecurringTransactionType,
              }))
            }
            className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.categoryID}
            disabled={form.type === 'income'}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                categoryID: event.target.value,
              }))
            }
            className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          >
            <option value="">Select category</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            value={form.frequency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                frequency: event.target.value as RecurringFrequency,
              }))
            }
            className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {form.frequency === 'monthly' ? (
          <label className="grid gap-1 text-xs text-text-muted">
            Recurring date (day of month)
            <select
              value={form.recurringDayOfMonth}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recurringDayOfMonth: Number(event.target.value),
                }))
              }
              className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
            >
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-1 text-xs text-text-muted">
            Recurring date (weekday)
            <select
              value={form.recurringDayOfWeek}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recurringDayOfWeek: Number(event.target.value),
                }))
              }
              className="w-full rounded-neo border border-transparent bg-surface px-3 py-2 text-sm text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
            >
              {dayOfWeekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="neo-card neo-pressable flex-1 px-3 py-2 text-sm font-semibold text-text-primary"
          >
            {editingId ? 'Save Changes' : 'Add Recurring Item'}
          </button>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="neo-card px-3 py-2 text-sm font-semibold text-text-muted"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
