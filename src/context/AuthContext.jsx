import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'resitrack_token'
const USER_KEY  = 'resitrack_user'

function readStored(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => readStored(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = readStored(TOKEN_KEY)
    const savedUser  = readStored(USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((tokenValue, userData, rememberMe = false) => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)

    const store = rememberMe ? localStorage : sessionStorage
    store.setItem(TOKEN_KEY, tokenValue)
    store.setItem(USER_KEY, JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin        = user?.role === 'ADMIN'
  const isUser         = user?.role === 'USER'
  const isSecurityUser = user?.role === 'SECURITY'
  const isSuperAdmin   = user?.role === 'ADMIN' && user?.superAdmin === true
  const isOwner        = user?.role === 'USER' && (user?.residentRole === 'OWNER' || !user?.residentRole)
  const isFamilyMember = user?.role === 'USER' && user?.residentRole === 'FAMILY_MEMBER'

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, loading,
      isAdmin, isUser, isSecurityUser, isSuperAdmin, isOwner, isFamilyMember,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}