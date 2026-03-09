import { useEffect, useId, useState, type FormEvent } from 'react'
import type { BudgetCategoryType } from '@/types/budget'

type AddCategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, type: BudgetCategoryType) => void
  defaultType?: BudgetCategoryType
}

export const AddCategoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'budget',
}: AddCategoryModalProps) => {
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<BudgetCategoryType>(defaultType)
  const categoryNameId = useId()

  useEffect(() => {
    if (!isOpen) {
      setCategoryName('')
      setCategoryType(defaultType)
      return
    }

    setCategoryType(defaultType)
  }, [defaultType, isOpen])

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = categoryName.trim()
    if (!trimmedName) return

    onSubmit(trimmedName, categoryType)
    setCategoryName('')
    setCategoryType(defaultType)
    onClose()
  }

  const handleClose = () => {
    setCategoryName('')
    setCategoryType(defaultType)
    onClose()
  }

  const isSubmitDisabled = categoryName.trim().length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.7)] p-5 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.10)] bg-[#111114] shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-category-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50" />

        <div className="mb-6 flex items-start justify-between gap-4 px-7 pb-0 pt-7">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]/75">
              Dashboard
            </p>
            <h2
              id="add-category-modal-title"
              className="font-italiana text-[32px] leading-none tracking-[-0.01em] text-[#f0ede8]"
            >
              Add Category
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close add category modal"
            className="mt-1 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] text-base leading-none text-[#6b6862] transition-all duration-200 hover:border-[rgba(255,255,255,0.18)] hover:bg-[#202026] hover:text-[#f0ede8]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-7 pb-7">
          <div>
            <label
              htmlFor={categoryNameId}
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6862]"
            >
              Category Name
            </label>
            <input
              id={categoryNameId}
              type="text"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Example: Health"
              className="w-full rounded-[12px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-[14px] text-sm font-normal tracking-[0.01em] text-[#f0ede8] outline-none transition-all duration-200 placeholder:text-[#6b6862] focus:border-[rgba(201,168,76,0.22)] focus:bg-[#202026] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)]"
              autoFocus
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6862]">
              Category Type
            </legend>
            <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] p-[5px]">
              <button
                type="button"
                onClick={() => setCategoryType('budget')}
                className={`flex items-center justify-center gap-2 rounded-[10px] border px-3 py-3 text-[13px] font-semibold tracking-[0.04em] transition-all duration-200 ${
                  categoryType === 'budget'
                    ? 'border-[rgba(201,168,76,0.22)] bg-[#202026] text-[#e2c06a] shadow-[0_0_16px_rgba(201,168,76,0.08)]'
                    : 'border-transparent bg-transparent text-[#6b6862] hover:text-[#b8b4ae]'
                }`}
                aria-pressed={categoryType === 'budget'}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[6px] text-[11px] ${
                    categoryType === 'budget' ? 'bg-[rgba(201,168,76,0.10)]' : ''
                  }`}
                >
                  ◈
                </span>
                <span className="flex flex-col items-center gap-[3px]">
                  <span>Budget</span>
                  <span className="text-[10px] font-normal tracking-[0.02em] text-[#6b6862]">
                    Track spending
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryType('fixed')}
                className={`flex items-center justify-center gap-2 rounded-[10px] border px-3 py-3 text-[13px] font-semibold tracking-[0.04em] transition-all duration-200 ${
                  categoryType === 'fixed'
                    ? 'border-[rgba(94,189,151,0.22)] bg-[#202026] text-[#5ebd97] shadow-[0_0_16px_rgba(94,189,151,0.08)]'
                    : 'border-transparent bg-transparent text-[#6b6862] hover:text-[#b8b4ae]'
                }`}
                aria-pressed={categoryType === 'fixed'}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[6px] text-[11px] ${
                    categoryType === 'fixed' ? 'bg-[rgba(94,189,151,0.10)]' : ''
                  }`}
                >
                  ⬡
                </span>
                <span className="flex flex-col items-center gap-[3px]">
                  <span>Fixed</span>
                  <span className="text-[10px] font-normal tracking-[0.02em] text-[#6b6862]">
                    Set amount
                  </span>
                </span>
              </button>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`flex w-full items-center justify-center gap-2 rounded-[12px] border px-4 py-[15px] text-sm font-bold tracking-[0.04em] transition-all duration-200 ${
              isSubmitDisabled
                ? 'cursor-not-allowed border-[rgba(255,255,255,0.055)] bg-[#202026] text-[#6b6862] shadow-none'
                : 'border-[#c9a84c] bg-[#c9a84c] text-[#0a0a0b] hover:-translate-y-px hover:border-[#e2c06a] hover:bg-[#e2c06a] hover:shadow-[0_8px_24px_rgba(201,168,76,0.2)] active:translate-y-0'
            }`}
          >
            Add Category
          </button>
        </form>
      </div>
    </div>
  )
}
