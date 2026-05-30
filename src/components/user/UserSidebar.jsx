import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wrench, CreditCard, Clock,
  FileText, Bell, Settings, LogOut, ChevronLeft,
  ChevronRight, Home, BookOpen, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/user',                  icon: LayoutDashboard, label: 'Dashboard',       end: true },
  { to: '/user/maintenance',      icon: Wrench,          label: 'Maintenance' },
  { to: '/user/payment-history',  icon: CreditCard,      label: 'Payment History' },
  { to: '/user/pending-dues',     icon: Clock,           label: 'Pending Dues' },
  { to: '/user/receipts',         icon: FileText,        label: 'Receipts' },
  { to: '/user/financial-report', icon: BookOpen,        label: 'Financial Report' },
  { to: '/user/notifications',    icon: Bell,            label: 'Notifications' },
  { to: '/user/settings',         icon: Settings,        label: 'Settings' },
]

export default function UserSidebar({
  isMobile     = false,
  mobileOpen   = false,
  onMobileClose= () => {},
  onNavClick   = () => {},
}) {
  const { logout, user } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const mobileTranslate = isMobile
    ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
    : 'translate-x-0'

  return (
    <aside className={`
      fixed left-0 top-0 h-full z-40
      flex flex-col
      bg-white border-r border-cyan-200 shadow-card
      transition-all duration-300
      w-72 md:w-60
      ${mobileTranslate}
    `}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-cyan-100 min-h-[65px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Home size={16} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-blue-950 leading-tight">ResiTrack</p>
            <p className="text-[10px] text-sky-500 leading-tight">Resident Portal</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-sky-400 hover:text-blue-900 hover:bg-cyan-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50/60">
        <p className="text-xs font-semibold text-blue-950 truncate">{user?.name || 'Resident'}</p>
        <p className="text-[10px] text-sky-500">Flat {user?.flatNumber || '—'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => { onNavClick(); if (isMobile) onMobileClose() }}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={label}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span className="truncate text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-cyan-100 space-y-1">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}