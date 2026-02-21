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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a44]/25 p-4 backdrop-blur-sm">
      <div className="neo-card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="neo-card neo-pressable px-3 py-1 text-sm font-semibold text-text-muted"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-text-primary">{body}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="neo-card neo-pressable flex-1 px-4 py-2 text-sm font-semibold text-text-primary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="neo-card neo-pressable flex-1 bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
