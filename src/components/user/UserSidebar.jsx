import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wrench, CreditCard, Clock,
  FileText, Bell, Settings, LogOut, Home,
  BookOpen, X, Users, ShieldCheck, Shield, ListChecks
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
  surface: '#FFFAF5'
}

const COMMON_NAV = [
  { to: '/user',               icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/user/members',       icon: ShieldCheck,     label: 'Community Members' },
  { to: '/user/security-message', icon: Shield,       label: 'Message Security'  },
  { to: '/user/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/user/settings',      icon: Settings,        label: 'Settings' },
]
const PROPERTY_NAV = [
  { to: '/user/maintenance',     icon: Wrench,      label: 'Maintenance' },
  { to: '/user/maintenance-batch-dues', icon: ListChecks, label: 'Maintenance Batch Dues' },
  { to: '/user/payment-history', icon: CreditCard,  label: 'Payment History' },
  { to: '/user/pending-dues',    icon: Clock,       label: 'Outstanding Dues' },
  { to: '/user/receipts',        icon: FileText,    label: 'Receipts' },
  { to: '/user/financial-report',icon: BookOpen,    label: 'Financial Summary' },
]
const OWNER_ONLY_NAV = [
  { to: '/user/family-members',  icon: Users,       label: 'My Family Members' },
]

export default function UserSidebar({
  isMobile     = false,
  mobileOpen   = false,
  onMobileClose= () => {},
  onNavClick   = () => {},
}) {
  const { logout, user, isOwner, isFamilyMember } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const mobileTranslate = isMobile
    ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
    : 'translate-x-0'

  const navItems = isOwner
    ? [COMMON_NAV[0], ...OWNER_ONLY_NAV, ...PROPERTY_NAV, ...COMMON_NAV.slice(1)]
    : [COMMON_NAV[0], ...PROPERTY_NAV, ...COMMON_NAV.slice(1)]

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col w-72 md:w-60 ${mobileTranslate}`}
      style={{
        background: '#ffffff',
        borderRight: `1px solid ${P.border}`,
        boxShadow: '3px 0 16px rgba(0,121,121,0.07)',
        transition: 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
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
            <Home size={15} color="#fff" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold leading-tight" style={{ color: P.dark }}>ResiTrack</p>
            <p className="text-[10px] leading-tight" style={{ color: P.secondary }}>
              {isFamilyMember ? 'Family Portal' : 'Resident Portal'}
            </p>
          </div>
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

      {/* User info */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: `1px solid ${P.border}`, background: P.accent }}
      >
        <p className="text-xs font-bold truncate" style={{ color: P.dark }}>{user?.name || 'Resident'}</p>
        <p className="text-[10px]" style={{ color: P.secondary }}>
          {isFamilyMember
            ? `${user?.relationship || 'Family'} · Flat ${user?.flatNumber || '—'}`
            : `Flat ${user?.flatNumber || '—'}`
          }
        </p>
      </div>

      {/* FAMILY_MEMBER badge */}
      {isFamilyMember && (
        <div
          className="mx-2 mt-2 px-3 py-1.5 rounded-lg animate-slide-down"
          style={{ background: '#EDE7F6', border: '1px solid #CE93D8' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#6A1B9A' }}>
            Family Member Account
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }, idx) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => { onNavClick(); if (isMobile) onMobileClose() }}
            className={({ isActive }) => `sidebar-link sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ animationDelay: `${30 + idx * 25}ms` }}
            title={label}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span className="truncate text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3" style={{ borderTop: `1px solid ${P.border}` }}>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full"
          style={{ color: '#dc2626' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}
