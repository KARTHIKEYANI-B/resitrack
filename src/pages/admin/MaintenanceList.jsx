import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Building2, Home, IndianRupee, Users,
  ChevronDown, ChevronUp, Calculator, CheckCircle, Clock,
  AlertCircle, XCircle
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import SearchBar from '../../components/common/SearchBar'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'

/* ── helpers ────────────────────────────────────────────────────── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function currentYM() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

const STATUS_STYLE = {
  PAID:    'bg-green-100 text-green-700 border-green-200',
  UNPAID:  'bg-red-100 text-red-600 border-red-200',
  // Legacy aliases — kept for backward compat with any cached data
  PENDING: 'bg-sky-100 text-sky-600 border-sky-200',
  OVERDUE: 'bg-orange-100 text-orange-600 border-orange-200',
}

const STATUS_ICON = {
  PAID:    <CheckCircle size={11} />,
  UNPAID:  <XCircle size={11} />,
  PENDING: <Clock size={11} />,
  OVERDUE: <AlertCircle size={11} />,
}

function resolveStatus(owner) {
  // Primary: trust the backend status string — it's set after the tolerance snap
  const backendStatus = (owner.paymentStatus ?? '').toUpperCase()
  if (backendStatus === 'PAID') return 'PAID'

  // Secondary: pendingAmount == 0 overrides any UNPAID status string
  const pending = owner.pendingAmount ?? null
  if (pending !== null && Number(pending) <= 0) return 'PAID'

  // Otherwise UNPAID (covers PENDING legacy values too)
  return 'UNPAID'
}

/* ── Summary card ────────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`card card-hover ${highlight ? 'border-sky-400' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {sub && <p className="text-xs text-[#1f7a8c] mt-1">{sub}</p>}
        </div>
        <div className="stat-icon"><Icon size={17} className="text-[#022b3a]/60" /></div>
      </div>
    </div>
  )
}

/* ── Owner table ─────────────────────────────────────────────────── */
function OwnerTable({ owners, search }) {
  const filtered = owners.filter(o =>
    (o.fullName   ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.flatNumber ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-[#1f7a8c]">
        {search ? 'No results match your search.' : 'No owners found.'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-[#bfdbf7] bg-white/50">
          <tr>
            {['S.No', 'Resident Name', 'Flat / Villa', 'Sq. Ft', 'Rate per Sq. Ft', 'Maintenance Amount', 'Amount Paid', 'Pending Balance', 'Status'].map(h => (
              <th key={h} className="table-header">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((o, idx) => {
            const status = resolveStatus(o)
            return (
              <tr key={o.residentId ?? idx} className="table-row">
                <td className="table-cell font-mono text-xs text-[#1f7a8c] text-center">
                  {idx + 1}
                </td>
                <td className="table-cell">
                  <p className="font-medium text-sm text-[#022b3a]">{o.fullName}</p>
                </td>
                <td className="table-cell">
                  <p className="font-mono text-xs">{o.flatNumber}</p>
                  <p className="text-[10px] text-[#1f7a8c]">{o.flatType || o.propertyType}</p>
                </td>
                <td className="table-cell font-mono text-xs">
                  {o.sqFt ? `${Number(o.sqFt).toLocaleString('en-IN')} sq.ft` : '—'}
                </td>
                <td className="table-cell font-mono text-xs">
                  {o.ratePerSqFt ? `₹${Number(o.ratePerSqFt).toFixed(2)}` : '—'}
                </td>
                <td className="table-cell font-mono text-xs font-semibold text-[#022b3a]">
                  {formatCurrency(o.maintenanceAmount ?? 0)}
                  {/* {o.sqFt && o.ratePerSqFt && (
                    <p className="text-[9px] text-[#1f7a8c] font-normal mt-0.5">
                      {Number(o.sqFt).toLocaleString('en-IN')} × ₹{Number(o.ratePerSqFt).toFixed(2)}
                    </p>
                  )} */}
                </td>
                {/* Paid amount – green; shows property-level total (owner + FM) */}
                <td className="table-cell font-mono text-xs text-green-600">
                  {formatCurrency(o.paidAmount ?? 0)}
                </td>
                {/* Pending amount – red; 0.00 when status = PAID */}
                <td className="table-cell font-mono text-xs font-semibold"
                    style={{ color: (o.pendingAmount ?? 0) > 0 ? '#ef4444' : '#16a34a' }}>
                  {formatCurrency(o.pendingAmount ?? 0)}
                </td>
                {/* Status badge – derived purely from pendingAmount on the backend */}
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[status] ?? STATUS_STYLE.UNPAID}`}>
                    {STATUS_ICON[status]}
                    {status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Section (collapsible group) ─────────────────────────────────── */
function Section({ title, icon: Icon, owners, search, totalAmount, paidCount, totalCount }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-cyan-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-sky-600" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#022b3a]">{title}</p>
          <p className="text-xs text-[#1f7a8c]">
            {totalCount} owner{totalCount !== 1 ? 's' : ''} · {paidCount} paid · Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        {open ? <ChevronUp size={14} className="text-sky-400" /> : <ChevronDown size={14} className="text-sky-400" />}
      </button>

      {open && (
        <div className="border-t border-cyan-100">
          <OwnerTable owners={owners} search={search} />
        </div>
      )}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function MaintenanceList() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selYear,  setSelYear]  = useState(currentYM().year)
  const [selMonth, setSelMonth] = useState(currentYM().month)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getMaintenanceOwnerList(selYear, selMonth)
      const payload = res.data?.data ?? res.data
      setData(payload)
    } catch {
      toast.error('Could not load maintenance list')
    } finally {
      setLoading(false)
    }
  }, [selYear, selMonth])

  useEffect(() => { load() }, [load])

  /* year options: current year ± 2 */
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYM().year - 2 + i)

  if (loading) return <PageLoader />

  const flatOwners  = data?.flatOwners  ?? []
  const villaOwners = data?.villaOwners ?? []
  const ratePerSqFt = data?.ratePerSqFt
  const monthLabel  = data?.monthLabel ?? `${MONTHS[selMonth - 1]} ${selYear}`

  const totalFlat   = data?.totalFlatMaintenance  ?? 0
  const totalVilla  = data?.totalVillaMaintenance ?? 0
  const grandTotal  = data?.grandTotal            ?? 0

  // Recompute paid counts from pendingAmount (source of truth) rather than
  // trusting the backend summary counts, which can lag behind if the status
  // string is out of sync with the actual pending amount.
  const paidFlat    = flatOwners.filter(o  => resolveStatus(o) === 'PAID').length
  const paidVilla   = villaOwners.filter(o => resolveStatus(o) === 'PAID').length

  const totalOwners = flatOwners.length + villaOwners.length
  const totalPaid   = paidFlat + paidVilla
  const totalUnpaid = totalOwners - totalPaid

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Monthly Maintenance Billing Summary</h1>
          <p className="section-subtitle">
            Per-owner maintenance breakdown for {monthLabel}
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Month selector */}
      <div className="card flex flex-wrap items-center gap-3">
        <Calculator size={15} className="text-[#1f7a8c]" />
        <p className="text-sm font-medium text-[#022b3a]">Select Period:</p>
        <select
          value={selMonth}
          onChange={e => setSelMonth(Number(e.target.value))}
          className="input-field text-sm py-1.5 w-40"
        >
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={selYear}
          onChange={e => setSelYear(Number(e.target.value))}
          className="input-field text-sm py-1.5 w-28"
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {ratePerSqFt && (
          <div className="ml-auto flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-1.5">
            <IndianRupee size={12} className="text-sky-600" />
            <span className="text-xs text-sky-700 font-medium">
              Rate: ₹{Number(ratePerSqFt).toFixed(2)} / sq.ft
            </span>
          </div>
        )}
      </div>

      {/* Status legend */}
      {/* <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
          <CheckCircle size={11} /> PAID – Pending Amount = ₹0
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">
          <XCircle size={11} /> UNPAID – Balance remaining
        </span>
      </div> */}

      {/* Formula info */}
      {/* {ratePerSqFt && (
        <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
          <Calculator size={14} className="text-sky-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-sky-700">
            <span className="font-semibold">Calculation Formula: </span>
            Maintenance Amount = Owner's Sq. Ft × Rate per Sq. Ft (₹{Number(ratePerSqFt).toFixed(2)})
            &nbsp;·&nbsp;
            <span className="font-semibold">Status Rule: </span>
            Pending Amount = 0 → PAID (includes Family Member payments)
          </p>
        </div>
      )} */}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
        <SummaryCard
          icon={IndianRupee}
          label="Total Maintenance Amount Due"
          value={formatCurrency(grandTotal)}
          sub={`${totalOwners} owners`}
          highlight
        />
        <SummaryCard
          icon={Building2}
          label="Total Due — Flat Owners"
          value={formatCurrency(totalFlat)}
          sub={`${flatOwners.length} flat owner${flatOwners.length !== 1 ? 's' : ''}`}
        />
        <SummaryCard
          icon={Home}
          label="Total Due — Villa Owners"
          value={formatCurrency(totalVilla)}
          sub={`${villaOwners.length} villa owner${villaOwners.length !== 1 ? 's' : ''}`}
        />
        <SummaryCard
          icon={Users}
          label="Payment Completion Rate"
          value={`${totalPaid} / ${totalOwners}`}
          sub={`${totalUnpaid} pending`}
        />
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <SearchBar value={search} onChange={setSearch} placeholder="Search owner or flat..." />
      </div>

      {/* Flat Owners section */}
      <Section
        title="Flat Owner Billing"
        icon={Building2}
        owners={flatOwners}
        search={search}
        totalAmount={totalFlat}
        paidCount={paidFlat}
        totalCount={flatOwners.length}
      />

      {/* Villa Owners section */}
      <Section
        title="Villa Owner Billing"
        icon={Home}
        owners={villaOwners}
        search={search}
        totalAmount={totalVilla}
        paidCount={paidVilla}
        totalCount={villaOwners.length}
      />

      {totalOwners === 0 && (
        <div className="card text-center py-12">
          <Users size={32} className="text-[#bfdbf7] mx-auto mb-3" />
          <p className="text-sm text-[#1f7a8c]">No active owners found.</p>
          <p className="text-xs text-[#1f7a8c]/60 mt-1">
            Approve residents and set a maintenance rate to see the list.
          </p>
        </div>
      )}
    </div>
  )
}