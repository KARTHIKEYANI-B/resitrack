import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, ChevronDown, LogOut, Edit2, Eye, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function UserNavbar({ sidebarWidth = 240, isMobile = false, onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout }                = useAuth()
  const navigate                        = useNavigate()
  const dropdownRef                     = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header
      className="fixed top-0 right-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-cyan-200 flex items-center justify-between px-3 sm:px-6 shadow-sm"
      style={{ left: isMobile ? 0 : sidebarWidth, transition: 'left 0.3s' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-sky-600 hover:bg-cyan-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-widest hidden sm:block">
          Resident Portal
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative p-2 rounded-lg text-sky-500 hover:text-blue-900 hover:bg-cyan-100 transition-all"
          onClick={() => navigate('/user/notifications')}
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-lg hover:bg-cyan-100 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-blue-950 leading-none">{user?.name || 'Resident'}</p>
              <p className="text-[10px] text-sky-500 leading-none mt-0.5">Flat {user?.flatNumber || '—'}</p>
            </div>
            <ChevronDown size={13} className={`text-sky-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-cyan-200 rounded-xl shadow-card-hover overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50">
                <p className="text-xs font-semibold text-blue-950 truncate">{user?.name}</p>
                <p className="text-[10px] text-sky-500 mt-0.5 truncate">{user?.email}</p>
              </div>
              {[
                { icon: Eye,   label: 'View Profile', action: () => navigate('/user/settings') },
                { icon: Edit2, label: 'Edit Profile',  action: () => navigate('/user/settings') },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => { setDropdownOpen(false); action() }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-900 hover:bg-cyan-50 transition-colors text-left"
                >
                  <Icon size={14} className="text-sky-500" />{label}
                </button>
              ))}
              <div className="border-t border-cyan-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={14} />Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}