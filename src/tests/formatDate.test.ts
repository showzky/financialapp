import { formatCETDateTime } from '@/utils/date'

describe('formatCETDateTime', () => {
  it('renders an ISO timestamp as CET English-style date/time', () => {
    // The supplied UTC value corresponds to 2026-02-20 00:00 CET
    const iso = '2026-02-19T23:00:00.000Z'
    const result = formatCETDateTime(iso)
    // depending on locale formatting we expect day/month/year, and 24h time
    // jest running in CI may use the same Intl implementation as node
    expect(result).toMatch(/20\/(02|2)\/2026/) // day 20th of February 2026
    expect(result).toMatch(/(00|0):00/) // midnight hour
  })
})
