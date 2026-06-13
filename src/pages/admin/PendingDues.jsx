import { useState, useEffect } from 'react'
import { AlertCircle, Bell, IndianRupee, Home, TrendingDown, RefreshCw, CheckCircle } from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import SearchBar from '../../components/common/SearchBar'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

export default function PendingDues() {
  const [dues,     setDues]     = useState([])
  const [summary,  setSummary]  = useState(null)   // from /admin/pending-dues/summary
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [actionId, setActionId] = useState(null)
  const PER_PAGE = 10

  const fetchAll = async () => {
    setLoading(true)
    try {
      // Fetch dues list AND accurate summary in parallel
      const [duesRes, summaryRes] = await Promise.allSettled([
        adminAPI.getPendingDues(),
        adminAPI.getPendingDuesSummary(),
      ])

      if (duesRes.status === 'fulfilled') {
        const data = Array.isArray(duesRes.value.data)
          ? duesRes.value.data
          : (duesRes.value.data?.data ?? [])
        setDues(data)
      } else {
        setDues([])
        toast.error('Could not load pending dues.')
      }

      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value.data?.data ?? summaryRes.value.data ?? {}
        setSummary(s)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handlePenalty = async (id) => {
    if (!id) { toast.error('Cannot apply penalty — no payment record found'); return }
    setActionId(id)
    try {
      await adminAPI.applyPenalty(id)
      toast.success('Late fee penalty applied')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply penalty')
    } finally { setActionId(null) }
  }

  const handleNotify = async (id) => {
    if (!id) { toast.error('Cannot notify — no payment record found'); return }
    setActionId(id)
    try {
      await adminAPI.sendDueNotification(id)
      toast.success('Reminder sent to resident')
    } catch {
      toast.error('Failed to send reminder')
    } finally { setActionId(null) }
  }

  const filtered = dues.filter(d =>
    (d.residentName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.flatNumber   ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Summary stats from /admin/pending-dues/summary ──────────────────────
  const totalPendingAmount = summary?.totalPendingAmount ?? dues.reduce((s, d) => s + (d.remainingDue ?? 0), 0)
  const overdueCount       = summary?.overdueCount       ?? dues.filter(d => d.status === 'OVERDUE').length
  const unpaidCount        = summary?.unpaidCount        ?? dues.length
  const totalActiveOwners  = summary?.totalActiveOwners  ?? 0
  const paidCount          = Math.max(0, totalActiveOwners - unpaidCount)
  const collectionRate     = totalActiveOwners > 0
    ? Math.round((paidCount / totalActiveOwners) * 100)
    : 0

  const statusBadge = (status) => {
    const map = {
      OVERDUE: 'bg-red-950/40 text-red-400 border-red-800/40',
      PENDING: 'bg-[#e1e5f2] text-[#022b3a]/60 border-[#bfdbf7]',
    }
    return (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[status] || map.PENDING}`}>
        {status === 'OVERDUE' ? 'OVERDUE' : 'UNPAID'}
      </span>
    )
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Outstanding Maintenance Dues</h1>
          <p className="section-subtitle">Residents with outstanding maintenance balances</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Outstanding Balance',
            value: formatCurrency(totalPendingAmount),
            icon:  IndianRupee,
            sub:   `Across ${unpaidCount} resident${unpaidCount !== 1 ? 's' : ''}`,
          },
          {
            label: 'Residents with Overdue Payments',
            value: `${overdueCount} resident${overdueCount !== 1 ? 's' : ''}`,
            icon:  Home,
            sub:   'Remaining due + past due date',
          },
          {
            label: 'Overall Collection Rate',
            value: `${collectionRate}%`,
            icon:  TrendingDown,
            sub:   `${paidCount} of ${totalActiveOwners} active owners paid`,
          },
        ].map(({ label, value, icon: Icon, sub }, idx) => (
          <div key={label} className="card card-hover animate-pop-in" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value mt-1">{value}</p>
                <p className="text-xs text-[#1f7a8c] mt-1">{sub}</p>
              </div>
              <div className="stat-icon"><Icon size={17} className="text-[#022b3a]/60" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Dues Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">
            Residents with Outstanding Balances
            {dues.length > 0 && <span className="ml-2 text-xs text-[#1f7a8c]">({dues.length})</span>}
          </h2>
          <SearchBar value={search} onChange={setSearch} placeholder="Search resident or flat..." />
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title={search ? 'No results found' : 'No pending dues'}
            description={search
              ? 'Try a different search term.'
              : 'All residents are up to date with their payments!'}
            icon={CheckCircle}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {[
                      'Resident Name', 'Flat / Villa', 'Billing Month',
                      'Amount Assigned', 'Amount Paid', 'Balance Due', 'Due Date',
                      'Status', 'Actions'
                    ].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((d, idx) => (
                    <tr key={d.id ?? idx} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-sm text-[#022b3a]">{d.residentName}</p>
                      </td>
                      <td className="table-cell">
                        <p className="font-mono text-xs">{d.flatNumber}</p>
                        <p className="text-[10px] text-[#1f7a8c]">{d.propertyType}</p>
                      </td>
                      <td className="table-cell text-xs">{d.month}</td>
                      <td className="table-cell font-mono text-xs">{formatCurrency(d.assignedAmount ?? 0)}</td>
                      <td className="table-cell font-mono text-xs text-green-500">{formatCurrency(d.paidSoFar ?? 0)}</td>
                      <td className="table-cell font-mono text-xs text-red-400 font-semibold">{formatCurrency(d.remainingDue ?? 0)}</td>
                      <td className="table-cell text-xs">{formatDate(d.dueDate)}</td>
                      <td className="table-cell">{statusBadge(d.status)}</td>
                      <td className="table-cell">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleNotify(d.residentId)}
                            disabled={actionId === d.residentId}
                            title="Send reminder"
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all disabled:opacity-40">
                            <Bell size={12} />
                          </button>
                          {d.id && d.status !== 'OVERDUE' && (
                            <button
                              onClick={() => handlePenalty(d.id)}
                              disabled={actionId === d.id}
                              title="Apply late fee penalty"
                              className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-red-400 hover:bg-red-950/20 transition-all text-[10px] font-medium disabled:opacity-40">
                              +Fee
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}