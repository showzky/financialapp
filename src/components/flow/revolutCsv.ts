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

export const parseRevolutCsv = (content: string): RevolutImportSummary => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return {
      rows: [],
      totalSpent: 0,
      totalIncome: 0,
      currencies: [],
    }
  }

  const headerCells = splitCsvLine(lines[0]).map(normalizeHeader)
  const headers = new Map(headerCells.map((header, index) => [header, index]))

  const rows = lines.slice(1).flatMap((line, index) => {
    const cells = splitCsvLine(line)
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