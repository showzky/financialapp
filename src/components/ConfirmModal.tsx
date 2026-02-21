type ConfirmModalProps = {
  isOpen: boolean
  title: string
  body: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal = ({
  isOpen,
  title,
  body,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-lg">
      <div className="glass-panel w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="glass-panel px-3 py-1 text-sm font-semibold text-text-muted transition-all hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-text-primary">{body}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="glass-panel flex-1 px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="glass-panel flex-1 bg-error/10 px-4 py-2 text-sm font-semibold text-error transition-all hover:bg-error/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
