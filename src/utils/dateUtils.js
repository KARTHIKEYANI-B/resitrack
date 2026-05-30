export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const getCurrentMonth = () => {
  return new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

export const getCurrentMonthCode = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const getDaysOverdue = (dueDate) => {
  const today = new Date()
  const due   = new Date(dueDate)
  const diff  = Math.floor((today - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

/** Returns a human-readable month from YYYY-MM string */
export const monthLabel = (ym) => {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

/** Always returns the actual current year (2026 at runtime) */
export const currentYear = new Date().getFullYear()

/** Last 5 years starting from current year */
export const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)
