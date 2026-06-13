import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, XCircle, Clock, RefreshCw, Eye,
  ImageIcon, AlertTriangle, ShieldCheck, ShieldX, User, Phone, IndianRupee
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import SearchBar, { FilterSelect } from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const fmt = (v) => {
  const n = Number(v ?? 0)
  if (isNaN(n)) return '₹0'
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const STATUS_OPTIONS = [
  { value: 'PENDING',  label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
]

function StatusBadge({ status }) {
  const map = {
    PENDING:  { cls: 'bg-yellow-950/40 border-yellow-800/50 text-yellow-400', icon: Clock,        label: 'Pending' },
    VERIFIED: { cls: 'bg-green-950/40 border-green-800/50 text-green-400',   icon: ShieldCheck,  label: 'Verified' },
    REJECTED: { cls: 'bg-red-950/40 border-red-800/50 text-red-400',         icon: ShieldX,      label: 'Rejected' },
  }
  const c = map[status] || map.PENDING
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${c.cls}`}>
      <Icon size={10} />{c.label}
    </span>
  )
}

function MethodBadge({ method }) {
  const map = {
    GPAY:          { label: 'GPay / UPI',    color: 'text-blue-400  bg-blue-950/30  border-blue-800/50' },
    CASH:          { label: 'Cash',          color: 'text-green-400 bg-green-950/30 border-green-800/50' },
    BANK_TRANSFER: { label: 'Bank Transfer', color: 'text-purple-400 bg-purple-950/30 border-purple-800/50' },
  }
  const c = map[method] || map.GPAY
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${c.color}`}>
      {c.label}
    </span>
  )
}

function ViewRequestModal({ request, open, onClose, onVerify, onReject, actionId }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject,   setShowReject]   = useState(false)

  if (!request) return null

  const screenshotUrl = request.screenshotUrl
    ? `${import.meta.env.VITE_API_BASE_URL || ''}/api${request.screenshotUrl.replace('/api', '')}`
    : null

  const handleReject = () => {
    onReject(request.id, rejectReason)
    setShowReject(false)
    setRejectReason('')
  }

  const method = request.paymentMethod || 'GPAY'
  const isCash = method === 'CASH'
  const isBank = method === 'BANK_TRANSFER'

  return (
    <Modal isOpen={open} onClose={onClose} title="Payment Verification Details" size="lg">
      <div className="space-y-4">
        {/* Payment method badge */}
        <div className="flex items-center gap-2">
          <MethodBadge method={method} />
          {isCash && request.paidToAdminName && (
            <span className="text-xs text-[#1f7a8c]">Paid to: <strong className="text-[#022b3a]">{request.paidToAdminName}</strong></span>
          )}
          {isBank && request.bankName && (
            <span className="text-xs text-[#1f7a8c]">Bank: <strong className="text-[#022b3a]">{request.bankName}</strong></span>
          )}
        </div>

        {/* Owner details */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Submitted By Resident',     value: request.submittedByLabel || request.submittedName },
            { label: 'Property Owner Name',     value: request.ownerName || '—' },
            { label: 'Flat / Villa Number',       value: request.flatNumber },
            { label: 'Phone',            value: request.phoneNumber },
            { label: 'Billing Month / Period',    value: request.paymentMonth },
            ...(!isCash ? [{ label: 'Transaction / Reference ID', value: request.transactionId, mono: true }] : []),
            ...(isCash  ? [{ label: 'Cash Received By', value: request.paidToAdminName || '—' }] : []),
            { label: 'Submitted On',        value: formatDate(request.createdAt) },
          ].map(({ label, value, mono }) => (
            <div key={label} className="p-3 bg-white rounded-xl border border-[#bfdbf7]">
              <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide mb-0.5">{label}</p>
              <p className={`text-sm font-semibold text-[#022b3a] ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
            </div>
          ))}
          <div className="col-span-2 p-3 bg-white rounded-xl border border-[#bfdbf7]">
            <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide mb-0.5">Payment Amount</p>
            <p className="text-2xl font-bold font-mono text-[#022b3a]">{fmt(request.paymentAmount)}</p>
          </div>
        </div>

        {/* Screenshot (not applicable for CASH) */}
        {!isCash && (
          screenshotUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#022b3a]">Payment Screenshot</p>
              <div className="border border-[#bfdbf7] rounded-xl overflow-hidden">
                {request.screenshotFileName?.toLowerCase().endsWith('.pdf') ? (
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-6 text-sm text-[#1f7a8c] hover:text-[#022b3a] transition-colors">
                    <Eye size={16} /> View PDF Screenshot
                  </a>
                ) : (
                  <img src={screenshotUrl} alt="Payment screenshot"
                    className="w-full max-h-64 object-contain bg-[#f0f8fb]"
                    onError={e => { e.target.style.display='none' }} />
                )}
              </div>
              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#1f7a8c] hover:text-[#022b3a] underline">
                Open in new tab
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-[#e1e5f2]/50 rounded-xl text-xs text-[#1f7a8c]">
              <ImageIcon size={13} /> No screenshot provided
            </div>
          )
        )}

        {isCash && (
          <div className="flex items-center gap-2 p-3 bg-green-950/20 border border-green-900/30 rounded-xl text-xs text-green-300">
            Cash payment — no screenshot required. Verify that you received the cash in person.
          </div>
        )}

        {request.rejectionReason && (
          <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-300">
            <AlertTriangle size={12} className="mt-0.5" />
            Rejection reason: {request.rejectionReason}
          </div>
        )}

        {/* Actions */}
        {request.status === 'PENDING' && (
          <>
            {!showReject ? (
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowReject(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/60 hover:bg-red-900 border border-red-800 text-white text-sm font-medium transition-all">
                  <ShieldX size={13} /> Reject
                </button>
                <button onClick={() => onVerify(request.id)} disabled={actionId === request.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-medium transition-all disabled:opacity-50">
                  {actionId === request.id
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <ShieldCheck size={13} />}
                  Verify Payment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label">Reason for Rejection (optional)</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    rows={2} placeholder="e.g. Amount mismatch, cash not received..."
                    className="input-field resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleReject} disabled={actionId === request.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-900 border border-red-800 text-white text-sm font-medium transition-all disabled:opacity-50">
                    {actionId === request.id
                      ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <ShieldX size={13} />}
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {request.status !== 'PENDING' && (
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        )}
      </div>
    </Modal>
  )
}

export default function PaymentVerification() {
  const [requests,     setRequests]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page,         setPage]         = useState(1)
  const [viewRequest,  setViewRequest]  = useState(null)
  const [actionId,     setActionId]     = useState(null)
  const PER_PAGE = 10

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const res  = await adminAPI.getPaymentVerificationRequests(
        statusFilter ? { status: statusFilter } : {})
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setRequests(data)
    } catch {
      toast.error('Could not load payment verification requests')
    } finally { setLoading(false); setRefreshing(false) }
  }, [statusFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleVerify = async (id) => {
    setActionId(id)
    try {
      await adminAPI.verifyPaymentRequest(id)
      toast.success('Payment verified! Record created and resident notified.')
      setViewRequest(null)
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally { setActionId(null) }
  }

  const handleReject = async (id, reason) => {
    setActionId(id)
    try {
      await adminAPI.rejectPaymentRequest(id, reason)
      toast.success('Request rejected. Resident notified.')
      setViewRequest(null)
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally { setActionId(null) }
  }

  const filtered = requests.filter(r =>
    (r.submittedName    ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.submittedByLabel ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.ownerName        ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.flatNumber       ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.transactionId    ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.paymentMethod    ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.paidToAdminName  ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const pendingCount  = requests.filter(r => r.status === 'PENDING').length
  const verifiedCount = requests.filter(r => r.status === 'VERIFIED').length
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title text-xl">Payment Verification Requests</h1>
          <p className="section-subtitle">Review and approve resident payment submissions by method</p>
        </div>
        <button onClick={() => fetchAll(true)} disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',  value: pendingCount,  icon: Clock,        color: 'text-yellow-400' },
          { label: 'Verified', value: verifiedCount, icon: CheckCircle,  color: 'text-green-400' },
          { label: 'Rejected', value: rejectedCount, icon: XCircle,      color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card card-hover text-center py-4 animate-pop-in">
            <Icon size={18} className={`mx-auto mb-1 ${color}`} />
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-[#1f7a8c] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert for pending */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-yellow-950/20 border border-yellow-900/40 rounded-xl">
          <Clock size={14} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-200">
            <strong>{pendingCount}</strong> payment{pendingCount > 1 ? 's' : ''} awaiting verification.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">
            Payment Approval Requests <span className="ml-1 text-xs text-[#1f7a8c]">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1) }}
              options={STATUS_OPTIONS} placeholder="All Status" />
            <SearchBar value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              placeholder="Name, flat, transaction…" />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title="No requests found"
            description={search || statusFilter
              ? 'Try different filters.'
              : 'Payment verification requests from residents will appear here.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Submitted By', 'Owner Detail', 'Flat', 'Phone', 'Amount', 'Method', 'Ref / Admin', 'Month', 'Screenshot', 'Status', 'Actions'].map(h => (
                      <th key={h} className="table-header text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell font-medium text-sm text-[#022b3a]">
                        {r.submittedByLabel || r.submittedName}
                      </td>
                      <td className="table-cell text-xs text-[#1f7a8c]">
                        {r.ownerName || '—'}
                      </td>
                      <td className="table-cell font-mono text-xs">{r.flatNumber}</td>
                      <td className="table-cell text-xs">{r.phoneNumber}</td>
                      <td className="table-cell font-mono text-sm text-[#022b3a] font-semibold">{fmt(r.paymentAmount)}</td>
                      <td className="table-cell"><MethodBadge method={r.paymentMethod || 'GPAY'} /></td>
                      <td className="table-cell font-mono text-xs text-[#1f7a8c]">
                        {r.paymentMethod === 'CASH'
                          ? (r.paidToAdminName || '—')
                          : (r.transactionId || '—')}
                      </td>
                      <td className="table-cell text-xs">{r.paymentMonth}</td>
                      <td className="table-cell">
                        {r.screenshotUrl
                          ? <span className="text-xs text-green-400 flex items-center gap-1"><ImageIcon size={11} /> Attached</span>
                          : <span className="text-xs text-[#022b3a]/30">None</span>}
                      </td>
                      <td className="table-cell"><StatusBadge status={r.status} /></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewRequest(r)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all"
                            title="View details">
                            <Eye size={13} />
                          </button>
                          {r.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleVerify(r.id)} disabled={actionId === r.id}
                                className="p-1.5 rounded-lg text-green-500 hover:bg-green-950/30 transition-all disabled:opacity-40"
                                title="Verify">
                                <ShieldCheck size={13} />
                              </button>
                              <button onClick={() => setViewRequest(r)} disabled={actionId === r.id}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-40"
                                title="Reject">
                                <ShieldX size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#bfdbf7]">
              {paginated.map(r => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-[#022b3a]">
                        {r.submittedByLabel || r.submittedName}
                      </p>
                      {r.ownerName && r.ownerName !== 'Owner' && (
                        <p className="text-xs text-[#1f7a8c]">Owner: {r.ownerName}</p>
                      )}
                      <p className="text-xs text-[#1f7a8c] font-mono">{r.flatNumber}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-[#1f7a8c]">Amount</p><p className="font-mono font-semibold">{fmt(r.paymentAmount)}</p></div>
                    <div><p className="text-[#1f7a8c]">Month</p><p>{r.paymentMonth}</p></div>
                    <div className="col-span-2"><p className="text-[#1f7a8c]">TXN ID</p><p className="font-mono">{r.transactionId}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewRequest(r)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg border border-[#bfdbf7] text-[#022b3a] hover:bg-[#e1e5f2]">
                      <Eye size={12} /> View
                    </button>
                    {r.status === 'PENDING' && (
                      <button onClick={() => handleVerify(r.id)} disabled={actionId === r.id}
                        className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-green-800 text-white disabled:opacity-50">
                        <ShieldCheck size={12} /> Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ViewRequestModal
        request={viewRequest}
        open={!!viewRequest}
        onClose={() => setViewRequest(null)}
        onVerify={handleVerify}
        onReject={handleReject}
        actionId={actionId}
      />
    </div>
  )
}