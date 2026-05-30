import { Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminNavbar  from '../../components/admin/AdminNavbar'

const SIDEBAR_FULL      = 240
const SIDEBAR_COLLAPSED = 64

export default function AdminLayout() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)  // mobile drawer state

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    if (!mobile) setSidebarOpen(false) // auto-close drawer on resize to desktop
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  // Close mobile sidebar when route changes
  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false)
  }

  const desktopMargin = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL)

  return (
    <div className="min-h-screen bg-cyan-50 flex">

      {/* ── Mobile overlay backdrop ──────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onNavClick={handleNavClick}
      />

      {/* ── Main content ────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: desktopMargin }}
      >
        <AdminNavbar
          sidebarWidth={desktopMargin}
          isMobile={isMobile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 mt-16 p-3 sm:p-4 md:p-6 overflow-x-hidden animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}