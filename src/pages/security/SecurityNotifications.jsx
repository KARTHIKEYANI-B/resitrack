import { useState, useEffect } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
import { securityAPI } from '../../api/securityAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SecurityNotifications() {
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await securityAPI.getNotifications()
      setNotifs(res.data?.data ?? res.data ?? [])
    } catch {
      setNotifs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      await securityAPI.markRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.isRead)
    await Promise.allSettled(unread.map(n => securityAPI.markRead(n.id)))
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  const unreadCount = notifs.filter(n => !n.isRead).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: P.dark }}>Notifications</h1>
          <p className="text-xs mt-0.5" style={{ color: P.muted }}>
            Messages and alerts from Admin
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: P.accent, color: P.primary, border: `1px solid ${P.border}` }}>
            <Check size={13} /> Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: P.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-12" style={{ color: P.muted }}>
          <BellOff size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id}
              className="rounded-2xl p-4 flex gap-3 items-start transition-all"
              style={{
                background: n.isRead ? P.surface : P.accent + '99',
                border: `1px solid ${n.isRead ? P.border : P.primary + '44'}`,
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: P.primary + '18', color: P.primary }}>
                <Bell size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: P.dark }}>{n.title}</p>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: P.muted }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: P.body ?? P.dark, lineHeight: '1.5' }}>
                  {n.message}
                </p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-green-100"
                  style={{ color: P.primary }}
                  title="Mark as read">
                  <Check size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}