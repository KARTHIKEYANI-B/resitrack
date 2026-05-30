import { Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import UserSidebar from '../../components/user/UserSidebar'
import UserNavbar  from '../../components/user/UserNavbar'

export default function UserLayout() {
  const [isMobile,    setIsMobile]    = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const sidebarW = isMobile ? 0 : 240

  return (
    <div className="min-h-screen bg-cyan-50 flex">

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <UserSidebar
        isMobile={isMobile}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onNavClick={() => { if (isMobile) setSidebarOpen(false) }}
      />

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarW }}
      >
        <UserNavbar
          sidebarWidth={sidebarW}
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