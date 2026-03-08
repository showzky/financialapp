import { useEffect, useState } from 'react'
import type { BudgetCategory } from '@/types/budget'
import type { BudgetTransaction } from '@/types/transaction'
import { FlowImportConsole } from '@/components/flow/FlowImportConsole'
import { FlowImportLiveTransactions } from '@/components/flow/FlowImportLiveTransactions'
import type { StoredRevolutImportState } from '@/components/flow/revolutCsv'

type FlowImportManagerModalProps = {
  isOpen: boolean
  onClose: () => void
  categories: BudgetCategory[]
  transactions: BudgetTransaction[]
  value: StoredRevolutImportState
  onChange: (nextValue: StoredRevolutImportState) => void
  onTransactionCreated?: (transaction: BudgetTransaction) => void
  onTransactionRemoved?: (transactionId: string) => void
}

export const FlowImportManagerModal = ({
  isOpen,
  onClose,
  categories,
  transactions,
  value,
  onChange,
  onTransactionCreated,
  onTransactionRemoved,
}: FlowImportManagerModalProps) => {
  const [activePage, setActivePage] = useState<'queue' | 'cleanup'>('queue')

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setActivePage('queue')
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="flow-overlay flow-overlay--visible"
        aria-label="Close Revolut import manager"
        onClick={onClose}
      />

      <section className="flow-import-modal" role="dialog" aria-modal="true" aria-label="Revolut import manager">
        <div className="flow-import-modal__glow" />

        <div className="flow-import-modal__header">
          <div className="flow-import-modal__title-block">
            <div className="flow-import-modal__title-wrap">
              <h2 className="flow-import-modal__title">REVOLUT IMPORT MANAGER</h2>
              <span className="flow-import-modal__tag">SYSTEM NODE</span>
            </div>

            <div className="flow-import-modal__nav" aria-label="Revolut import manager pages">
              <button
                type="button"
                className={`flow-import-modal__nav-button ${activePage === 'queue' ? 'flow-import-modal__nav-button--active' : ''}`}
                onClick={() => setActivePage('queue')}
              >
                Queue
              </button>
              <button
                type="button"
                className={`flow-import-modal__nav-button ${activePage === 'cleanup' ? 'flow-import-modal__nav-button--active' : ''}`}
                onClick={() => setActivePage('cleanup')}
              >
                Live Cleanup
              </button>
            </div>
          </div>

          <button type="button" className="flow-import-modal__close" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>

        <div className="flow-import-modal__body">
          {activePage === 'queue' ? (
            <FlowImportConsole
              categories={categories}
              value={value}
              onChange={onChange}
              onTransactionCreated={onTransactionCreated}
              onTransactionRemoved={onTransactionRemoved}
              layout="modal"
            />
          ) : (
            <FlowImportLiveTransactions
              categories={categories}
              transactions={transactions}
              value={value}
              onChange={onChange}
              onTransactionRemoved={onTransactionRemoved}
            />
          )}
        </div>
      </section>
    </>
  )
}