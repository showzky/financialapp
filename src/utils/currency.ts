// ADD THIS: Currency formatter utility
const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

// ADD THIS: Format as NOK using KR prefix
export const formatCurrency = (value: number, symbol = 'KR') =>
  `${symbol} ${formatter.format(value)}`
