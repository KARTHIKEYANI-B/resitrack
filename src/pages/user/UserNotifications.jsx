import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Trash2, CheckCircle, AlertCircle, CreditCard,
  MessageSquare, Send, Clock, ClipboardList, RefreshCw
} from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { formatDateTime } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  bg: '#FFF0E4', accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080', surface: '#FFFAF5',
}

const TYPE_META = {
  PAYMENT_REMINDER:     { icon: CreditCard,    color: '#d97706', bg: '#fffbeb', label: 'Payment Reminder' },
  PENDING_DUE:          { icon: AlertCircle,   color: '#dc2626', bg: '#fef2f2', label: 'Due Warning' },
  REMINDER:             { icon: Clock,         color: '#d97706', bg: '#fffbeb', label: 'Reminder' },
  ANNOUNCEMENT:         { icon: Bell,          color: P.secondary, bg: P.accent, label: 'Announcement' },
  COMPLAINT_REPLY:      { icon: MessageSquare, color: '#16a34a', bg: '#f0fdf4', label: 'Reply' },
  REGISTRATION:         { icon: CheckCircle,   color: P.primary,   bg: P.accent, label: 'Registration' },
  PAYMENT:              { icon: CreditCard,    color: '#16a34a', bg: '#f0fdf4', label: 'Payment' },
  PAYMENT_APPROVED:     { icon: CheckCircle,   color: '#16a34a', bg: '#f0fdf4', label: 'Approved' },
  PAYMENT_REJECTED:     { icon: AlertCircle,   color: '#dc2626', bg: '#fef2f2', label: 'Rejected' },
  PAYMENT_VERIFICATION: { icon: Clock,         color: '#d97706', bg: '#fffbeb', label: 'Verifying' },
}

const STATUS_META = {
  OPEN:        { color: '#d97706', bg: '#fffbeb', label: 'Open' },
  IN_PROGRESS: { color: '#2563eb', bg: '#eff6ff', label: 'In Progress' },
  RESOLVED:    { color: '#16a34a', bg: '#f0fdf4', label: 'Resolved' },
  CLOSED:      { color: P.muted,   bg: P.accent,  label: 'Closed' },
}

// Helper: check if notification is unread (handles both field names)
const isUnread = (n) => n.isRead === false || n.read === false

export default function UserNotifications() {
  const [notifications,  setNotifications]  = useState([])
  const [complaints,     setComplaints]      = useState([])
  const [loading,        setLoading]         = useState(true)
  const [activeTab,      setActiveTab]       = useState('notifications')
  const [complaintOpen,  setComplaintOpen]   = useState(false)
  const [complaint,      setComplaint]       = useState({ title: '', description: '' })
  const [sending,        setSending]         = useState(false)
  const [filter,         setFilter]          = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch both independently — failure of one does not break the other
      const [notifRes, compRes] = await Promise.allSettled([
        userAPI.getNotifications(),
        userAPI.getMyComplaints(),
      ])
      if (notifRes.status === 'fulfilled') {
        const d = notifRes.value.data
        setNotifications(Array.isArray(d) ? d : (d?.data ?? []))
      }
      if (compRes.status === 'fulfilled') {
        const d = compRes.value.data
        setComplaints(Array.isArray(d) ? d : (d?.data ?? []))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const markRead = async (id) => {
    try { await userAPI.markNotificationRead(id) } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n))
  }

  const deleteNotif = async (id) => {
    try { await userAPI.deleteNotification(id) } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.success('Notification removed')
  }

  const sendComplaint = async () => {
    const t = complaint.title.trim()
    const d = complaint.description.trim()
    if (!t || !d) { toast.error('Please fill in both subject and message'); return }

    setSending(true)
    try {
      // Uses POST /user/complaints with { title, description }
      await userAPI.submitComplaint({ title: t, description: d })
      toast.success('Complaint submitted to Admin successfully')
      setComplaintOpen(false)
      setComplaint({ title: '', description: '' })

      // Refresh complaints list
      const res = await userAPI.getMyComplaints()
      const data = res.data
      setComplaints(Array.isArray(data) ? data : (data?.data ?? []))
      setActiveTab('complaints')
    } catch (err) {
      // Specific error from backend — do NOT trigger logout, just show message
      const msg = err?.response?.data?.message || 'Could not submit complaint. Please try again.'
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  const filtered    = filter === 'unread' ? notifications.filter(isUnread) : notifications
  const unreadCount = notifications.filter(isUnread).length
  const openCount   = complaints.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Notifications & Complaints</h1>
          <p className="section-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            {openCount > 0 && ` · ${openCount} complaint${openCount > 1 ? 's' : ''} pending`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2">
            <RefreshCw size={12} />Refresh
          </button>
          <button onClick={() => setComplaintOpen(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <MessageSquare size={13} />Send Complaint
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-xl w-fit" style={{ background: P.accent }}>
        {[
          { key: 'notifications', label: 'Notifications', count: unreadCount },
          { key: 'complaints',    label: 'My Complaints', count: openCount },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === key ? '#fff' : 'transparent',
              color:      activeTab === key ? P.primary : P.muted,
            }}>
            {label}
            {count > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                style={{ background: P.primary }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── NOTIFICATIONS TAB ───────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex p-1 rounded-lg w-fit" style={{ background: P.accent }}>
            {['all', 'unread'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
                style={{
                  background: filter === f ? '#fff' : 'transparent',
                  color:      filter === f ? P.dark : P.muted,
                }}>{f}</button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card">
                <EmptyState
                  title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  icon={Bell}
                />
              </div>
            ) : filtered.map((n) => {
              const meta  = TYPE_META[n.type] || TYPE_META.ANNOUNCEMENT
              const Icon  = meta.icon
              const unread = isUnread(n)
              return (
                <div key={n.id} className="card card-hover flex items-start gap-4"
                  style={{ borderColor: unread ? P.secondary : P.border, opacity: unread ? 1 : 0.75 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg }}>
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          {unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: P.primary }} />}
                          <p className="text-sm font-semibold" style={{ color: unread ? P.dark : P.muted }}>{n.title}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                        </div>
                        <p className="text-xs leading-relaxed mb-1" style={{ color: P.muted }}>{n.message}</p>
                        <p className="text-[11px]" style={{ color: P.muted }}>
                          {formatDateTime(n.createdAt || n.dateTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {unread && (
                          <button onClick={() => markRead(n.id)} title="Mark as read"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: P.muted }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted }}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteNotif(n.id)} title="Delete"
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: P.muted }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COMPLAINTS TAB ──────────────────────────────────────────── */}
      {activeTab === 'complaints' && (
        <div className="space-y-3">
          {complaints.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No complaints submitted"
                description="Use 'Send Complaint' to raise an issue with the Admin."
                icon={ClipboardList}
              />
            </div>
          ) : complaints.map((c) => {
            const sm = STATUS_META[c.status] || STATUS_META.OPEN
            return (
              <div key={c.id} className="card space-y-2"
                style={{ borderColor: P.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <MessageSquare size={14} style={{ color: '#dc2626' }} className="flex-shrink-0" />
                      <p className="text-sm font-semibold" style={{ color: P.dark }}>{c.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: P.muted }}>{c.description}</p>
                  </div>
                  <p className="text-[11px] flex-shrink-0 whitespace-nowrap" style={{ color: P.muted }}>
                    {formatDateTime(c.createdAt)}
                  </p>
                </div>
                {c.adminReply && (
                  <div className="mt-2 p-2.5 rounded-xl" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 flex items-center gap-1"
                      style={{ color: P.primary }}>
                      <CheckCircle size={10} />Admin Reply
                    </p>
                    <p className="text-xs" style={{ color: P.body }}>{c.adminReply}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── COMPLAINT MODAL ─────────────────────────────────────────── */}
      <Modal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} title="Send Complaint to Admin">
        <div className="space-y-4">
          <div>
            <label className="label">Subject <span style={{ color: P.secondary }}>*</span></label>
            <input
              value={complaint.title}
              onChange={e => setComplaint(c => ({ ...c, title: e.target.value }))}
              placeholder="Brief description of the issue"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Message <span style={{ color: P.secondary }}>*</span></label>
            <textarea
              value={complaint.description}
              onChange={e => setComplaint(c => ({ ...c, description: e.target.value }))}
              placeholder="Describe your complaint in detail..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
          <p className="text-xs" style={{ color: P.muted }}>
            Your complaint will be sent directly to the Admin. Track its status in the "My Complaints" tab.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setComplaintOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={sendComplaint} disabled={sending}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={13} />}
              Submit Complaint
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}