type ConfirmModalProps = {
  isOpen: boolean
  title: string
  body: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  isConfirming?: boolean
}

export const ConfirmModal = ({
  isOpen,
  title,
  body,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmModalProps) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[#111114] p-6" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
                disabled={isConfirming}
            aria-label="Close confirmation modal"
            className="rounded-lg border border-[rgba(255,255,255,0.10)] px-3 py-1 text-sm font-semibold text-text-muted transition hover:border-[rgba(255,255,255,0.20)] hover:text-text-primary"
          >
            ×
          </button>
        </div>

        <p className="mb-6 text-sm text-text-primary">{body}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#202026] px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-[rgba(255,255,255,0.10)] hover:text-text-primary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex-1 rounded-[10px] border border-[rgba(201,107,107,0.30)] bg-[rgba(201,107,107,0.12)] px-4 py-2 text-sm font-semibold text-[#c96b6b] transition hover:bg-[rgba(201,107,107,0.20)]"
          >
            {isConfirming ? 'Working...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
