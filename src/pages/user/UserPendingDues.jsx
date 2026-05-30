import { useState, useEffect } from 'react'
import { AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'

const PLACEHOLDER_DUES = [
  { id: 1, month: 'June 2025',  dueDate: '2025-06-10', amount: 3000, lateFee: 0,   status: 'PENDING', daysOverdue: 0 },
  { id: 2, month: 'April 2025', dueDate: '2025-04-10', amount: 3100, lateFee: 100, status: 'OVERDUE', daysOverdue: 52 },
]

export default function UserPendingDues() {
  const [dues, setDues]       = useState([])
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getPendingDues()
        setDues(res.data)
      } catch {
        setDues(PLACEHOLDER_DUES)
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const totalDue   = dues.reduce((s, d) => s + d.amount, 0)
  const totalFees  = dues.reduce((s, d) => s + d.lateFee, 0)
  const totalOwing = totalDue + totalFees

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title text-xl">Pending Dues</h1>
        <p className="section-subtitle">Outstanding maintenance amounts</p>
      </div>

      {dues.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No pending dues!"
            description="You're all up to date with your maintenance payments."
            icon={Clock}
          />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Due',    value: formatCurrency(totalDue) },
              { label: 'Late Fees',    value: formatCurrency(totalFees) },
              { label: 'Total Owing', value: formatCurrency(totalOwing) },
            ].map(({ label, value }) => (
              <div key={label} className="card card-hover text-center py-4">
                <p className="text-lg font-bold text-[#022b3a] font-mono">{value}</p>
                <p className="text-xs text-[#1f7a8c] mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Dues List */}
          <div className="space-y-3">
            {dues.map((d) => (
              <div key={d.id}
                className={`card card-hover border ${d.status === 'OVERDUE' ? 'border-red-900/40' : 'border-[#bfdbf7]'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      d.status === 'OVERDUE' ? 'bg-red-950/40' : 'bg-[#e1e5f2]'
                    }`}>
                      <AlertCircle size={16} className={d.status === 'OVERDUE' ? 'text-red-400' : 'text-yellow-400'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#022b3a]">{d.month}</p>
                      <p className="text-xs text-[#1f7a8c] mt-0.5">Due by {formatDate(d.dueDate)}</p>
                      {d.daysOverdue > 0 && (
                        <p className="text-xs text-red-400 mt-0.5">{d.daysOverdue} days overdue</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#022b3a] font-mono">{formatCurrency(d.amount)}</p>
                    {d.lateFee > 0 && (
                      <p className="text-xs text-red-400">+ {formatCurrency(d.lateFee)} late fee</p>
                    )}
                    <span className={`text-[10px] mt-1 inline-block ${d.status === 'OVERDUE' ? 'badge-overdue' : 'badge-pending'}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pay All Button */}
          <button onClick={() => navigate('/user/maintenance')}
            className="btn-primary w-full flex items-center justify-center gap-2">
            Pay Outstanding Amount — {formatCurrency(totalOwing)}
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  )
}