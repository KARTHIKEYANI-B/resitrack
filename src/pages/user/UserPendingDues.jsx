import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, IndianRupee, Calendar, RefreshCw, Clock } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'

export default function UserPendingDues() {
  const [dues,    setDues]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchDues = async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await userAPI.getPendingDues()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      // REQUIREMENT: only show entries where pendingAmount > 0
      setDues(data.filter(d => (d.remainingDue ?? d.pendingAmount ?? 0) > 0))
    } catch (err) {
      setError('Failed to load pending dues. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDues() }, [])

  // Aggregate totals
  const totalPending   = dues.reduce((s, d) => s + (d.remainingDue ?? d.pendingAmount ?? 0), 0)
  const totalAssigned  = dues.reduce((s, d) => s + (d.assignedAmount ?? d.dueAmount ?? 0), 0)
  const totalPaid      = dues.reduce((s, d) => s + (d.paidSoFar ?? d.paidAmount ?? 0), 0)
  const hasOverdue     = dues.some(d => d.status === 'OVERDUE' || (d.daysOverdue ?? 0) > 0)

  const statusBadge = (status, daysOverdue) => {
    if (status === 'OVERDUE' || daysOverdue > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-red-950/40 text-red-400 border-red-800/40">
          <AlertCircle size={10} /> Overdue {daysOverdue > 0 ? `(${daysOverdue}d)` : ''}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-[#e1e5f2] text-[#022b3a]/60 border-[#bfdbf7]">
        <Clock size={10} /> Unpaid
      </span>
    )
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">My Outstanding Dues</h1>
          <p className="section-subtitle">Your outstanding maintenance dues and unpaid balances</p>
        </div>
        <button onClick={fetchDues} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* REQUIREMENT: If no pending dues → show clear "all clear" message */}
      {!error && dues.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-950/30 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#022b3a]">No Pending Balance</h2>
            <p className="text-sm text-[#1f7a8c] mt-1">
              You have no outstanding maintenance dues. You are all caught up!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {dues.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="stat-label">Total Outstanding Balance</p>
                    <p className="stat-value mt-1 text-red-400">{formatCurrency(totalPending)}</p>
                    <p className="text-xs text-[#1f7a8c] mt-1">Outstanding balance</p>
                  </div>
                  <div className="stat-icon"><IndianRupee size={17} className="text-red-400/60" /></div>
                </div>
              </div>
              <div className="card card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="stat-label">Total Amount Paid</p>
                    <p className="stat-value mt-1 text-green-400">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-[#1f7a8c] mt-1">Payments received</p>
                  </div>
                  <div className="stat-icon"><CheckCircle size={17} className="text-green-400/60" /></div>
                </div>
              </div>
              <div className="card card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="stat-label">Months with Pending Dues</p>
                    <p className="stat-value mt-1">{dues.length}</p>
                    <p className="text-xs text-[#1f7a8c] mt-1">
                      {hasOverdue ? 'Includes overdue months' : 'Pending months'}
                    </p>
                  </div>
                  <div className="stat-icon"><Calendar size={17} className="text-[#022b3a]/60" /></div>
                </div>
              </div>
            </div>
          )}

          {/* Overdue warning banner */}
          {hasOverdue && (
            <div className="flex items-start gap-3 p-4 bg-red-950/20 border border-red-800/30 rounded-xl">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">You have overdue payments</p>
                <p className="text-xs text-red-300/80 mt-0.5">
                  Please clear your dues at the earliest to avoid additional late fees.
                </p>
              </div>
            </div>
          )}

          {/* Dues Table / Cards */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#bfdbf7]">
              <h2 className="text-sm font-semibold text-[#022b3a]">Month-wise Outstanding Dues Breakdown</h2>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Billing Month', 'Maintenance Amount', 'Amount Paid', 'Outstanding Balance', 'Payment Due Date', 'Status'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dues.map((d, idx) => (
                    <tr key={d.id ?? idx} className="table-row">
                      <td className="table-cell font-medium text-[#022b3a]">
                        {d.month || d.paymentMonth || '—'}
                      </td>
                      <td className="table-cell font-mono">
                        {formatCurrency(d.assignedAmount ?? d.dueAmount ?? 0)}
                      </td>
                      <td className="table-cell font-mono text-green-400">
                        {formatCurrency(d.paidSoFar ?? d.paidAmount ?? 0)}
                      </td>
                      <td className="table-cell font-mono font-semibold text-red-400">
                        {formatCurrency(d.remainingDue ?? d.pendingAmount ?? 0)}
                      </td>
                      <td className="table-cell text-xs">
                        {d.dueDate ? formatDate(d.dueDate) : '—'}
                      </td>
                      <td className="table-cell">
                        {statusBadge(d.status, d.daysOverdue ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total row */}
                <tfoot className="border-t border-[#bfdbf7] bg-[#e1e5f2]/40">
                  <tr>
                    <td className="table-cell font-semibold text-[#022b3a]">Total</td>
                    <td className="table-cell font-mono font-semibold text-[#022b3a]">
                      {formatCurrency(totalAssigned)}
                    </td>
                    <td className="table-cell font-mono font-semibold text-green-400">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="table-cell font-mono font-bold text-red-400">
                      {formatCurrency(totalPending)}
                    </td>
                    <td className="table-cell" />
                    <td className="table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-[#bfdbf7]">
              {dues.map((d, idx) => (
                <div key={d.id ?? idx} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#022b3a] text-sm">
                      {d.month || d.paymentMonth || '—'}
                    </p>
                    {statusBadge(d.status, d.daysOverdue ?? 0)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#e1e5f2]/60 rounded-lg p-2">
                      <p className="text-[10px] text-[#1f7a8c]">Assigned</p>
                      <p className="text-xs font-mono font-semibold text-[#022b3a]">
                        {formatCurrency(d.assignedAmount ?? d.dueAmount ?? 0)}
                      </p>
                    </div>
                    <div className="bg-green-950/20 rounded-lg p-2">
                      <p className="text-[10px] text-[#1f7a8c]">Paid</p>
                      <p className="text-xs font-mono font-semibold text-green-400">
                        {formatCurrency(d.paidSoFar ?? d.paidAmount ?? 0)}
                      </p>
                    </div>
                    <div className="bg-red-950/20 rounded-lg p-2">
                      <p className="text-[10px] text-[#1f7a8c]">Pending</p>
                      <p className="text-xs font-mono font-bold text-red-400">
                        {formatCurrency(d.remainingDue ?? d.pendingAmount ?? 0)}
                      </p>
                    </div>
                  </div>
                  {d.dueDate && (
                    <p className="text-xs text-[#1f7a8c]">
                      Due: {formatDate(d.dueDate)}
                      {(d.daysOverdue ?? 0) > 0 && (
                        <span className="ml-2 text-red-400">({d.daysOverdue} days overdue)</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}