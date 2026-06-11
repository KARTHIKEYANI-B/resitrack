import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute wraps routes that require authentication.
 *
 * role prop values:
 *   "ADMIN"         — only admin logins
 *   "USER"          — any USER role (owners AND family members)
 *   "OWNER"         — only property owners (residentRole === OWNER)
 *   undefined/null  — any authenticated user
 */
export default function ProtectedRoute({ children, role }) {
  const { user, token, loading, isOwner, isFamilyMember } = useAuth()

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
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/user'} replace />
  }

  if (role === 'USER' && user.role !== 'USER') {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/user'} replace />
  }

  // OWNER-only routes — redirect family members to their dashboard
  if (role === 'OWNER' && !isOwner) {
    return <Navigate to="/user" replace />
  }

  return children
}