import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, XCircle, Clock, Plus, RefreshCw,
  UserCheck, AlertTriangle, TrendingUp,
  Smartphone, Building2, Banknote,
  ShieldCheck, ShieldX, IndianRupee,
  ArrowDownCircle, ArrowUpCircle, Receipt as ReceiptIcon,
  Trash2
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../../components/common/LoadingSpinner'
import SearchBar, { FilterSelect } from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

/* ── Constants — CARD removed ────────────────────────────────────────── */
const TXN_TYPE_OPTIONS = [
  { value: 'INCOME',  label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
]
const PAYMENT_MODES = [
  { value: 'UPI',           label: 'UPI',          icon: Smartphone },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
  { value: 'CASH',          label: 'Cash',          icon: Banknote },
]
const MONTH_OPTIONS = (() => {
  const opts = []; const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    })
  }
  return opts
})()

// Full amount formatter — no abbreviated formats
const fmt = (v) => {
  const n = Number(v ?? 0)
  if (isNaN(n)) return '₹0'
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/* ── Transaction type badge (Income / Expense) ───────────────────────── */
function TransactionTypeBadge({ type }) {
  const isIncome = type === 'INCOME'
  const cls = isIncome
    ? 'bg-green-950/50 border-green-800/50 text-green-400'
    : 'bg-red-950/50 border-red-800/50 text-red-400'
  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      <Icon size={10} />{isIncome ? 'Income' : 'Expense'}
    </span>
  )
}

/* ── Collection Progress Bar ─────────────────────────────────────────── */
function CollectionBar({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color = clamped >= 80 ? 'bg-green-500' : clamped >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full bg-[#e1e5f2] rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

/* ── Total Collected Amount Card (Bank / Cash breakdown) ─────────────── */
function BalanceSummaryCard({ totalCollected, bankBalance, cashBalance }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[#022b3a] flex items-center gap-2">
          <IndianRupee size={14} /> Total Collected Amount
        </p>
      </div>
      <p className="text-2xl font-bold font-mono text-[#022b3a] mt-1">{fmt(totalCollected)}</p>
      <p className="text-[10px] text-[#1f7a8c] mb-2">Total Collected (this month)</p>
      <div className="space-y-1 pt-2 border-t border-[#bfdbf7]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#1f7a8c] flex items-center gap-1">
            <Smartphone size={10} /> Bank Collected (UPI + Bank Transfer)
          </span>
          <span className="text-xs font-mono font-semibold text-[#022b3a]">{fmt(bankBalance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#1f7a8c] flex items-center gap-1">
            <Banknote size={10} /> Cash Collected
          </span>
          <span className="text-xs font-mono font-semibold text-[#022b3a]">{fmt(cashBalance)}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Add Payment Modal — CARD removed ───────────────────────────────── */
function AddPaymentModal({ open, onClose, onSuccess }) {
  const today        = new Date().toISOString().split('T')[0]
  const currentMonth = MONTH_OPTIONS[0]?.value || ''
  const [form, setForm] = useState({
    ownerName: '', ownerPhone: '', paymentMode: 'UPI', paidAmount: '',
    paymentDate: today, paymentMonth: currentMonth,
    verifiedByAdmin: false, transactionId: '', description: '',
  })
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.ownerName.trim())   e.ownerName  = 'Owner name is required'
    if (!form.ownerPhone.trim())  e.ownerPhone = 'Phone number is required'
    if (!/^[6-9]\d{9}$/.test(form.ownerPhone.trim())) e.ownerPhone = 'Enter valid 10-digit mobile number'
    if (!form.paidAmount || isNaN(form.paidAmount) || Number(form.paidAmount) <= 0)
      e.paidAmount = 'Enter a valid amount > 0'
    if (!form.paymentDate)        e.paymentDate  = 'Payment date is required'
    if (!form.paymentMonth)       e.paymentMonth = 'Billing month is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    try {
      await adminAPI.createAdminPayment({
        ownerName: form.ownerName.trim(), ownerPhone: form.ownerPhone.trim(),
        paymentMode: form.paymentMode, paidAmount: parseFloat(form.paidAmount),
        paymentDate: form.paymentDate, paymentMonth: form.paymentMonth,
        verifiedByAdmin: form.verifiedByAdmin,
        transactionId: form.transactionId.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      toast.success(form.verifiedByAdmin
        ? 'Payment recorded & verified!'
        : 'Payment recorded. Pending verification.')
      onSuccess(); onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record payment'
      toast.error(msg)
      if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('resident'))
        setErrors(e => ({ ...e, ownerPhone: msg }))
    } finally { setSubmitting(false) }
  }

  const Err = ({ f }) => errors[f] ? <p className="text-xs text-red-400 mt-1">{errors[f]}</p> : null

  return (
    <Modal isOpen={open} onClose={onClose} title="Record Payment">
      <div className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-[#e1e5f2]/50 border border-[#bfdbf7] rounded-xl text-xs text-[#1f7a8c]">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-yellow-500" />
          Phone must match a registered & approved resident.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Resident Name *</label>
            <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="Full name" className="input-field" />
            <Err f="ownerName" />
          </div>
          <div>
            <label className="label">Mobile Number *</label>
            <input value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" className="input-field font-mono" maxLength={10} />
            <Err f="ownerPhone" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Billing Month / Period *</label>
            <select value={form.paymentMonth} onChange={e => set('paymentMonth', e.target.value)} className="input-field">
              {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Err f="paymentMonth" />
          </div>
          <div>
            <label className="label">Payment Amount (₹) *</label>
            <input type="number" value={form.paidAmount} onChange={e => set('paidAmount', e.target.value)} placeholder="e.g. 3500" className="input-field font-mono" min="1" />
            <Err f="paidAmount" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Payment Method *</label>
            <select value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)} className="input-field">
              {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment Date *</label>
            <input type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} className="input-field" />
            <Err f="paymentDate" />
          </div>
        </div>
        <div>
          <label className="label">Transaction / Reference ID (optional)</label>
          <input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="UPI ref / bank ref" className="input-field font-mono" />
        </div>
        <div>
          <label className="label">Remarks (optional)</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Notes" className="input-field" />
        </div>
        <label className="flex items-center gap-3 p-3 bg-[#e1e5f2]/50 rounded-xl border border-[#bfdbf7] cursor-pointer hover:bg-[#bfdbf7]/40 transition-all">
          <input type="checkbox" checked={form.verifiedByAdmin} onChange={e => set('verifiedByAdmin', e.target.checked)} className="w-4 h-4 rounded" />
          <div>
            <p className="text-xs font-semibold text-[#022b3a]">Mark as verified (auto-approve)</p>
            <p className="text-[10px] text-[#1f7a8c]">Receipt generated immediately; analytics updated.</p>
          </div>
          {form.verifiedByAdmin && <ShieldCheck size={16} className="text-green-400" />}
        </label>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
            Record Payment
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function PaymentTracking() {
  const { isSuperAdmin } = useAuth()
  const [payments,      setPayments]     = useState([])
  const [transactions,  setTransactions] = useState([])
  const [trackStats,    setTrackStats]   = useState(null)
  const [loading,       setLoading]      = useState(true)
  const [refreshing,    setRefreshing]   = useState(false)
  const [search,        setSearch]       = useState('')
  const [txnTypeFilter, setTxnTypeFilter] = useState('')
  const [methodFilter,  setMethodFilter] = useState('')
  const [page,          setPage]         = useState(1)
  const [showAdd,       setShowAdd]      = useState(false)
  const [rejectModal,   setRejectModal]  = useState(null)
  const [rejectReason,  setRejectReason] = useState('')
  const [actionId,      setActionId]     = useState(null)
  const [deleteTarget,  setDeleteTarget] = useState(null) // payment row pending delete confirmation
  const [deletingId,    setDeletingId]   = useState(null)
  const PER_PAGE = 10

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const [pmtsRes, statsRes, txnRes] = await Promise.allSettled([
        adminAPI.getAllPayments({}),
        adminAPI.getPaymentTrackingStats ? adminAPI.getPaymentTrackingStats() : Promise.reject(),
        adminAPI.getTransactionLedger ? adminAPI.getTransactionLedger() : Promise.reject(),
      ])
      if (pmtsRes.status === 'fulfilled') {
        const d = pmtsRes.value.data
        setPayments(Array.isArray(d) ? d : (d?.data ?? []))
      }
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data
        setTrackStats(d?.data ?? d)
      }
      if (txnRes.status === 'fulfilled') {
        const d = txnRes.value.data
        setTransactions(Array.isArray(d) ? d : (d?.data ?? []))
      }
    } catch {
      if (!silent) toast.error('Could not load payments.')
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await adminAPI.approvePayment(id)
      toast.success('Payment approved! Receipt generated.')
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    } finally { setActionId(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionId(rejectModal.id)
    try {
      await adminAPI.rejectPayment(rejectModal.id, rejectReason)
      toast.success('Payment rejected.')
      setRejectModal(null); fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally { setActionId(null) }
  }

  // Super Admin only — permanently removes the payment row from the
  // database; every dashboard/summary/report total reads the payments
  // table directly, so the deleted amount disappears everywhere on the
  // next fetchAll(true) below.
  const handleDeletePayment = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.sourceId)
    try {
      await adminAPI.deletePayment(deleteTarget.sourceId)
      toast.success('Payment record deleted.')
      setDeleteTarget(null)
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment')
    } finally { setDeletingId(null) }
  }

  // Pending-verification items still come from the regular payments feed —
  // this is unrelated to the new ledger (which only ever shows realized
  // PAID transactions + expenses) and preserves the existing approve/reject
  // capability for admin-recorded-but-unverified payments on this page.
  const pendingVerificationList = payments.filter(p => p.paymentStatus === 'PENDING_VERIFICATION')

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase()
    return ((t.residentName ?? '').toLowerCase().includes(q) ||
            (t.flatNumber   ?? '').toLowerCase().includes(q) ||
            (t.category     ?? '').toLowerCase().includes(q) ||
            (t.description  ?? '').toLowerCase().includes(q))
      && (!txnTypeFilter || t.type === txnTypeFilter)
      && (!methodFilter  || t.paymentMethod === methodFilter)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const ts = trackStats || null
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`
  const paidLocal    = payments.filter(p => p.paymentStatus === 'PAID' && p.paymentMonth === currentMonth).length
  const pendVerif    = pendingVerificationList.length
  const totalCollected = ts?.totalCollectedThisMonth ?? payments
    .filter(p => p.paymentStatus === 'PAID' && p.paymentMonth === currentMonth)
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)

  // Bank / Cash collection: always use server-computed values from tracking-stats.
  // The server sums directly from Payment records (PAID, current calendar month,
  // paymentDate-based) using the full set of bank methods (UPI, BANK_TRANSFER,
  // NEFT, RTGS, IMPS, Cheque, Online Banking, etc.).
  // Local fallback covers only UPI + BANK_TRANSFER so it is intentionally unused
  // when the server value is available.
  const bankCollected = ts?.bankCollectedThisMonth ?? payments
    .filter(p => p.paymentStatus === 'PAID' && p.paymentMonth === currentMonth
              && p.paymentMethod && p.paymentMethod.toUpperCase() !== 'CASH')
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const cashCollected = ts?.cashCollectedThisMonth ?? payments
    .filter(p => p.paymentStatus === 'PAID' && p.paymentMonth === currentMonth
              && p.paymentMethod && p.paymentMethod.toUpperCase() === 'CASH')
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)

  // ── Task 1: Annual Pending Dues ──────────────────────────────────────────
  // annualPendingDues = totalExpectedYTD − totalCollectedYTD
  // Backend computes: activeOwners × maintAmount × completedMonths − actualCollectedJan–prevMonth
  const annualPendingDues = ts?.annualPendingDues ?? ts?.totalPendingAmount ?? 0
  const totalExpectedYTD  = ts?.totalExpectedYTD  ?? 0
  const totalCollectedYTD = ts?.totalCollectedYTD ?? 0

  const statsCards = [
    { label: 'Active Owners',        value: ts?.totalActiveOwners   ?? '—',         icon: UserCheck },
    { label: 'Paid This Month',      value: ts?.paidOwners          ?? paidLocal,   icon: CheckCircle, green: true },
    { label: 'Pending Verification', value: ts?.pendingVerification ?? pendVerif,   icon: Clock, yellow: (ts?.pendingVerification ?? pendVerif) > 0 },
  ]

  const collPct = ts?.collectionPercentage ?? (paidLocal > 0 && payments.length > 0 ? (paidLocal / payments.length * 100) : 0)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Payment Management</h1>
          <p className="section-subtitle">
            Income and expense transaction ledger · {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchAll(true)} disabled={refreshing} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Add Payment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statsCards.map(({ label, value, icon: Icon, green, red, yellow }) => (
          <div key={label} className={`card card-hover text-center py-3 px-2 border ${
            yellow ? 'border-yellow-900/40' : red ? 'border-red-900/40' : 'border-transparent'}`}>
            <Icon size={16} className={`mx-auto mb-1 ${green ? 'text-green-400' : yellow ? 'text-yellow-400' : red ? 'text-red-400' : 'text-[#022b3a]/40'}`} />
            <p className="text-xl font-bold font-mono text-[#022b3a]">
              {value}
            </p>
            <p className="text-[10px] text-[#1f7a8c] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Collection Rate + Total Collected Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#022b3a] flex items-center gap-2">
              <TrendingUp size={14} /> Collection Rate
            </p>
            <p className="text-lg font-bold font-mono text-[#022b3a]">
              {collPct.toFixed(1)}%
            </p>
          </div>
          <CollectionBar pct={collPct} />
          <p className="text-xs text-[#1f7a8c] mt-2">
            {ts?.paidOwners ?? paidLocal} of {ts?.totalActiveOwners ?? '?'} active owners paid this month
          </p>
        </div>

        {/* Total Collected Amount with Bank / Cash breakdown */}
        <BalanceSummaryCard
          totalCollected={ts?.totalCollectedThisMonth ?? totalCollected}
          bankBalance={bankCollected}
          cashBalance={cashCollected}
        />
      </div>

      {/* Pending Verification — preserves the existing approve/reject
          capability for admin-recorded-but-unverified payments on this
          page. Separate from, and unaffected by, the Payment Verification
          page's own screenshot-based workflow. */}
      {pendingVerificationList.length > 0 && (
        <div className="card p-0 overflow-hidden border border-yellow-900/40">
          <div className="flex items-center gap-2 p-4 border-b border-[#bfdbf7] bg-yellow-950/10">
            <Clock size={14} className="text-yellow-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-[#022b3a]">
              Pending Verification
              <span className="ml-2 text-xs font-normal text-[#1f7a8c]">({pendingVerificationList.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-[#bfdbf7]">
            {pendingVerificationList.map(p => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm text-[#022b3a]">{p.residentName ?? '—'}</p>
                    <p className="text-xs text-[#1f7a8c] font-mono">{p.flatNumber ?? '—'} · {fmt(p.amount ?? 0)} · {p.paymentMonth}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(p.id)} disabled={actionId === p.id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-950/30 text-green-400 hover:bg-green-950/60 border border-green-900/50 disabled:opacity-50 transition-all">
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(p); setRejectReason('') }} disabled={actionId === p.id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-950/60 border border-red-900/50 disabled:opacity-50 transition-all">
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Transaction Ledger — income (owner maintenance payments +
          maintenance batch payments) and expenses, sorted by transaction
          date descending. Read directly from GET /admin/payments/transactions,
          which itself only reads existing PAID Payment / BatchPayment /
          Expense rows — no hardcoded values. */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">
            Transaction Ledger
            <span className="ml-2 text-xs font-normal text-[#1f7a8c]">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={txnTypeFilter} onChange={v => { setTxnTypeFilter(v); setPage(1) }} options={TXN_TYPE_OPTIONS} placeholder="All Types" />
            <FilterSelect value={methodFilter} onChange={v => { setMethodFilter(v); setPage(1) }} options={PAYMENT_MODES.map(m => ({ value: m.value, label: m.label }))} placeholder="All Methods" />
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Name, flat, category…" />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            icon={ReceiptIcon}
            title="No transactions found"
            description={search || txnTypeFilter || methodFilter ? 'Try different filters.' : 'Income and expense records will appear here once payments are verified or expenses are added.'}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full rt-table-animate">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['S.No', 'Date', 'Type', 'Category', 'Description', 'Resident Name', 'Flat / Villa', 'Amount'].map(h => (
                      <th key={h} className="table-header text-xs">{h}</th>
                    ))}
                    {/* Super Admin only — Admins, Owners, Family Members, and
                        Security never see this column. */}
                    {isSuperAdmin && <th className="table-header text-xs">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(t => (
                    <tr key={`${t.sourceType}-${t.sourceId}`} className="table-row">
                      <td className="table-cell text-xs text-[#022b3a]/60 font-mono">{t.serialNo}</td>
                      <td className="table-cell text-xs text-[#022b3a]/70">{formatDate(t.date)}</td>
                      <td className="table-cell"><TransactionTypeBadge type={t.type} /></td>
                      <td className="table-cell">
                        <p className="text-sm text-[#022b3a]">{t.category ?? '—'}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-xs text-[#1f7a8c] max-w-[220px] truncate" title={t.description}>{t.description ?? '—'}</p>
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-[#022b3a] text-sm">{t.residentName ?? '—'}</p>
                      </td>
                      <td className="table-cell font-mono text-xs">{t.flatNumber ?? '—'}</td>
                      <td className="table-cell font-mono text-sm font-semibold text-[#022b3a]">
                        {fmt(t.amount ?? 0)}
                      </td>
                      {isSuperAdmin && (
                        <td className="table-cell">
                          {/* Only owner monthly maintenance payments are deletable here —
                              maintenance batch payments and expenses are separate records
                              with their own management screens and are left untouched. */}
                          {t.sourceType === 'MAINTENANCE_PAYMENT' ? (
                            <button
                              onClick={() => setDeleteTarget(t)}
                              disabled={deletingId === t.sourceId}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-950/60 border border-red-900/50 disabled:opacity-50 transition-all">
                              <Trash2 size={11} /> Delete
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#022b3a]/30">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#bfdbf7]">
              {paginated.map(t => (
                <div key={`${t.sourceType}-${t.sourceId}`} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-[#1f7a8c] font-mono">#{t.serialNo} · {formatDate(t.date)}</p>
                      <p className="font-semibold text-sm text-[#022b3a] mt-0.5">{t.category ?? '—'}</p>
                    </div>
                    <TransactionTypeBadge type={t.type} />
                  </div>
                  <p className="text-xs text-[#1f7a8c]">{t.description ?? '—'}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {(t.residentName || t.flatNumber) && (
                      <div>
                        <p className="text-[#1f7a8c]">Resident</p>
                        <p className="text-[#022b3a]">{t.residentName ?? '—'} {t.flatNumber ? `· ${t.flatNumber}` : ''}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#1f7a8c]">Amount</p>
                      <p className="font-mono font-semibold text-[#022b3a]">
                        {fmt(t.amount ?? 0)}
                      </p>
                    </div>
                  </div>
                  {/* Super Admin only — Admins, Owners, Family Members, and
                      Security never see this action. Only owner monthly
                      maintenance payments are deletable here. */}
                  {isSuperAdmin && t.sourceType === 'MAINTENANCE_PAYMENT' && (
                    <button
                      onClick={() => setDeleteTarget(t)}
                      disabled={deletingId === t.sourceId}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-950/60 border border-red-900/50 disabled:opacity-50 transition-all mt-1">
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Payment">
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-xl border border-[#bfdbf7] text-sm">
              <p className="text-[#022b3a]/60">Rejecting payment from <strong className="text-[#022b3a]">{rejectModal.residentName}</strong></p>
              <p className="text-[#1f7a8c] text-xs mt-1">{fmt(rejectModal.amount)} · {rejectModal.paymentMonth}</p>
            </div>
            <div>
              <label className="label">Rejection Reason (optional)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Payment reference not found..." rows={3} className="input-field resize-none" />
            </div>
            <p className="text-xs text-[#1f7a8c]">Resident will be notified and payment reverts to PENDING.</p>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={!!actionId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-900 border border-red-800 text-white text-sm font-medium transition-all disabled:opacity-50">
                {actionId ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <ShieldX size={13} />}
                Confirm Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Payment Modal — Super Admin only, irreversible */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Payment Record">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-red-950/10 border border-red-900/40 rounded-xl text-xs text-red-400">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>This permanently removes the payment from the database. It cannot be undone, and the amount will disappear from Dashboard, Maintenance Summary, Financial Summary, Payment Management, and Paid/Unpaid Details immediately.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#bfdbf7] text-sm">
              <p className="text-[#022b3a]/60">
                Payment from <strong className="text-[#022b3a]">{deleteTarget.residentName ?? '—'}</strong>
                {deleteTarget.flatNumber ? <span className="font-mono"> · {deleteTarget.flatNumber}</span> : null}
              </p>
              <p className="text-[#1f7a8c] text-xs mt-1 font-mono">
                {fmt(deleteTarget.amount)} · {deleteTarget.paymentMethod ?? '—'} · {deleteTarget.date ? formatDate(deleteTarget.date) : '—'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeletePayment} disabled={!!deletingId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-900 border border-red-800 text-white text-sm font-medium transition-all disabled:opacity-50">
                {deletingId ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={13} />}
                Permanently Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <AddPaymentModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => fetchAll(true)} />
    </div>
  )
}