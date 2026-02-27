interface DismissibleCalloutProps {
  message: string
  type: 'error' | 'info'
  onDismiss: () => void
}

function DismissibleCallout({ message, type, onDismiss }: DismissibleCalloutProps) {
  const toneClasses =
    type === 'error' ? 'border-red-400/30 text-red-200' : 'border-blue-400/30 text-blue-200'

  return (
    <div
      className={`glass-panel border px-4 py-3 text-sm flex items-center justify-between ${toneClasses}`}
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
        aria-label="Dismiss"
        type="button"
      >
        x
      </button>
    </div>
  )
}

export default DismissibleCallout
