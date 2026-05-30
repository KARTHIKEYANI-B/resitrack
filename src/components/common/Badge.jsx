export default function Badge({ status }) {
  const map = {
    PAID:         'badge-paid',
    PENDING:      'badge-pending',
    OVERDUE:      'badge-overdue',
    VERIFIED:     'badge-paid',
    NOT_VERIFIED: 'badge-pending',
    ACTIVE:       'badge-paid',
    INACTIVE:     'badge-overdue',
  }
  const labels = {
    PAID: 'Paid', PENDING: 'Pending', OVERDUE: 'Overdue',
    VERIFIED: 'Verified', NOT_VERIFIED: 'Not Verified',
    ACTIVE: 'Active', INACTIVE: 'Inactive',
  }
  return (
    <span className={map[status] || 'badge-pending'}>
      {labels[status] || status}
    </span>
  )
}
