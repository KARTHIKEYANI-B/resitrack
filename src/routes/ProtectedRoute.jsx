import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute wraps routes that require authentication.
 *
 * role prop values:
 *   "ADMIN"    — only admin logins
 *   "USER"     — any USER role (owners AND family members)
 *   "SECURITY" — only security guard logins
 *   "OWNER"    — only property owners (residentRole === OWNER)
 *   undefined  — any authenticated user
 */
export default function ProtectedRoute({ children, role }) {
  const { user, token, loading, isOwner } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token || !user) return <Navigate to="/login" replace />

  if (role === 'ADMIN' && user.role !== 'ADMIN') {
    if (user.role === 'SECURITY') return <Navigate to="/security" replace />
    return <Navigate to="/user" replace />
  }

  if (role === 'USER' && user.role !== 'USER') {
    if (user.role === 'ADMIN')    return <Navigate to="/admin" replace />
    if (user.role === 'SECURITY') return <Navigate to="/security" replace />
    return <Navigate to="/login" replace />
  }

  if (role === 'SECURITY' && user.role !== 'SECURITY') {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/user" replace />
  }

  // OWNER-only routes — redirect family members to their dashboard
  if (role === 'OWNER' && !isOwner) {
    return <Navigate to="/user" replace />
  }

  return children
}