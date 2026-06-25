import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, XCircle, ChevronDown, ChevronRight,
  RefreshCw, Search, Home, Mail, Phone, Calendar,
  Users, Car, MapPin, Maximize2, CheckSquare, Square
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

/* ─── helpers ────────────────────────────────────────────────── */
const fmtDate = (s) => {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return s }
}

const STATUS_BADGE = {
  PENDING:  'text-yellow-400 bg-yellow-950/40 border-yellow-900/50',
  APPROVED: 'text-green-400  bg-green-950/40  border-green-900/50',
  REJECTED: 'text-red-400    bg-red-950/40    border-red-900/50',
}

const FILTER_OPTIONS = [
  { value: 'PENDING',  label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL',      label: 'All' },
]

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function ResidentApprovalPage() {
  const [list,         setList]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [search,       setSearch]       = useState('')
  const [expanded,     setExpanded]     = useState(new Set())
  const [selected,     setSelected]     = useState(new Set())
  const [pendingCount, setPendingCount] = useState(0)
  const [totalCount,   setTotalCount]   = useState(0)

  // Single reject modal
  const [rejectTarget, setRejectTarget] = useState(null) // resident object
  const [rejectReason, setRejectReason] = useState('')
  const [rejectLoading,setRejectLoading]= useState(false)

  // Bulk reject modal
  const [bulkRejectOpen,  setBulkRejectOpen]  = useState(false)
  const [bulkRejectReason,setBulkRejectReason]= useState('')
  const [bulkLoading,     setBulkLoading]     = useState(false)

  const [actionId, setActionId] = useState(null)

  /* ── fetch ─────────────────────────────────────────────────── */
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, countRes, allRes] = await Promise.allSettled([
        adminAPI.getAllApprovals({ status: statusFilter }),
        adminAPI.getApprovalCount(),
        adminAPI.getAllApprovals({ status: 'ALL' }),
      ])
      if (listRes.status === 'fulfilled') {
        const d = listRes.value.data?.data ?? listRes.value.data ?? []
        setList(Array.isArray(d) ? d : [])
      }
      if (countRes.status === 'fulfilled') {
        setPendingCount(countRes.value.data?.data?.pending ?? 0)
      }
      if (allRes.status === 'fulfilled') {
        const d = allRes.value.data?.data ?? allRes.value.data ?? []
        setTotalCount(Array.isArray(d) ? d.length : 0)
      }
    } catch {
      setList([])
      toast.error('Could not load registrations')
    } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchList(); setSelected(new Set()); setExpanded(new Set()) }, [fetchList])

  /* ── row expand / select ───────────────────────────────────── */
  const toggleExpand = (id) =>
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const selectAll = () => {
    const pendingIds = filtered.filter(r => r.registrationStatus === 'PENDING').map(r => r.id)
    setSelected(selected.size === pendingIds.length ? new Set() : new Set(pendingIds))
  }

  /* ── single approve ────────────────────────────────────────── */
  const handleApprove = async (resident, e) => {
    e.stopPropagation()
    setActionId(resident.id)
    try {
      await adminAPI.approveResident(resident.id)
      toast.success(`${resident.fullName} approved successfully`)
      fetchList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    } finally { setActionId(null) }
  }

  /* ── single reject ─────────────────────────────────────────── */
  const openRejectModal = (resident, e) => {
    e.stopPropagation()
    setRejectTarget(resident)
    setRejectReason('')
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return }
    setRejectLoading(true)
    try {
      await adminAPI.rejectResident(rejectTarget.id, rejectReason.trim())
      toast.success(`${rejectTarget.fullName}'s registration rejected`)
      setRejectTarget(null)
      fetchList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally { setRejectLoading(false) }
  }

  /* ── bulk approve ──────────────────────────────────────────── */
  const handleBulkApprove = async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const res = await adminAPI.bulkApproveResidents([...selected])
      const count = res.data?.data?.approved ?? selected.size
      toast.success(`${count} resident(s) approved`)
      setSelected(new Set())
      fetchList()
    } catch { toast.error('Bulk approval failed') }
    finally { setBulkLoading(false) }
  }

  /* ── bulk reject ───────────────────────────────────────────── */
  const submitBulkReject = async () => {
    if (!bulkRejectReason.trim()) { toast.error('Rejection reason is required'); return }
    setBulkLoading(true)
    try {
      const res = await adminAPI.bulkRejectResidents([...selected], bulkRejectReason.trim())
      const count = res.data?.data?.rejected ?? selected.size
      toast.success(`${count} resident(s) rejected`)
      setBulkRejectOpen(false)
      setBulkRejectReason('')
      setSelected(new Set())
      fetchList()
    } catch { toast.error('Bulk rejection failed') }
    finally { setBulkLoading(false) }
  }

  /* ── filter + search ───────────────────────────────────────── */
  const filtered = list.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (r.fullName   ?? '').toLowerCase().includes(q) ||
      (r.email      ?? '').toLowerCase().includes(q) ||
      (r.phone      ?? '').toLowerCase().includes(q) ||
      (r.flatNumber ?? '').toLowerCase().includes(q)
    )
  })

  const pendingSelected = [...selected].filter(id =>
    list.find(r => r.id === id)?.registrationStatus === 'PENDING'
  ).length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title text-xl">Resident Approvals</h1>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-white text-[#022b3a] text-[11px] font-bold px-1.5">
                {pendingCount}
              </span>
            )}
          </div>
          {/* <p className="section-subtitle">Review and process incoming resident registration requests</p> */}
        </div>
        <button onClick={fetchList} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Total Registered Count card (moved from Payment Tracking) ──── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card card-hover text-center py-3 px-2 border border-transparent">
          <Users size={16} className="mx-auto mb-1 text-[#022b3a]/40" />
          <p className="text-xl font-bold font-mono text-[#022b3a]">{totalCount}</p>
          <p className="text-[10px] text-[#1f7a8c] mt-0.5 leading-tight">Total Registrations</p>
        </div>
        <div className="card card-hover text-center py-3 px-2 border border-yellow-900/30">
          <CheckCircle size={16} className="mx-auto mb-1 text-yellow-400" />
          <p className="text-xl font-bold font-mono text-yellow-400">{pendingCount}</p>
          <p className="text-[10px] text-[#1f7a8c] mt-0.5 leading-tight">Awaiting Approval</p>
        </div>
      </div>

      {/* ── Filters row ─────────────────────────────────────── */}
      <div className="card py-3 px-4 flex flex-wrap items-center gap-3">
        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === value
                  ? 'bg-white text-[#022b3a] border-[#bfdbf7]'
                  : 'bg-[#e1e5f2] text-[#022b3a]/60 border-[#bfdbf7] hover:text-[#022b3a]'
              }`}>
              {label}
              {value === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 bg-white text-[#022b3a] rounded-full px-1.5 py-0.5 text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, flat..."
            className="input-field pl-9 py-2"
          />
        </div>
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="card py-3 px-4 flex flex-wrap items-center gap-3 border-[#bfdbf7]">
          <span className="text-sm text-[#022b3a] font-medium">{selected.size} selected</span>
          <div className="flex gap-2 flex-wrap sm:ml-auto">
            <button onClick={handleBulkApprove} disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#e1e5f2] text-green-400 hover:bg-green-950/40 border border-[#bfdbf7] disabled:opacity-50 transition-all whitespace-nowrap">
              {bulkLoading ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={12} />}
              Approve All Selected
            </button>
            <button onClick={() => { setBulkRejectOpen(true); setBulkRejectReason('') }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#e1e5f2] text-red-400 hover:bg-red-950/40 border border-[#bfdbf7] disabled:opacity-50 transition-all whitespace-nowrap">
              <XCircle size={12} /> Reject All Selected
            </button>
            <button onClick={() => setSelected(new Set())}
              className="text-xs text-[#1f7a8c] hover:text-[#022b3a] transition-colors px-2 whitespace-nowrap">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-[#bfdbf7] bg-white/50 flex items-center gap-3">
          {/* Select-all checkbox (only for pending) */}
          {statusFilter === 'PENDING' || statusFilter === 'ALL' ? (
            <button onClick={selectAll} className="text-[#1f7a8c] hover:text-[#022b3a] transition-colors">
              {selected.size > 0 && selected.size === filtered.filter(r => r.registrationStatus === 'PENDING').length
                ? <CheckSquare size={15} />
                : <Square size={15} />}
            </button>
          ) : <div className="w-4" />}
          <p className="text-xs font-semibold text-[#022b3a]/60">
            {filtered.length} registration{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={32} className="text-[#022b3a] mx-auto mb-3" />
            <p className="text-sm text-[#1f7a8c]">No {statusFilter.toLowerCase()} registrations</p>
            {statusFilter === 'PENDING' && (
              <p className="text-xs text-[#1f7a8c] mt-1">All registrations have been reviewed</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#bfdbf7]">
            {filtered.map((resident) => {
              const isExpanded = expanded.has(resident.id)
              const isSelected = selected.has(resident.id)
              const isPending  = resident.registrationStatus === 'PENDING'
              const isActing   = actionId === resident.id

              return (
                <div key={resident.id} className="group">
                  {/* ── Main row ────────────────────────────── */}
                  <div
                    onClick={() => toggleExpand(resident.id)}
                    className={`flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3.5 cursor-pointer transition-all ${
                      isExpanded ? 'bg-[#e1e5f2]/50' : 'hover:bg-white/50'
                    } ${isSelected ? 'bg-[#e1e5f2]/30' : ''}`}
                  >
                    {/* Checkbox */}
                    {isPending ? (
                      <button onClick={e => toggleSelect(resident.id, e)}
                        className="text-[#1f7a8c] hover:text-[#022b3a] flex-shrink-0 transition-colors">
                        {isSelected ? <CheckSquare size={15} className="text-[#022b3a]" /> : <Square size={15} />}
                      </button>
                    ) : <div className="w-4 flex-shrink-0" />}

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-[#bfdbf7] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#022b3a]">
                      {(resident.fullName || '?')[0].toUpperCase()}
                    </div>

                    {/* Core info */}
                    <div className="flex-1 min-w-[140px] sm:min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#022b3a] truncate">{resident.fullName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[resident.registrationStatus] ?? ''}`}>
                          {resident.registrationStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-[#1f7a8c] truncate">{resident.email}</span>
                        <span className="text-[#022b3a]">·</span>
                        <span className="text-[11px] text-[#1f7a8c]">{resident.flatType} {resident.flatNumber}</span>
                        <span className="text-[#022b3a]">·</span>
                        <span className="text-[11px] text-[#1f7a8c]">{resident.sqFt} sq.ft</span>
                      </div>
                    </div>

                    {/* Date */}
                    <p className="text-[10px] text-[#1f7a8c] flex-shrink-0 hidden sm:block">
                      {fmtDate(resident.createdAt)}
                    </p>

                    {/* Action buttons — only shown for PENDING */}
                    {isPending && (
                      <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-2 order-last sm:order-none basis-full sm:basis-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-[#bfdbf7]/50"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={e => handleApprove(resident, e)} disabled={isActing}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#e1e5f2] text-green-400 hover:bg-green-950/40 border border-[#bfdbf7] disabled:opacity-50 transition-all whitespace-nowrap">
                          {isActing
                            ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                            : <CheckCircle size={12} />}
                          Approve
                        </button>
                        <button onClick={e => openRejectModal(resident, e)} disabled={isActing}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#e1e5f2] text-red-400 hover:bg-red-950/40 border border-[#bfdbf7] disabled:opacity-50 transition-all whitespace-nowrap">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}

                    {/* Expand chevron */}
                    <div className="flex-shrink-0 ml-1 text-[#1f7a8c]">
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                  </div>

                  {/* ── Expanded detail panel ────────────────── */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-3 bg-white/30 border-t border-[#bfdbf7]/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem icon={Mail}     label="Email"          value={resident.email} />
                        <DetailItem icon={Phone}    label="Phone"          value={resident.phone} />
                        <DetailItem icon={Home}     label="Property"       value={`${resident.flatType || '—'} • ${resident.flatNumber || '—'}`} />
                        <DetailItem icon={Maximize2}label="Square Feet"    value={resident.sqFt ? `${resident.sqFt} sq.ft` : '—'} />
                        <DetailItem icon={Users}    label="Family Members" value={resident.familyMembers ?? '—'} />
                        <DetailItem icon={Car}      label="Vehicle Details"value={resident.vehicleDetails || 'None'} />
                        <DetailItem icon={MapPin}   label="Address"        value={resident.address || '—'} />
                        <DetailItem icon={Calendar} label="Registered On"  value={fmtDate(resident.createdAt)} />
                        {resident.approvedAt && (
                          <DetailItem icon={Calendar} label="Decision Date" value={fmtDate(resident.approvedAt)} />
                        )}
                      </div>

                      {/* Rejection reason (if rejected) */}
                      {resident.registrationStatus === 'REJECTED' && resident.rejectedReason && (
                        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
                          <p className="text-[10px] text-red-400 font-medium uppercase tracking-wide mb-1">Rejection Reason</p>
                          <p className="text-xs text-[#022b3a]/60">{resident.rejectedReason}</p>
                        </div>
                      )}

                      {/* Action buttons in expanded panel too */}
                      {isPending && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button onClick={e => handleApprove(resident, e)} disabled={isActing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#e1e5f2] text-green-400 hover:bg-green-950/40 border border-[#bfdbf7] transition-all whitespace-nowrap">
                            <CheckCircle size={14} /> Approve Resident
                          </button>
                          <button onClick={e => openRejectModal(resident, e)} disabled={isActing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#e1e5f2] text-red-400 hover:bg-red-950/40 border border-[#bfdbf7] transition-all whitespace-nowrap">
                            <XCircle size={14} /> Reject with Reason
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Single Reject Modal ──────────────────────────────── */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Registration">
        {rejectTarget && (
          <div className="space-y-4">
            {/* Resident summary */}
            <div className="p-3 bg-white rounded-xl border border-[#bfdbf7] space-y-1">
              <p className="text-sm font-semibold text-[#022b3a]">{rejectTarget.fullName}</p>
              <p className="text-xs text-[#1f7a8c]">{rejectTarget.email}</p>
              <p className="text-xs text-[#1f7a8c]">{rejectTarget.flatType} {rejectTarget.flatNumber} · {rejectTarget.sqFt} sq.ft</p>
            </div>

            {/* Reason textarea */}
            <div>
              <label className="label">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this registration is being rejected (required)..."
                rows={4}
                className="input-field resize-none"
                autoFocus
              />
              <p className="text-[10px] text-[#1f7a8c] mt-1">
                This reason will be shown to the resident.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setRejectTarget(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={submitReject} disabled={rejectLoading || !rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800 disabled:opacity-40 transition-all">
                {rejectLoading
                  ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  : <XCircle size={14} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Bulk Reject Modal ────────────────────────────────── */}
      <Modal isOpen={bulkRejectOpen} onClose={() => setBulkRejectOpen(false)} title={`Reject ${selected.size} Registrations`}>
        <div className="space-y-4">
          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
            <p className="text-xs text-red-300">
              You are about to reject <strong>{selected.size}</strong> registration(s).
              This reason will be shared with all selected residents.
            </p>
          </div>
          <div>
            <label className="label">Rejection Reason <span className="text-red-500">*</span></label>
            <textarea
              value={bulkRejectReason}
              onChange={e => setBulkRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setBulkRejectOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={submitBulkReject}
              disabled={bulkLoading || !bulkRejectReason.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800 disabled:opacity-40 transition-all">
              {bulkLoading
                ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                : <XCircle size={14} />}
              Reject All Selected
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#e1e5f2] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-[#1f7a8c]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide leading-none">{label}</p>
        <p className="text-xs text-[#022b3a] mt-1 break-words">{String(value ?? '—')}</p>
      </div>
    </div>
  )
}