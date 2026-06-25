import { useState, useEffect } from 'react'
import {
  Bell, Trash2, CheckCircle, MessageSquare, AlertTriangle,
  CreditCard, Info, RefreshCw, Clock, Send, Plus
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { formatDateTime } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'

const TYPE_META = {
  COMPLAINT:            { icon: MessageSquare, color: 'text-red-400',    bg: 'bg-red-950/30',    label: 'Complaint' },
  PAYMENT_RECEIVED:     { icon: CreditCard,    color: 'text-green-400',  bg: 'bg-green-950/30',  label: 'Payment' },
  PAYMENT_VERIFICATION: { icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-950/30', label: 'Payment Verification' },
  FEE_WARNING:          { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-950/30', label: 'Late Fee Warning' },
  PENDING_DUE:          { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-950/30', label: 'Pending Due Alert' },
  ANNOUNCEMENT:         { icon: Info,          color: 'text-[#022b3a]/60',   bg: 'bg-[#e1e5f2]',  label: 'Announcement' },
  PAYMENT_REMINDER:     { icon: Bell,          color: 'text-[#022b3a]/60',   bg: 'bg-[#e1e5f2]',  label: 'Reminder' },
  REGISTRATION:         { icon: CheckCircle,   color: 'text-[#1f7a8c]',      bg: 'bg-[#e1e5f2]',  label: 'Registration' },
  PAYMENT:              { icon: CreditCard,    color: 'text-green-400',  bg: 'bg-green-950/30',  label: 'Payment' },
  REMINDER:             { icon: Clock,         color: 'text-[#022b3a]/60',   bg: 'bg-[#e1e5f2]',  label: 'Reminder' },
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('all')
  const [actionId,      setActionId]      = useState(null)

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false)
  const [sending,     setSending]     = useState(false)
  const [compose,     setCompose]     = useState({
    title: '', message: '', audience: 'ALL', type: 'ANNOUNCEMENT', residentId: '',
  })

  const fetchNotifications = async () => {
    try {
      const res  = await adminAPI.getNotifications()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setNotifications(data)
    } catch {
      setNotifications([])
      toast.error('Could not load notifications. Ensure backend is running.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    try { await adminAPI.markNotificationRead(id) } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n))
  }

  const deleteNotif = async (id) => {
    try {
      await adminAPI.deleteNotification(id)
      toast.success('Notification deleted')
    } catch { toast.error('Delete failed') }
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })))
    toast.success('All marked as read')
  }

  const handleApprove = async (paymentId, notifId) => {
    setActionId(notifId)
    try {
      // Unified approval: approve via notifId so status syncs across all modules
      await adminAPI.approvePaymentFromNotification(notifId)
      toast.success('Payment approved! Status updated across all modules.')
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    } finally { setActionId(null) }
  }

  const handleReject = async (paymentId, notifId) => {
    setActionId(notifId)
    try {
      // Unified rejection: reject via notifId so status syncs across all modules
      await adminAPI.rejectPaymentFromNotification(notifId, 'Rejected from notifications')
      toast.success('Payment rejected. Status updated across all modules.')
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally { setActionId(null) }
  }

  const sendNotification = async () => {
    if (!compose.title.trim() || !compose.message.trim()) {
      toast.error('Title and message are required'); return
    }
    if (compose.audience === 'RESIDENT' && !compose.residentId) {
      toast.error('Enter a resident ID'); return
    }
    setSending(true)
    try {
      await adminAPI.sendNotification({
        title:      compose.title.trim(),
        message:    compose.message.trim(),
        type:       compose.type,
        audience:   compose.audience,
        residentId: compose.audience === 'RESIDENT' ? Number(compose.residentId) : null,
      })
      toast.success('Notification sent')
      setComposeOpen(false)
      setCompose({ title: '', message: '', audience: 'ALL', type: 'ANNOUNCEMENT', residentId: '' })
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed')
    } finally { setSending(false) }
  }

  const isUnread = (n) => n.isRead === false || n.read === false

  const filtered    = filter === 'unread' ? notifications.filter(isUnread)
                    : filter === 'read'   ? notifications.filter(n => !isUnread(n))
                    : notifications
  const unreadCount = notifications.filter(isUnread).length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Notification Centre</h1>
          <p className="section-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter tabs */}
          <div className="flex bg-[#e1e5f2] rounded-lg p-1">
            {['all', 'unread', 'read'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-white text-[#022b3a]' : 'text-[#022b3a]/60 hover:text-[#022b3a]'
                }`}>{f}</button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-xs flex items-center gap-1.5">
              <CheckCircle size={12} /> Mark all read
            </button>
          )}
          <button onClick={fetchNotifications} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw size={12} /> Refresh
          </button>
          {/* ── Send notification to owners ── */}
          <button onClick={() => setComposeOpen(true)}
            className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={12} /> Send Notification
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              description={filter === 'unread'
                ? "You've read everything!"
                : 'Notifications will appear here when residents send payments or complaints.'}
              icon={Bell}
            />
          </div>
        ) : (
          filtered.map((n) => {
            const meta   = TYPE_META[n.type] ?? TYPE_META.ANNOUNCEMENT
            const Icon   = meta.icon
            const unread = isUnread(n)
            const isPendingVerif = n.type === 'PAYMENT_VERIFICATION'

            return (
              <div key={n.id}
                className={`card card-hover flex items-start gap-4 transition-all ${
                  unread ? 'border-[#bfdbf7]' : 'opacity-70'
                } ${isPendingVerif && unread ? 'border-yellow-900/50' : ''}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {unread && <span className="w-1.5 h-1.5 rounded-full bg-[#bfdbf7] flex-shrink-0" />}
                        <p className={`text-sm font-semibold ${unread ? 'text-[#022b3a]' : 'text-[#022b3a]/60'}`}>
                          {n.title}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color} border border-current border-opacity-30`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#1f7a8c] mb-2 leading-relaxed">{n.message}</p>

                      {isPendingVerif && (n.transactionId || n.paymentAmount) && (
                        <div className="mb-2 p-2.5 bg-white/60 rounded-lg border border-[#bfdbf7] grid grid-cols-2 gap-x-4 gap-y-1">
                          {n.residentName  && <div><span className="text-[10px] text-[#1f7a8c]">Resident</span><p className="text-xs text-[#022b3a]">{n.residentName}</p></div>}
                          {n.flatNumber    && <div><span className="text-[10px] text-[#1f7a8c]">Flat</span><p className="text-xs text-[#022b3a]">{n.flatNumber}</p></div>}
                          {n.transactionId && <div><span className="text-[10px] text-[#1f7a8c]">Transaction ID</span><p className="text-xs font-mono text-[#022b3a]">{n.transactionId}</p></div>}
                          {n.paymentAmount && <div><span className="text-[10px] text-[#1f7a8c]">Amount</span><p className="text-xs font-mono text-yellow-300">{formatCurrency(n.paymentAmount)}</p></div>}
                          {n.paymentMethod && <div><span className="text-[10px] text-[#1f7a8c]">Method</span><p className="text-xs text-[#022b3a]">{n.paymentMethod}</p></div>}
                        </div>
                      )}

                      {isPendingVerif && n.paymentId && unread && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <button
                            onClick={() => handleApprove(n.paymentId, n.id)}
                            disabled={actionId === n.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#e1e5f2] text-green-400 hover:bg-green-950/40 border border-[#bfdbf7] disabled:opacity-50 transition-all whitespace-nowrap">
                            {actionId === n.id
                              ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                              : <CheckCircle size={11} />}
                            Approve Payment
                          </button>
                          <button
                            onClick={() => handleReject(n.paymentId, n.id)}
                            disabled={actionId === n.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#e1e5f2] text-red-400 hover:bg-red-950/40 border border-[#bfdbf7] disabled:opacity-50 transition-all whitespace-nowrap">
                            Reject
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-[#1f7a8c] mt-1">
                        {n.residentName && !isPendingVerif && (
                          <span>From: <span className="text-[#1f7a8c]">{n.residentName}</span></span>
                        )}
                        <span>{formatDateTime(n.createdAt ?? n.dateTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {unread && (
                        <button onClick={() => markRead(n.id)} title="Mark as read"
                          className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-green-400 hover:bg-green-950/30 transition-all">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteNotif(n.id)} title="Delete"
                        className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-red-400 hover:bg-red-950/30 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Compose modal ── */}
      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Send Notification to Residents">
        <div className="space-y-4">
          <div>
            <label className="label">Audience</label>
            <select className="input-field" value={compose.audience}
              onChange={e => setCompose(c => ({ ...c, audience: e.target.value }))}>
              <option value="ALL">All Owners (common)</option>
              <option value="FLAT">All Flat Owners</option>
              <option value="VILLA">All Villa Owners</option>
              <option value="RESIDENT">Specific Owner</option>
            </select>
          </div>

          {compose.audience === 'RESIDENT' && (
            <div>
              <label className="label">Resident ID</label>
              <input className="input-field" value={compose.residentId}
                placeholder="Enter numeric resident ID"
                onChange={e => setCompose(c => ({ ...c, residentId: e.target.value }))} />
              <p className="text-[11px] text-[#1f7a8c] mt-1">
                Find the ID in Admin → Residents list.
              </p>
            </div>
          )}

          <div>
            <label className="label">Title *</label>
            <input className="input-field" value={compose.title}
              placeholder="Notification heading"
              onChange={e => setCompose(c => ({ ...c, title: e.target.value }))} />
          </div>

          <div>
            <label className="label">Message *</label>
            <textarea className="input-field resize-none" rows={4} value={compose.message}
              placeholder="Full notification message..."
              onChange={e => setCompose(c => ({ ...c, message: e.target.value }))} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setComposeOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={sendNotification} disabled={sending}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={13} />}
              Send
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}