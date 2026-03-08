import * as XLSX from 'xlsx'
import type { RevolutImportOverride } from '@/components/flow/revolutImportClassifier'
import type { AppliedImportTargetKind } from '@/types/transaction'

export type RevolutImportRow = {
  id: string
  date: string
  description: string
  amount: number
  currency: string
}

export type RevolutImportSummary = {
  rows: RevolutImportRow[]
  totalSpent: number
  totalIncome: number
  currencies: string[]
}

export type RowApplicationStatus = 'applied' | 'failed' | 'duplicate-blocked' // ADDED THIS

export type AppliedRowRecord = { // ADDED THIS
  status: RowApplicationStatus
  fingerprint: string
  appliedAt?: string
  transactionId?: string
  appliedTargetKind?: AppliedImportTargetKind
  appliedTargetId?: string
  errorMessage?: string
}

export type StoredRevolutImportState = {
  fileName: string
  summary: RevolutImportSummary
  overrides?: Record<string, RevolutImportOverride>
  appliedRows?: Record<string, AppliedRowRecord> // ADDED THIS
}

export const getRowFingerprint = (row: RevolutImportRow, fileName: string): string => // ADDED THIS
  `${row.description}|${row.amount}|${row.date}|${fileName}`

export const EMPTY_REVOLUT_IMPORT_SUMMARY: RevolutImportSummary = {
  rows: [],
  totalSpent: 0,
  totalIncome: 0,
  currencies: [],
}

export const EMPTY_REVOLUT_IMPORT_STATE: StoredRevolutImportState = {
  fileName: '',
  summary: EMPTY_REVOLUT_IMPORT_SUMMARY,
  overrides: {},
  appliedRows: {},
}

const REVOLUT_IMPORT_STORAGE_KEY = 'flow:revolut-import-state'

const EXCEL_FILE_EXTENSIONS = ['xlsx', 'xls']

const splitCsvLine = (line: string) => {
  const cells: string[] = []
  let current = ''
  let isQuoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"') {
      if (isQuoted && nextCharacter === '"') {
        current += '"'
        index += 1
        continue
      }

      isQuoted = !isQuoted
      continue
    }

    if (character === ',' && !isQuoted) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  cells.push(current.trim())
  return cells
}

const normalizeHeader = (value: string) => value.trim().toLowerCase()

const getFileExtension = (fileName: string) => {
  const segments = fileName.toLowerCase().split('.')
  return segments.length > 1 ? segments.at(-1) ?? '' : ''
}

const readBlobAsArrayBuffer = async (file: Blob) => {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }

  return new Response(file).arrayBuffer()
}

const getCell = (row: string[], headers: Map<string, number>, keys: string[]) => {
  for (const key of keys) {
    const index = headers.get(key)
    if (index !== undefined && row[index]) {
      return row[index].trim()
    }
  }

  return ''
}

const parseAmount = (value: string) => {
  const normalized = value.replace(/\s/g, '').replace(/,/g, '')
  const parsed = Number.parseFloat(normalized)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

const formatImportDate = (rawDate: string) => {
  const trimmed = rawDate.trim()
  if (!trimmed) {
    return 'Unknown date'
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return trimmed
  }

  return date.toISOString().slice(0, 10)
}

const buildImportSummaryFromTable = (table: string[][]): RevolutImportSummary => {
  if (table.length < 2) {
    return {
      rows: [],
      totalSpent: 0,
      totalIncome: 0,
      currencies: [],
    }
  }

  const headerCells = table[0].map(normalizeHeader)
  const headers = new Map(headerCells.map((header, index) => [header, index]))

  const rows = table.slice(1).flatMap((cells, index) => {
    const amount = parseAmount(getCell(cells, headers, ['amount', 'cash amount']))

    if (amount === null) {
      return []
    }

    const description =
      getCell(cells, headers, ['description', 'reference', 'payment reference', 'note']) ||
      'Revolut transaction'

    const date = formatImportDate(
      getCell(cells, headers, ['completed date', 'started date', 'date']),
    )

    const currency = getCell(cells, headers, ['currency']) || 'N/A'

    return [
      {
        id: `revolut-import-${index}`,
        date,
        description,
        amount,
        currency,
      },
    ]
  })

  const totalSpent = rows.reduce((sum, row) => (row.amount < 0 ? sum + Math.abs(row.amount) : sum), 0)
  const totalIncome = rows.reduce((sum, row) => (row.amount > 0 ? sum + row.amount : sum), 0)
  const currencies = Array.from(new Set(rows.map((row) => row.currency)))

  return {
    rows,
    totalSpent,
    totalIncome,
    currencies,
  }
}

export const parseRevolutCsv = (content: string): RevolutImportSummary => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return buildImportSummaryFromTable(lines.map(splitCsvLine))
}

export const parseRevolutSpreadsheet = (content: ArrayBuffer): RevolutImportSummary => {
  const workbook = XLSX.read(content, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null

  if (!firstSheet) {
    return EMPTY_REVOLUT_IMPORT_SUMMARY
  }

  const table = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    raw: false,
    blankrows: false,
  })

  return buildImportSummaryFromTable(
    table
      .filter((row) => Array.isArray(row) && row.some((cell) => cell !== null && `${cell}`.trim() !== ''))
      .map((row) => row.map((cell) => `${cell ?? ''}`.trim())),
  )
}

export const parseRevolutImportFile = async (file: File): Promise<RevolutImportSummary> => {
  const extension = getFileExtension(file.name)

  if (EXCEL_FILE_EXTENSIONS.includes(extension)) {
    return parseRevolutSpreadsheet(await readBlobAsArrayBuffer(file))
  }

  return parseRevolutCsv(await file.text())
}

export const readStoredRevolutImportState = (): StoredRevolutImportState => {
  if (typeof window === 'undefined') {
    return EMPTY_REVOLUT_IMPORT_STATE
  }

  try {
    const raw = window.localStorage.getItem(REVOLUT_IMPORT_STORAGE_KEY)
    if (!raw) {
      return EMPTY_REVOLUT_IMPORT_STATE
    }

    const parsed = JSON.parse(raw) as Partial<StoredRevolutImportState>
    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_REVOLUT_IMPORT_STATE
    }

    const fileName = typeof parsed.fileName === 'string' ? parsed.fileName : ''
    const summary = parsed.summary && typeof parsed.summary === 'object' ? parsed.summary : null

    if (!summary || !Array.isArray(summary.rows)) {
      return EMPTY_REVOLUT_IMPORT_STATE
    }

    return {
      fileName,
      summary: {
        rows: summary.rows,
        totalSpent: typeof summary.totalSpent === 'number' ? summary.totalSpent : 0,
        totalIncome: typeof summary.totalIncome === 'number' ? summary.totalIncome : 0,
        currencies: Array.isArray(summary.currencies) ? summary.currencies : [],
      },
      overrides:
        parsed.overrides && typeof parsed.overrides === 'object'
          ? (parsed.overrides as Record<string, RevolutImportOverride>)
          : {},
      appliedRows: // ADDED THIS
        parsed.appliedRows && typeof parsed.appliedRows === 'object'
          ? (parsed.appliedRows as Record<string, AppliedRowRecord>)
          : {},
    }
  } catch {
    return EMPTY_REVOLUT_IMPORT_STATE
  }
}

export const writeStoredRevolutImportState = (state: StoredRevolutImportState) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(REVOLUT_IMPORT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage failures and keep the in-memory state.
  }
}

export const isEmptyRevolutImportState = (state: StoredRevolutImportState) =>
  !state.fileName && state.summary.rows.length === 0
