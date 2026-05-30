import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axiosInstance from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('resitrack_token'))
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('resitrack_token')
    const savedUser  = localStorage.getItem('resitrack_user')
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

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('resitrack_token', tokenValue)
    localStorage.setItem('resitrack_user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('resitrack_token')
    localStorage.removeItem('resitrack_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'ADMIN'
  const isUser  = user?.role === 'USER'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
