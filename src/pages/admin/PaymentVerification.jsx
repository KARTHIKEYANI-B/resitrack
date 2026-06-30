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
    UPI:           { label: 'UPI',           color: 'text-blue-400  bg-blue-950/30  border-blue-800/50' },
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

/* Distinguishes Maintenance Batch payments (separate table/workflow) from
   regular Monthly Maintenance verification requests, at a glance. */
function SourceBadge({ source }) {
  if (source === 'BATCH') {
    return (
      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium text-amber-600 bg-amber-50 border-amber-200">
        Maintenance Batch
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium text-sky-600 bg-sky-50 border-sky-200">
      Monthly Maintenance
    </span>
  )
}

function ViewRequestModal({ request, open, onClose, onVerify, onReject, actionId }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject,   setShowReject]   = useState(false)
  const [screenshotBlobUrl, setScreenshotBlobUrl] = useState(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [screenshotError,   setScreenshotError]   = useState(false)

  // The screenshot endpoint is ADMIN-protected (Authorization: Bearer <token>).
  // A plain <img src>/<a href> pointed straight at that URL can't send the
  // token, so the browser hits it unauthenticated and Spring Security returns
  // 403. Fetch it through the authenticated axios instance instead and turn
  // the response into a local blob URL the <img>/<a> tags can safely use.
  useEffect(() => {
    let cancelled  = false
    let objectUrl  = null

    setScreenshotBlobUrl(null)
    setScreenshotError(false)

    if (request?.screenshotUrl && request?.id) {
      setScreenshotLoading(true)
      adminAPI.getPaymentScreenshot(request.id)
        .then(res => {
          if (cancelled) return
          objectUrl = URL.createObjectURL(res.data)
          setScreenshotBlobUrl(objectUrl)
        })
        .catch(() => { if (!cancelled) setScreenshotError(true) })
        .finally(() => { if (!cancelled) setScreenshotLoading(false) })
    }

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [request?.id, request?.screenshotUrl])

  if (!request) return null

  const screenshotUrl = screenshotBlobUrl

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
        {/* Source + payment method badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge source={request.source} />
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
            ...(request.source !== 'BATCH' ? [{ label: 'Phone', value: request.phoneNumber }] : []),
            { label: request.source === 'BATCH' ? 'Batch Name' : 'Billing Month / Period',
              value: request.paymentMonth },
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
          request.screenshotUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#022b3a]">Payment Screenshot</p>
              <div className="border border-[#bfdbf7] rounded-xl overflow-hidden">
                {screenshotLoading ? (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-[#1f7a8c]">
                    <div className="w-4 h-4 border-2 border-[#1f7a8c]/30 border-t-[#1f7a8c] rounded-full animate-spin" />
                    Loading screenshot…
                  </div>
                ) : screenshotError ? (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-red-500">
                    <AlertTriangle size={14} /> Could not load screenshot
                  </div>
                ) : request.screenshotFileName?.toLowerCase().endsWith('.pdf') ? (
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
              {screenshotUrl && (
                <div className="flex items-center gap-3">
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#1f7a8c] hover:text-[#022b3a] underline">
                    Open in new tab
                  </a>
                  <a href={screenshotUrl} download={request.screenshotFileName || 'payment-screenshot'}
                    className="text-xs text-[#1f7a8c] hover:text-[#022b3a] underline">
                    Download
                  </a>
                </div>
              )}
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
      // ── Monthly maintenance verification requests (unchanged source) ────
      const monthlyRes  = await adminAPI.getPaymentVerificationRequests(
        statusFilter ? { status: statusFilter } : {})
      const monthlyData = Array.isArray(monthlyRes.data) ? monthlyRes.data : (monthlyRes.data?.data ?? [])
      const monthly = monthlyData.map(r => ({ ...r, source: 'MONTHLY' }))

      // ── Maintenance Batch payments awaiting verification ─────────────────
      // Separate table/endpoint entirely (batch_payments, never the monthly
      // payments/payment_verification_requests tables). Only fetched here
      // for PENDING status or no filter — VERIFIED/REJECTED batch payments
      // already live in the Maintenance Batch page's own Paid List, so we
      // don't duplicate them into this screen's history view.
      let batch = []
      if (!statusFilter || statusFilter === 'PENDING') {
        try {
          const batchRes  = await adminAPI.getBatchPendingVerification()
          const batchData = Array.isArray(batchRes.data?.data) ? batchRes.data.data
            : Array.isArray(batchRes.data) ? batchRes.data : []
          batch = batchData.map(b => ({
            id:               `batch-${b.batchPaymentId}`,
            rawId:            b.batchPaymentId,
            source:           'BATCH',
            submittedName:    b.familyMemberName || b.ownerName,
            submittedByLabel: b.familyMemberName
              ? `${b.familyMemberName} (Family Member)`
              : `${b.ownerName} (Owner)`,
            ownerName:        b.ownerName,
            flatNumber:       b.flatNumber,
            paymentAmount:    b.amount,
            transactionId:    b.transactionId,
            paymentMethod:    b.paymentMethod,
            paymentMonth:     b.batchTitle,     // batch name shown where "month" appears
            batchTitle:       b.batchTitle,
            batchId:          b.batchId,
            status:           'PENDING',
            createdAt:        b.submittedDate,
          }))
        } catch { /* batch feed is additive — never blocks the monthly list */ }
      }

      setRequests([...batch, ...monthly])
    } catch {
      toast.error('Could not load payment verification requests')
    } finally { setLoading(false); setRefreshing(false) }
  }, [statusFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleVerify = async (id) => {
    const target = requests.find(r => r.id === id)
    setActionId(id)
    try {
      if (target?.source === 'BATCH') {
        await adminAPI.verifyBatchPayment(target.rawId)
        toast.success('Batch payment verified! Paid count updated.')
      } else {
        await adminAPI.verifyPaymentRequest(id)
        toast.success('Payment verified! Record created and resident notified.')
      }
      setViewRequest(null)
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally { setActionId(null) }
  }

  const handleReject = async (id, reason) => {
    const target = requests.find(r => r.id === id)
    setActionId(id)
    try {
      if (target?.source === 'BATCH') {
        await adminAPI.rejectBatchPayment(target.rawId, reason)
        toast.success('Batch payment rejected.')
      } else {
        await adminAPI.rejectPaymentRequest(id, reason)
        toast.success('Request rejected. Resident notified.')
      }
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
    (r.paidToAdminName  ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.batchTitle        ?? '').toLowerCase().includes(search.toLowerCase())
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
            <p className="text-2xl font-bold font-mono text-[#022b3a]">{value}</p>
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
                    {['Type', 'Submitted By', 'Owner Detail', 'Flat', 'Phone', 'Amount', 'Method', 'Ref / Admin', 'Month / Batch', 'Screenshot', 'Status', 'Actions'].map(h => (
                      <th key={h} className="table-header text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell"><SourceBadge source={r.source} /></td>
                      <td className="table-cell font-medium text-sm text-[#022b3a]">
                        {r.submittedByLabel || r.submittedName}
                      </td>
                      <td className="table-cell text-xs text-[#1f7a8c]">
                        {r.ownerName || '—'}
                      </td>
                      <td className="table-cell font-mono text-xs">{r.flatNumber}</td>
                      <td className="table-cell text-xs">{r.phoneNumber || '—'}</td>
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
                      <div className="mb-1"><SourceBadge source={r.source} /></div>
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
                    <div><p className="text-[#1f7a8c]">{r.source === 'BATCH' ? 'Batch' : 'Month'}</p><p>{r.paymentMonth}</p></div>
                    <div className="col-span-2"><p className="text-[#1f7a8c]">TXN ID</p><p className="font-mono">{r.transactionId || '—'}</p></div>
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