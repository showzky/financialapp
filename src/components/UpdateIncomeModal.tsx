// ADD THIS: Modal for editing monthly income
import { useState, type FormEvent } from 'react'

type UpdateIncomeModalProps = {
  currentIncome: number
  onClose: () => void
  onSubmit: (income: number) => void
}

export const UpdateIncomeModal = ({ currentIncome, onClose, onSubmit }: UpdateIncomeModalProps) => {
  const [incomeValue, setIncomeValue] = useState(String(currentIncome)) // ADD THIS: local input state

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // ADD THIS: validate and submit income
    event.preventDefault()
    const parsed = Number(incomeValue)
    if (!Number.isFinite(parsed) || parsed < 0) return

    onSubmit(parsed)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a44]/25 p-4 backdrop-blur-sm">
      <div className="neo-card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Update monthly income</h2>
          <button
            type="button"
            onClick={onClose}
            className="neo-card neo-pressable px-3 py-1 text-sm font-semibold text-text-muted"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="monthly-income" className="text-sm font-medium text-text-muted">
              Monthly income (KR)
            </label>
            <input
              id="monthly-income"
              type="number"
              min={0}
              step={1}
              value={incomeValue}
              onChange={(event) => setIncomeValue(event.target.value)}
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="neo-card neo-pressable w-full px-4 py-3 text-sm font-semibold text-text-primary"
          >
            Save income
          </button>
        </form>
      </div>
    </div>
  )
}
