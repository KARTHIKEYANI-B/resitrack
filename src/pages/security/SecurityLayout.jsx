import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  Building2, LayoutDashboard, Users, Bell,
  LogOut, ChevronLeft, ChevronRight, X, Menu, MessageSquare
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { securityAPI } from '../../api/securityAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
}

const SIDEBAR_FULL      = 240
const SIDEBAR_COLLAPSED = 64

function Sidebar({ collapsed, setCollapsed, isMobile, mobileOpen, onMobileClose, onNavClick }) {
  const [unread,   setUnread]   = useState(0)
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await securityAPI.getUnreadCount()
        setUnread(res.data?.data?.count ?? 0)
      } catch {}
    }
    fetch()
    const id = setInterval(fetch, 60_000)
    return () => clearInterval(id)
  }, [])

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login') }
  const handleNav    = () => { onNavClick(); if (isMobile) onMobileClose() }

  const NAV = [
    { to: '/security',               icon: LayoutDashboard, label: 'Dashboard',      end: true },
    { to: '/security/residents',     icon: Users,           label: 'Residents'   },
    { to: '/security/notifications', icon: Bell,            label: 'Notifications', badge: unread },
    { to: '/security/messages',      icon: MessageSquare,   label: 'Send Message' },
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
      <div className="flex items-center justify-between px-4 py-4 min-h-[65px]"
        style={{ borderBottom: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${P.primary} 0%, ${P.secondary} 100%)` }}>
            <Building2 size={15} color="#fff" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold leading-tight" style={{ color: P.dark }}>R R Dhurya</p>
              <p className="text-[10px] leading-tight" style={{ color: P.secondary }}>Security Portal</p>
            </div>
          )}
        </div>
        {isMobile
          ? <button onClick={onMobileClose} className="p-1 rounded-lg" style={{ color: P.muted }}><X size={18} /></button>
          : <button onClick={() => setCollapsed(v => !v)} className="p-1 rounded-lg transition-colors hover:bg-gray-50" style={{ color: P.muted }}>
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        }
      </div>

      {/* Guard info */}
      {(!collapsed || isMobile) && (
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${P.border}`, background: P.accent + '55' }}>
          <p className="text-xs font-semibold truncate" style={{ color: P.dark }}>{user?.name || 'Security Guard'}</p>
          <p className="text-[10px] mt-0.5" style={{ color: P.muted }}>Security Officer</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, badge, end }) => (
          <NavLink key={to} to={to} end={end} onClick={handleNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
               ${isActive ? 'text-white shadow-sm' : 'hover:bg-gray-50'}`
            }
            style={({ isActive }) => ({
              background: isActive ? `linear-gradient(135deg, ${P.primary} 0%, ${P.secondary} 100%)` : undefined,
              color: isActive ? '#fff' : P.body,
            })}>
            <Icon size={16} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
            {badge > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: '#ef4444', color: '#fff' }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 pt-2" style={{ borderTop: `1px solid ${P.border}` }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
          style={{ color: '#ef4444' }}>
          <LogOut size={16} />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

function Navbar({ sidebarWidth, isMobile, onMenuClick }) {
  const { user } = useAuth()
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-3 px-4 h-16"
      style={{
        left: isMobile ? 0 : sidebarWidth,
        background: 'rgba(255,250,245,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${P.border}`,
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
      {isMobile && (
        <button onClick={onMenuClick} className="p-2 rounded-xl" style={{ color: P.primary }}>
          <Menu size={20} />
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: P.primary }}>
          {(user?.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold" style={{ color: P.dark }}>{user?.name}</p>
          <p className="text-[10px]" style={{ color: P.secondary }}>Security Officer</p>
        </div>
      </div>
    </header>
  )
}

export default function SecurityLayout() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    if (!mobile) setSidebarOpen(false)
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  const desktopMargin = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL)

  return (
    <div className="min-h-screen" style={{ background: 'var(--rt-bg)' }}>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-30"
          style={{ background: 'rgba(0,121,121,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        collapsed={collapsed} setCollapsed={setCollapsed}
        isMobile={isMobile}   mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onNavClick={() => { if (isMobile) setSidebarOpen(false) }}
      />
      <div className="flex flex-col min-h-screen"
        style={{ marginLeft: desktopMargin, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <Navbar sidebarWidth={desktopMargin} isMobile={isMobile} onMenuClick={() => setSidebarOpen(true)} />
        <main key={location.pathname} className="flex-1 mt-16 p-3 sm:p-4 md:p-6 overflow-x-hidden animate-page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}