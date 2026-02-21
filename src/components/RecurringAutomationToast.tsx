// ADD THIS: subtle toast shown when recurring items are auto-applied

type RecurringAutomationToastProps = {
  message: string
  onClose: () => void
}

import { useEffect } from 'react'

export const RecurringAutomationToast = ({ message, onClose }: RecurringAutomationToastProps) => {
  // automatically close after 1 second to avoid lingering forever
  useEffect(() => {
    const t = setTimeout(onClose, 1000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-[90] max-w-sm rounded-neo bg-surface px-4 py-3 shadow-neo-md">
      <div className="flex items-start gap-3">
        <p className="text-sm text-text-primary">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="neo-card px-2 py-1 text-xs font-semibold text-text-muted"
          aria-label="Dismiss recurring automation message"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
