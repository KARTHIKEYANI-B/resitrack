import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, RefreshCw, CheckCircle, Search,
  User, Home, Calendar, ChevronDown, ChevronUp,
  AlertCircle, Clock, CheckCheck, Filter
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatDateTime } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  bg: '#FFF0E4', accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080', surface: '#FFFAF5',
}

const STATUS_META = {
  OPEN:        { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Open',        dot: '#d97706', icon: AlertCircle },
  IN_PROGRESS: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'In Progress', dot: '#2563eb', icon: Clock       },
  RESOLVED:    { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Resolved',    dot: '#16a34a', icon: CheckCircle },
  CLOSED:      { color: P.muted,   bg: P.accent,  border: P.border,  label: 'Closed',      dot: P.muted,   icon: CheckCheck  },
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className="card card-hover text-center py-4">
      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: P.muted }}>{label}</p>
    </div>
  )
}

function ComplaintRow({ complaint, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [reply,    setReply]    = useState(complaint.adminReply || '')
  const [status,   setStatus]   = useState(complaint.status)
  const [saving,   setSaving]   = useState(false)
  const sm = STATUS_META[complaint.status] || STATUS_META.OPEN
  const Icon = sm.icon

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminAPI.updateComplaintStatus(complaint.id, { status, adminReply: reply })
      toast.success('Complaint updated')
      onUpdate()
      setExpanded(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ border: `1px solid ${sm.border}`, background: P.surface, marginBottom: '0.75rem' }}>

      {/* Header row */}
      <div className="flex items-start sm:items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{ background: expanded ? P.accent : P.surface }}>

        {/* Status icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: sm.bg }}>
          <Icon size={16} style={{ color: sm.color }} />
        </div>

        {/* Complaint info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold" style={{ color: P.dark }}>{complaint.title}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
              {sm.label}
            </span>
          </div>

          {/* Meta row: owner, flat, date */}
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: P.muted }}>
            <span className="flex items-center gap-1">
              <User size={10} style={{ color: P.secondary }} />
              {complaint.residentName}
            </span>
            <span className="flex items-center gap-1">
              <Home size={10} style={{ color: P.secondary }} />
              Flat {complaint.flatNumber}
              {complaint.flatType && <span style={{ color: P.muted }}>({complaint.flatType})</span>}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={10} style={{ color: P.secondary }} />
              {formatDateTime(complaint.createdAt)}
            </span>
          </div>
        </div>

        {/* Expand icon */}
        <div style={{ color: P.muted, flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${P.border}`, paddingTop: '1rem' }}>

          {/* Full detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Resident Name',   value: complaint.residentName },
              { label: 'Flat / Villa', value: complaint.flatNumber + (complaint.flatType ? ` (${complaint.flatType})` : '') },
              { label: 'Submitted On',    value: formatDateTime(complaint.createdAt) },
              { label: 'Status',       value: sm.label },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-2.5" style={{ background: P.accent }}>
                <p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: P.primary }}>{label}</p>
                <p className="text-xs font-medium" style={{ color: P.dark }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Complaint description */}
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: P.primary }}>
              Complaint Description
            </p>
            <div className="rounded-xl p-3 text-xs leading-relaxed"
              style={{ background: P.accent, border: `1px solid ${P.border}`, color: P.body }}>
              {complaint.description}
            </div>
          </div>

          {/* Previous admin reply */}
          {complaint.adminReply && (
            <div>
              <p className="text-[10px] uppercase tracking-wide font-semibold mb-1.5 flex items-center gap-1"
                style={{ color: '#16a34a' }}>
                <CheckCheck size={10} />Previous Admin Reply
              </p>
              <div className="rounded-xl p-3 text-xs leading-relaxed"
                style={{ background: '#f0fdf4', border: '1px solid #86efac', color: P.body }}>
                {complaint.adminReply}
              </div>
            </div>
          )}

          {/* Update form */}
          <div className="space-y-3 pt-2" style={{ borderTop: `1px solid ${P.border}` }}>
            <div>
              <label className="label">Update Complaint Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="input-field" style={{ background: '#fff' }}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="label">Reply to Resident (optional)</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Type your response to the resident..."
                rows={3} className="input-field resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setExpanded(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <CheckCircle size={13} />}
                Update Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminComplaints() {
  const [complaints,   setComplaints]   = useState([])
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,       setSearch]       = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const [cRes, sRes] = await Promise.allSettled([
        adminAPI.getAllComplaints(params),
        adminAPI.getComplaintStats(),
      ])
      if (cRes.status === 'fulfilled') {
        const d = cRes.value.data
        setComplaints(Array.isArray(d) ? d : (d?.data ?? []))
      }
      if (sRes.status === 'fulfilled') {
        const d = sRes.value.data
        setStats(d?.data ?? d)
      }
    } catch {
      toast.error('Could not load complaints')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const shown = complaints.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.title?.toLowerCase().includes(q)       ||
      c.residentName?.toLowerCase().includes(q) ||
      c.flatNumber?.toLowerCase().includes(q)   ||
      c.description?.toLowerCase().includes(q)
    )
  })

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Resident Complaint Management</h1>
          <p className="section-subtitle">
            {stats
              ? `${stats.total ?? 0} total · ${stats.open ?? 0} open · ${stats.resolved ?? 0} resolved`
              : 'Track and manage resident complaints'}
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-xs self-start sm:self-auto">
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Open Complaints"        value={stats.open       ?? 0} color="#d97706" />
          <StatCard label="Under Review" value={stats.inProgress ?? 0} color="#2563eb" />
          <StatCard label="Resolved Complaints"    value={stats.resolved   ?? 0} color="#16a34a" />
          <StatCard label="Closed Complaints"      value={stats.closed     ?? 0} color={P.muted} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex p-1 rounded-xl" style={{ background: P.accent }}>
          {[
            { key: 'all',         label: 'All' },
            { key: 'OPEN',        label: 'Open' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'RESOLVED',    label: 'Resolved' },
            { key: 'CLOSED',      label: 'Closed' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === key ? '#fff' : 'transparent',
                color:      statusFilter === key ? P.primary : P.muted,
              }}>{label}</button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.secondary }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, flat, or subject…"
            className="input-field pl-8 py-2 text-xs" />
        </div>
      </div>

      {/* Table header (desktop) */}
      <div className="hidden sm:grid grid-cols-5 gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
        style={{ background: P.accent, color: P.primary }}>
        <span>Owner Name</span>
        <span>Flat / Villa</span>
        <span className="col-span-2">Complaint Title</span>
        <span>Status / Date</span>
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div className="card">
          <EmptyState
            title={search ? 'No complaints match your search' : 'No complaints yet'}
            description="Complaints submitted by residents will appear here."
            icon={MessageSquare}
          />
        </div>
      ) : (
        <div>
          {shown.map(c => (
            <ComplaintRow key={c.id} complaint={c} onUpdate={fetchAll} />
          ))}
        </div>
      )}
    </div>
  )
}