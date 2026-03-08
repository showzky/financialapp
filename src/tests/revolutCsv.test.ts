import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { parseRevolutCsv, parseRevolutImportFile } from '@/components/flow/revolutCsv'

describe('parseRevolutCsv', () => {
  it('extracts rows and totals from a Revolut-style csv export', () => {
    const summary = parseRevolutCsv([
      'Completed Date,Description,Amount,Currency',
      '2026-03-08,Coffee,-59.00,NOK',
      '2026-03-08,Refund,100.00,NOK',
    ].join('\n'))

    expect(summary.rows).toHaveLength(2)
    expect(summary.totalSpent).toBe(59)
    expect(summary.totalIncome).toBe(100)
    expect(summary.rows[0]).toMatchObject({
      description: 'Coffee',
      amount: -59,
      currency: 'NOK',
    })
  })
})

describe('parseRevolutImportFile', () => {
  it('extracts rows and totals from a Revolut-style xlsx export', async () => {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Completed Date', 'Description', 'Amount', 'Currency'],
      ['2026-03-08', 'Metro', -42.5, 'NOK'],
      ['2026-03-08', 'Salary', 1200, 'NOK'],
    ])

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

    const workbookData = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const workbookBuffer =
      workbookData instanceof ArrayBuffer
        ? workbookData
        : workbookData.buffer.slice(
            workbookData.byteOffset,
            workbookData.byteOffset + workbookData.byteLength,
          )

    const file = new File(
      [workbookBuffer],
      'revolut-export.xlsx',
      {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    )

    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => workbookBuffer,
    })

    const summary = await parseRevolutImportFile(file)

    expect(summary.rows).toHaveLength(2)
    expect(summary.totalSpent).toBe(42.5)
    expect(summary.totalIncome).toBe(1200)
    expect(summary.rows[0]).toMatchObject({
      description: 'Metro',
      amount: -42.5,
      currency: 'NOK',
    })
  })
})