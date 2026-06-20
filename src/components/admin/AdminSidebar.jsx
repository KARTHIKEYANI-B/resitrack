import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, UserCheck, Wrench, CreditCard, Receipt,
  Clock, FileText, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Building2, BookOpen, Users, X,
  MessageSquare, ShieldCheck, ClipboardCheck, ListChecks, Table2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../api/adminAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
}

export default function AdminSidebar({
  collapsed    = false,
  setCollapsed = () => {},
  isMobile     = false,
  mobileOpen   = false,
  onMobileClose= () => {},
  onNavClick   = () => {},
}) {
  const [pendingCount,        setPendingCount]        = useState(0)
  const [unreadNotifs,        setUnreadNotifs]        = useState(0)
  const [openComplaints,      setOpenComplaints]      = useState(0)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const { logout } = useAuth()
  const navigate   = useNavigate()

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [aRes, nRes, cRes, vRes] = await Promise.allSettled([
          adminAPI.getApprovalCount(),
          adminAPI.getUnreadNotificationCount(),
          adminAPI.getComplaintStats(),
          adminAPI.getVerificationPendingCount(),
        ])
        if (aRes.status === 'fulfilled') setPendingCount(aRes.value.data?.data?.pending ?? 0)
        if (nRes.status === 'fulfilled') setUnreadNotifs(nRes.value.data?.data?.count  ?? 0)
        if (cRes.status === 'fulfilled') {
          const d = cRes.value.data?.data ?? cRes.value.data
          setOpenComplaints((d?.open ?? 0) + (d?.inProgress ?? 0))
        }
        if (vRes.status === 'fulfilled') setPendingVerifications(vRes.value.data?.data?.count ?? 0)
      } catch {}
    }
    fetchBadges()
    const id = setInterval(fetchBadges, 30_000)
    return () => clearInterval(id)
  }, [])

  const handleLogout   = () => { logout(); toast.success('Logged out'); navigate('/login') }
  const handleNavClick = () => { onNavClick(); if (isMobile) onMobileClose() }

  const NAV = [
    { to: '/admin',                  icon: LayoutDashboard, label: 'Dashboard',          end: true },
    { to: '/admin/approvals',        icon: UserCheck,       label: 'Resident Approvals', badge: pendingCount },
    { to: '/admin/residents',        icon: Users,           label: 'Resident Directory' },
    { to: '/admin/members',          icon: ShieldCheck,     label: 'Community Members' },
    { to: '/admin/maintenance',      icon: Wrench,          label: 'Maintenance' },
    { to: '/admin/maintenance-list', icon: ListChecks,      label: 'Maintenance Summary' },
    { to: '/admin/payments',              icon: CreditCard,     label: 'Payment Management' },
    { to: '/admin/resident-payment-detail', icon: Table2,       label: 'Resident Paid/Unpaid Detail' },
    { to: '/admin/payment-verification',  icon: ClipboardCheck, label: 'Payment Approvals', badge: pendingVerifications },
    { to: '/admin/expenses',         icon: Receipt,         label: 'Expenses' },
    { to: '/admin/pending-dues',     icon: Clock,           label: 'Outstanding Dues' },
    { to: '/admin/receipts',         icon: FileText,        label: 'Receipts' },
    { to: '/admin/financial-report', icon: BookOpen,        label: 'Financial Summary' },
    { to: '/admin/complaints',       icon: MessageSquare,   label: 'Complaints',         badge: openComplaints },
    { to: '/admin/notifications',    icon: Bell,            label: 'Notifications',      badge: unreadNotifs },
    { to: '/admin/settings',         icon: Settings,        label: 'Settings' },
  ]

  const desktopWidth    = collapsed ? 'md:w-16' : 'md:w-60'
  const mobileTranslate = isMobile
    ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
    : 'translate-x-0'

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col bg-white w-72 md:w-auto ${desktopWidth} ${mobileTranslate}`}
      style={{
        borderRight: `1px solid ${P.border}`,
        boxShadow: '3px 0 16px rgba(0,121,121,0.07)',
        transition: 'width 0.3s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center justify-between px-4 py-4 min-h-[65px]"
        style={{ borderBottom: `1px solid ${P.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${P.primary} 0%, ${P.secondary} 100%)`,
              boxShadow: `0 2px 8px rgba(0,121,121,0.3)`,
              transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'rotate(-10deg) scale(1.1)'
              e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,121,121,0.4)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
              e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,121,121,0.3)`
            }}
          >
            <Building2 size={15} color="#fff" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden animate-fade-in">
              <p className="text-xs font-bold leading-tight" style={{ color: P.dark }}>R R Dhurya</p>
              <p className="text-[10px] leading-tight" style={{ color: P.secondary }}>Owners Welfare Association</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-xl"
            style={{
              color: P.muted,
              transition: 'background 0.14s ease, color 0.14s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = P.accent
              e.currentTarget.style.color = P.primary
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = P.muted
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end, badge }, idx) => (
          <NavLink
            key={to} to={to} end={end}
            title={collapsed && !isMobile ? label : ''}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-link sidebar-nav-item relative ${isActive ? 'active' : ''} ${collapsed && !isMobile ? 'justify-center' : ''}`
            }
            style={{ animationDelay: `${30 + idx * 22}ms` }}
          >
            <div className="relative flex-shrink-0" style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <Icon size={17} />
              {collapsed && !isMobile && badge > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center badge-live"
                  style={{ background: P.secondary }}
                >
                  {badge > 99 ? '!' : badge}
                </span>
              )}
            </div>
            {(!collapsed || isMobile) && (
              <>
                <span className="flex-1 truncate text-sm">{label}</span>
                {badge > 0 && (
                  <span
                    className="ml-auto min-w-[20px] h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5"
                    style={{
                      background: P.secondary,
                      transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 space-y-1" style={{ borderTop: `1px solid ${P.border}` }}>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`sidebar-link w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <span style={{ transition: 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)', display: 'flex' }}>
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </span>
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full ${collapsed && !isMobile ? 'justify-center' : ''}`}
          style={{ color: '#dc2626' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={17} className="flex-shrink-0" style={{ transition: 'transform 0.2s ease' }} />
          {(!collapsed || isMobile) && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  )
}