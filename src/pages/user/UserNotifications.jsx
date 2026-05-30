import { useState, useEffect } from 'react'
import { Bell, Trash2, CheckCircle, AlertCircle, CreditCard, MessageSquare, Send } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { formatDateTime } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const TYPE_META = {
  PAYMENT_REMINDER: { icon: CreditCard,    color: 'text-yellow-400', bg: 'bg-yellow-950/30', label: 'Payment Reminder' },
  DUE_WARNING:      { icon: AlertCircle,   color: 'text-red-400',    bg: 'bg-red-950/30',    label: 'Due Warning' },
  ANNOUNCEMENT:     { icon: Bell,          color: 'text-[#022b3a]/60',   bg: 'bg-[#e1e5f2]',      label: 'Announcement' },
  COMPLAINT_REPLY:  { icon: MessageSquare, color: 'text-green-400',  bg: 'bg-green-950/30',  label: 'Reply' },
}

const PLACEHOLDER = [
  { id: 1, type: 'PAYMENT_REMINDER', title: 'Maintenance Due Reminder', message: 'Your June 2026 maintenance of ₹3,000 is due on 10th June. Please pay on time.', dateTime: '2026-06-01T09:00:00', read: false },
  { id: 2, type: 'ANNOUNCEMENT',     title: 'Lift Maintenance — Block A', message: 'Lift in Block A will be under maintenance on 5th June from 10 AM to 4 PM. Inconvenience regretted.', dateTime: '2026-05-28T11:30:00', read: true },
  { id: 3, type: 'DUE_WARNING',      title: 'Overdue Payment Notice', message: 'Your maintenance payment for April 2026 is overdue. A late fee of ₹100 has been applied.', dateTime: '2026-05-15T14:00:00', read: true },
]

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [complaintOpen, setComplaintOpen] = useState(false)
  const [complaint, setComplaint]         = useState({ subject: '', message: '' })
  const [sending, setSending]             = useState(false)
  const [filter, setFilter]               = useState('all')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getNotifications()
        setNotifications(res.data)
      } catch {
        setNotifications(PLACEHOLDER)
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const markRead = async (id) => {
    try { await userAPI.markNotificationRead(id) } catch {}
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotif = async (id) => {
    try { await userAPI.deleteNotification(id) } catch {}
    setNotifications(notifications.filter(n => n.id !== id))
    toast.success('Notification removed')
  }

  const sendComplaint = async () => {
    if (!complaint.subject || !complaint.message) { toast.error('Fill all fields'); return }
    setSending(true)
    try {
      await userAPI.sendComplaint({ ...complaint, dateTime: new Date().toISOString() })
      toast.success('Complaint submitted to Admin')
      setComplaintOpen(false)
      setComplaint({ subject: '', message: '' })
    } catch {
      toast.error('Could not send complaint. Try again.')
    } finally { setSending(false) }
  }

  const filtered     = filter === 'unread' ? notifications.filter(n => !n.read) : notifications
  const unreadCount  = notifications.filter(n => !n.read).length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Notifications</h1>
          <p className="section-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#e1e5f2] rounded-lg p-1">
            {['all', 'unread'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-white text-[#022b3a]' : 'text-[#022b3a]/60 hover:text-[#022b3a]'
                }`}>{f}</button>
            ))}
          </div>
          <button onClick={() => setComplaintOpen(true)} className="btn-secondary flex items-center gap-2">
            <MessageSquare size={13} /> Send Complaint
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState title="No notifications" icon={Bell} />
          </div>
        ) : (
          filtered.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.ANNOUNCEMENT
            const Icon = meta.icon
            return (
              <div key={n.id}
                className={`card card-hover flex items-start gap-4 ${!n.read ? 'border-[#bfdbf7]' : 'opacity-70'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#bfdbf7]" />}
                        <p className={`text-sm font-semibold ${n.read ? 'text-[#022b3a]/60' : 'text-[#022b3a]'}`}>{n.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#1f7a8c] mb-1">{n.message}</p>
                      <p className="text-[11px] text-[#022b3a]">{formatDateTime(n.dateTime)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead(n.id)}
                          className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-green-400 hover:bg-green-950/30 transition-all">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteNotif(n.id)}
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

      {/* Complaint Modal */}
      <Modal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} title="Send Complaint to Admin">
        <div className="space-y-4">
          <div>
            <label className="label">Subject <span className="text-[#1f7a8c]">*</span></label>
            <input value={complaint.subject} onChange={e => setComplaint({ ...complaint, subject: e.target.value })}
              placeholder="Brief description of the issue" className="input-field" />
          </div>
          <div>
            <label className="label">Message <span className="text-[#1f7a8c]">*</span></label>
            <textarea value={complaint.message} onChange={e => setComplaint({ ...complaint, message: e.target.value })}
              placeholder="Describe your complaint in detail..." rows={4} className="input-field resize-none" />
          </div>
          <p className="text-xs text-[#1f7a8c]">This will be sent directly to the Admin for review.</p>
          <div className="flex gap-3">
            <button onClick={() => setComplaintOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={sendComplaint} disabled={sending}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {sending
                ? <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />
                : <Send size={13} />
              }
              Submit Complaint
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}