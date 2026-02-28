type AppToastVariant = 'success' | 'error' | 'info'

type AppToastProps = {
  message: string
  onClose: () => void
  durationMs?: number
  variant?: AppToastVariant
}

import { useEffect } from 'react'

const variantClasses: Record<AppToastVariant, string> = {
  success: 'border border-success/30 bg-success/10 text-success',
  error: 'border border-error/30 bg-error/10 text-error',
  info: 'border border-white/15 bg-white/5 text-text-primary',
}

export const AppToast = ({
  message,
  onClose,
  durationMs = 2200,
  variant = 'success',
}: AppToastProps) => {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-[90] max-w-sm rounded-neo px-4 py-3 shadow-neo-md ${variantClasses[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <p className="text-sm">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="neo-card px-2 py-1 text-xs font-semibold text-text-muted"
          aria-label="Dismiss toast"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export const RecurringAutomationToast = AppToast
