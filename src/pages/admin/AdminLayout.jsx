// AdminLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminNavbar  from '../../components/admin/AdminNavbar'

const SIDEBAR_FULL      = 240
const SIDEBAR_COLLAPSED = 64

export function AdminLayout() {
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
        <div
          className="fixed inset-0 z-30"
          style={{
            background: 'rgba(0,121,121,0.35)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeInFast 0.2s ease both',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AdminSidebar
        collapsed={collapsed} setCollapsed={setCollapsed}
        isMobile={isMobile} mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onNavClick={() => { if (isMobile) setSidebarOpen(false) }}
      />
      <div
        className="flex flex-col min-h-screen"
        style={{
          marginLeft: desktopMargin,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <AdminNavbar sidebarWidth={desktopMargin} isMobile={isMobile} onMenuClick={() => setSidebarOpen(true)} />
        <main
          key={location.pathname}
          className="flex-1 mt-16 p-3 sm:p-4 md:p-6 overflow-x-hidden animate-page-enter"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
