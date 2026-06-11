// Format Indian Rupees — ALWAYS full amount, never abbreviated (no K, L, M)
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatCurrencyFull = (amount) => formatCurrency(amount)

export const formatCurrencyShort = (amount) => formatCurrency(amount)