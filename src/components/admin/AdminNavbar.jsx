import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, ChevronDown, LogOut, Settings, Edit2, Eye, Menu, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../api/adminAPI'
import toast from 'react-hot-toast'

const P = { primary: '#007979', secondary: '#24B1B1', accent: '#FFE0C5', border: '#E8C9AB', dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5' }

const BTN_T = 'background-color 0.14s ease, transform 0.16s cubic-bezier(0.34,1.56,0.64,1)'

export default function AdminNavbar({ sidebarWidth = 240, isMobile = false, onMenuClick }) {
  const [dropdownOpen,         setDropdownOpen]         = useState(false)
  const [unreadCount,          setUnreadCount]          = useState(0)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const { user, logout }                = useAuth()
  const navigate                        = useNavigate()
  const dropdownRef                     = useRef(null)

  const fetchUnread = useCallback(async () => {
    try {
      const [nRes, vRes] = await Promise.allSettled([
        adminAPI.getUnreadNotificationCount(),
        adminAPI.getVerificationPendingCount(),
      ])
      if (nRes.status === 'fulfilled') setUnreadCount(nRes.value.data?.data?.count ?? 0)
      if (vRes.status === 'fulfilled') setPendingVerifications(vRes.value.data?.data?.count ?? 0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [fetchUnread])

  useEffect(() => {
    const fn = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <header
      className="fixed top-0 right-0 z-20 h-16 flex items-center justify-between px-3 sm:px-6"
      style={{
        left: isMobile ? 0 : sidebarWidth,
        transition: 'left 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        background: 'rgba(255,250,245,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${P.border}`,
        boxShadow: '0 1px 12px rgba(0,121,121,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl"
            style={{ color: P.primary, transition: BTN_T }}
            onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
          >
            <Menu size={20} />
          </button>
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block" style={{ color: P.secondary }}>
          Admin Portal
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Payment Verification badge — only shown when there are pending requests */}
        {pendingVerifications > 0 && (
          <button
            onClick={() => navigate('/admin/payment-verification')}
            className="relative p-2 rounded-xl"
            title="Pending payment verifications"
            style={{ color: P.primary, transition: BTN_T }}
            onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.88)' }}
          >
            <ClipboardCheck size={17} />
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
              style={{ background: '#f59e0b', animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both, badgePulse 2s ease 0.5s infinite' }}
            >
              {pendingVerifications > 99 ? '99+' : pendingVerifications}
            </span>
          </button>
        )}

        {/* Bell */}
        <button
          onClick={() => { navigate('/admin/notifications'); setUnreadCount(0) }}
          className="relative p-2 rounded-xl"
          style={{ color: P.primary, transition: BTN_T }}
          onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.88)' }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none badge-live"
              style={{ background: P.secondary, animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both, badgePulse 2s ease 0.5s infinite' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-xl"
            style={{ transition: 'background-color 0.14s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = P.accent}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${P.primary} 0%, ${P.secondary} 100%)`,
                boxShadow: `0 2px 6px rgba(0,121,121,0.25)`,
                transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <User size={14} color="#fff" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-none" style={{ color: P.dark }}>{user?.name || 'Admin'}</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: P.secondary }}>Administrator</p>
            </div>
            <ChevronDown
              size={13}
              className="hidden sm:block"
              style={{
                color: P.muted,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-50 animate-dropdown"
              style={{
                background: P.surface,
                border: `1px solid ${P.border}`,
                boxShadow: '0 12px 40px rgba(0,121,121,0.14), 0 4px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${P.border}`, background: P.accent }}>
                <p className="text-xs font-bold truncate" style={{ color: P.dark }}>{user?.name || 'Admin'}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: P.secondary }}>{user?.email || ''}</p>
              </div>
              {[
                { icon: Eye,      label: 'View Profile',    path: '/admin/settings' },
                { icon: Edit2,    label: 'Edit Profile',    path: '/admin/settings' },
                { icon: Settings, label: 'Change Password', path: '/admin/settings?tab=password' },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={label}
                  onClick={() => { setDropdownOpen(false); navigate(path) }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left"
                  style={{
                    color: P.body,
                    transition: 'background-color 0.13s ease, padding-left 0.16s cubic-bezier(0.25,0.46,0.45,0.94)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.paddingLeft = '1.25rem' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '1rem' }}
                >
                  <Icon size={14} style={{ color: P.secondary }} /> {label}
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${P.border}` }}>
                <button
                  onClick={() => { logout(); toast.success('Logged out'); navigate('/login') }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left"
                  style={{
                    color: '#dc2626',
                    transition: 'background-color 0.13s ease, padding-left 0.16s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.paddingLeft = '1.25rem' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '1rem' }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}