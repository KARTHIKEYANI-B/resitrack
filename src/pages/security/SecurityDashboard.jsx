import { useState, useEffect } from 'react'
import { Users, Bell, MessageSquare, Shield } from 'lucide-react'
import { securityAPI } from '../../api/securityAPI'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5',
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      style={{ background: P.surface, border: `1px solid ${P.border}` }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22', color }}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: P.dark }}>{value}</p>
        <p className="text-xs" style={{ color: P.muted }}>{label}</p>
      </div>
    </div>
  )
}

export default function SecurityDashboard() {
  const [residents, setResidents] = useState([])
  const [unread,    setUnread]    = useState(0)
  const [loading,   setLoading]   = useState(true)
  const { user } = useAuth()
  const navigate  = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, nRes] = await Promise.allSettled([
          securityAPI.getResidents(),
          securityAPI.getUnreadCount(),
        ])
        if (rRes.status === 'fulfilled')
          setResidents(rRes.value.data?.data ?? rRes.value.data ?? [])
        if (nRes.status === 'fulfilled')
          setUnread(nRes.value.data?.data?.count ?? 0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalFamilyMembers = residents.reduce(
    (sum, r) => sum + (r.familyMembers?.length ?? 0), 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: P.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: P.dark }}>
          Welcome, {user?.name || 'Security Officer'}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: P.muted }}>
          Security Dashboard · Read-only resident access
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="Your Role"
          value="Security"
          color={P.primary}
        />
        <StatCard
          icon={Users}
          label="Residents"
          value={residents.length}
          color={P.secondary}
          onClick={() => navigate('/security/residents')}
        />
        <StatCard
          icon={Users}
          label="Family Members"
          value={totalFamilyMembers}
          color="#8b5cf6"
          onClick={() => navigate('/security/residents')}
        />
        <StatCard
          icon={Bell}
          label="Unread Messages"
          value={unread}
          color="#f59e0b"
          onClick={() => navigate('/security/notifications')}
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <h2 className="text-sm font-semibold" style={{ color: P.dark }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/security/residents')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: P.primary }}>
            <Users size={15} /> View Residents
          </button>
          <button onClick={() => navigate('/security/notifications')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: P.accent, color: P.primary, border: `1px solid ${P.border}` }}>
            <Bell size={15} /> Notifications
            {unread > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ background: '#ef4444' }}>{unread}</span>
            )}
          </button>
          <button onClick={() => navigate('/security/messages')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: P.accent, color: P.primary, border: `1px solid ${P.border}` }}>
            <MessageSquare size={15} /> Send Message
          </button>
        </div>
      </div>

      {/* Recent residents preview */}
      {residents.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: P.surface, border: `1px solid ${P.border}` }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${P.border}` }}>
            <h2 className="text-sm font-semibold" style={{ color: P.dark }}>Recent Residents</h2>
            <button onClick={() => navigate('/security/residents')}
              className="text-xs font-medium" style={{ color: P.primary }}>
              View all →
            </button>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {residents.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: P.dark }}>{r.ownerName}</p>
                  <p className="text-xs" style={{ color: P.muted }}>
                    Flat {r.flatNumber} · {r.familyMembers?.length ?? 0} family member(s)
                  </p>
                </div>
                <p className="text-xs font-medium px-2 py-1 rounded-lg"
                  style={{ background: P.accent, color: P.primary }}>
                  {r.propertyType}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}