import { useId, useRef, useState } from 'react'
import { formatFlowCurrency } from '@/pages/flow.utils'
import { parseRevolutCsv, type RevolutImportSummary } from '@/components/flow/revolutCsv'

const EMPTY_IMPORT: RevolutImportSummary = {
  rows: [],
  totalSpent: 0,
  totalIncome: 0,
  currencies: [],
}

export const FlowImportConsole = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState<RevolutImportSummary>(EMPTY_IMPORT)
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleChooseFile = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsOpen(true)
    setIsLoading(true)
    setError('')
    setFileName(file.name)

    try {
      const content = await file.text()
      const parsed = parseRevolutCsv(content)
      setSummary(parsed)
    } catch {
      setSummary(EMPTY_IMPORT)
      setError('Could not read this CSV file. Try exporting a fresh Revolut statement file.')
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  const previewRows = summary.rows.slice(0, 6)

  return (
    <section className={`flow-import ${isOpen ? 'flow-import--open' : ''}`} aria-label="Revolut import console">
      <div className="flow-import__toolbar">
        <div className="flow-import__heading">
          <span className="flow-import__eyebrow">// REVOLUT BLEED //</span>
          <span className="flow-import__subtext">Frontend preview only. No category sync yet.</span>
        </div>

        <div className="flow-import__actions">
          <button
            type="button"
            className="flow-import__chip"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? 'Hide import' : 'Open import'}
          </button>
          <button type="button" className="flow-import__chip flow-import__chip--primary" onClick={handleChooseFile}>
            Import Revolut CSV
          </button>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="flow-import__input"
            aria-label="Upload Revolut CSV"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {isOpen ? (
        <div className="flow-import__panel">
          <div className="flow-import__summary">
            <div className="flow-import__metric">
              <span className="flow-import__metric-label">TOTAL SPENT</span>
              <span className="flow-import__metric-value flow-import__metric-value--red">
                {formatFlowCurrency(summary.totalSpent)}
              </span>
            </div>

            <div className="flow-import__metric">
              <span className="flow-import__metric-label">TRANSACTIONS</span>
              <span className="flow-import__metric-value">{summary.rows.length}</span>
            </div>

            <div className="flow-import__metric">
              <span className="flow-import__metric-label">CURRENCIES</span>
              <span className="flow-import__metric-value">{summary.currencies.join(', ') || 'N/A'}</span>
            </div>
          </div>

          <div className="flow-import__dropzone">
            <div className="flow-import__dropicon" aria-hidden="true">
              ↻
            </div>
            <div className="flow-import__droptitle">IMPORTER REVOLUT CSV</div>
            <div className="flow-import__dropnote">
              Revolut app, profil, kontoutskrift, CSV
            </div>
            <button type="button" className="flow-import__upload-button" onClick={handleChooseFile}>
              Choose file
            </button>
            <label htmlFor={inputId} className="flow-import__input-label">
              {fileName || 'No file selected'}
            </label>
            {isLoading ? <div className="flow-import__status">Reading CSV...</div> : null}
            {error ? <div className="flow-import__status flow-import__status--error">{error}</div> : null}
          </div>

          <div className="flow-import__transactions">
            <span className="flow-import__transactions-label">// TRANSACTIONS</span>

            {previewRows.length > 0 ? (
              <div className="flow-import__list">
                {previewRows.map((row) => {
                  const isExpense = row.amount < 0

                  return (
                    <div key={row.id} className="flow-import__row">
                      <div>
                        <div className="flow-import__row-merchant">{row.description}</div>
                        <div className="flow-import__row-date">
                          {row.date} • {row.currency}
                        </div>
                      </div>

                      <div
                        className={`flow-import__row-amount ${isExpense ? 'flow-import__row-amount--expense' : 'flow-import__row-amount--income'}`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatFlowCurrency(Math.abs(row.amount)).replace('KR ', '')}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flow-import__empty">INGEN DATA - IMPORTER CSV</div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}