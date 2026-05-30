import { useState, useEffect } from 'react'
import { AlertCircle, Bell, DollarSign, Home, TrendingDown, RefreshCw } from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import SearchBar from '../../components/common/SearchBar'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, getDaysOverdue } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

export default function PendingDues() {
  const [dues,     setDues]     = useState([])
  const [stats,    setStats]    = useState({ totalFlats: 0, paidFlats: 0 })
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [actionId, setActionId] = useState(null)
  const PER_PAGE = 10

  const fetchDues = async () => {
    setLoading(true)
    try {
      // Fetch pending dues list and dashboard stats in parallel
      const [duesRes, statsRes] = await Promise.allSettled([
        adminAPI.getPendingDues(),
        adminAPI.getDashboardStats(),
      ])

      if (duesRes.status === 'fulfilled') {
        const data = Array.isArray(duesRes.value.data)
          ? duesRes.value.data
          : (duesRes.value.data?.data ?? [])
        setDues(data)
      } else {
        // FIX: No mock data — show empty if API fails
        setDues([])
        toast.error('Could not load pending dues. Ensure the backend is running.')
      }

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data?.data ?? statsRes.value.data ?? {}
        setStats({ totalFlats: s.totalFlats ?? 0, paidFlats: s.flatsPaid ?? 0 })
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchDues() }, [])

  const handlePenalty = async (id) => {
    setActionId(id)
    try {
      await adminAPI.applyPenalty(id)
      toast.success('Late fee penalty applied')
      fetchDues()
    } catch { toast.error('Failed to apply penalty') }
    finally { setActionId(null) }
  }

  const handleNotify = async (id) => {
    setActionId(id)
    try {
      await adminAPI.sendDueNotification(id)
      toast.success('Reminder sent to resident')
    } catch { toast.error('Failed to send reminder') }
    finally { setActionId(null) }
  }

  const filtered = dues.filter(d =>
    (d.residentName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.flatNumber   ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // FIX: All calculations from real data — no hardcoded 60 flats or 3500
  const totalPending    = dues.reduce((s, d) => s + (d.dueAmount ?? 0), 0)
  const overdueCount    = dues.filter(d => d.status === 'OVERDUE').length
  // Collection rate = paid flats / total flats × 100 (from dashboard stats)
  const collectionRate  = stats.totalFlats > 0
    ? Math.round((stats.paidFlats / stats.totalFlats) * 100)
    : 0

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Pending Dues</h1>
          <p className="section-subtitle">Track overdue and pending maintenance payments</p>
        </div>
        <button onClick={fetchDues} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Analytics Cards — all from real data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Pending Amount', value: formatCurrency(totalPending), icon: DollarSign, sub: 'Unpaid maintenance dues' },
          { label: 'Overdue Flats',        value: `${overdueCount} flats`,      icon: Home,       sub: 'Past due date' },
          { label: 'Collection Rate',      value: `${collectionRate}%`,          icon: TrendingDown, sub: `${stats.paidFlats} of ${stats.totalFlats} flats paid` },
        ].map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="card card-hover">
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
            Residents with Pending Dues
            {dues.length > 0 && <span className="ml-2 text-xs text-[#1f7a8c]">({dues.length})</span>}
          </h2>
          <SearchBar value={search} onChange={setSearch} placeholder="Search resident or flat..." />
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title={search ? 'No results found' : 'No pending dues'}
            description={search ? 'Try a different search term.' : 'All residents are up to date with payments!'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Resident','Flat','Due Amount','Due Date','Days Overdue','Status','Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((d) => {
                    const daysOver = getDaysOverdue(d.dueDate)
                    return (
                      <tr key={d.id} className="table-row">
                        <td className="table-cell font-medium text-[#022b3a]">{d.residentName}</td>
                        <td className="table-cell font-mono text-xs">{d.flatNumber}</td>
                        <td className="table-cell font-mono text-[#022b3a]">{formatCurrency(d.dueAmount)}</td>
                        <td className="table-cell">{formatDate(d.dueDate)}</td>
                        <td className="table-cell">
                          {daysOver > 0
                            ? <span className="text-red-400 text-xs font-medium">{daysOver} days</span>
                            : <span className="text-[#1f7a8c] text-xs">—</span>}
                        </td>
                        <td className="table-cell">
                          <span className={d.status === 'OVERDUE' ? 'badge-overdue' : 'badge-pending'}>
                            {d.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleNotify(d.id)} disabled={actionId === d.id}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[#e1e5f2] text-[#022b3a] hover:bg-[#bfdbf7] hover:text-[#022b3a] transition-all border border-[#bfdbf7] disabled:opacity-50">
                              <Bell size={11} /> Notify
                            </button>
                            <button onClick={() => handlePenalty(d.id)} disabled={actionId === d.id}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[#e1e5f2] text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all border border-[#bfdbf7] disabled:opacity-50">
                              <AlertCircle size={11} /> Penalty
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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