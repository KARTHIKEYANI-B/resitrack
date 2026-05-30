import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, UserCheck, Wrench, CreditCard, Receipt,
  Clock, FileText, BarChart3, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Building2, BookOpen, Users, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../api/adminAPI'
import toast from 'react-hot-toast'

export default function AdminSidebar({
  collapsed    = false,
  setCollapsed = () => {},
  isMobile     = false,
  mobileOpen   = false,
  onMobileClose= () => {},
  onNavClick   = () => {},
}) {
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const { logout } = useAuth()
  const navigate   = useNavigate()

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [aRes, nRes] = await Promise.allSettled([
          adminAPI.getApprovalCount(),
          adminAPI.getUnreadNotificationCount(),
        ])
        if (aRes.status === 'fulfilled') setPendingCount(aRes.value.data?.data?.pending ?? 0)
        if (nRes.status === 'fulfilled') setUnreadNotifs(nRes.value.data?.data?.count  ?? 0)
      } catch {}
    }
    fetchBadges()
    const id = setInterval(fetchBadges, 60_000)
    return () => clearInterval(id)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const handleNavClick = () => {
    onNavClick()
    if (isMobile) onMobileClose()
  }

  const NAV = [
    { to: '/admin',                  icon: LayoutDashboard, label: 'Dashboard',          end: true },
    { to: '/admin/approvals',        icon: UserCheck,       label: 'Resident Approvals', badge: pendingCount },
    { to: '/admin/residents',        icon: Users,           label: 'Residents' },
    { to: '/admin/maintenance',      icon: Wrench,          label: 'Maintenance' },
    { to: '/admin/payments',         icon: CreditCard,      label: 'Payment Tracking' },
    { to: '/admin/expenses',         icon: Receipt,         label: 'Expenses' },
    { to: '/admin/pending-dues',     icon: Clock,           label: 'Pending Dues' },
    { to: '/admin/receipts',         icon: FileText,        label: 'Receipts' },
    { to: '/admin/financial-report', icon: BookOpen,        label: 'Financial Report' },
    { to: '/admin/reports',          icon: BarChart3,       label: 'Analytics' },
    { to: '/admin/notifications',    icon: Bell,            label: 'Notifications', badge: unreadNotifs },
    { to: '/admin/settings',         icon: Settings,        label: 'Settings' },
  ]

  // Width on desktop
  const desktopWidth = collapsed ? 'md:w-16' : 'md:w-60'

  // Mobile: always full-width drawer (w-72), slides in/out
  const mobileTranslate = isMobile
    ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
    : 'translate-x-0'  // desktop: always visible

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        bg-white border-r border-cyan-200 shadow-card
        transition-all duration-300
        w-72 md:w-auto ${desktopWidth}
        ${mobileTranslate}
      `}
    >
      {/* Brand + mobile close */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-cyan-100 min-h-[65px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-blue-950 leading-tight">R R Dhurya</p>
              <p className="text-[10px] text-sky-500 leading-tight">Owners Welfare Association</p>
            </div>
          )}
        </div>
        {/* Close button — mobile only */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-sky-400 hover:text-blue-900 hover:bg-cyan-100 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed && !isMobile ? label : ''}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-link relative ${isActive ? 'active' : ''} ${
                collapsed && !isMobile ? 'justify-center' : ''
              }`
            }
          >
            <div className="relative flex-shrink-0">
              <Icon size={17} />
              {collapsed && !isMobile && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {badge > 99 ? '!' : badge}
                </span>
              )}
            </div>
            {(!collapsed || isMobile) && (
              <>
                <span className="flex-1 truncate text-sm">{label}</span>
                {badge > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-cyan-100 space-y-1">
        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`sidebar-link w-full ${collapsed ? 'justify-center' : ''}`}
          >
            {collapsed
              ? <ChevronRight size={17} />
              : <><ChevronLeft size={17} /><span className="text-sm">Collapse</span></>
            }
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  )
}