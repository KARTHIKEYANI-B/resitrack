import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Eye, EyeOff, Building2, Lock, Mail,
  Clock, XCircle, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/authAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  bg: '#FFF0E4', accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5',
}

// ── Status banners (only shown for resident accounts) ────────────────────────
function Banner({ state }) {
  if (!state) return null
  const { type, email, message, reason } = state

  if (type === 'PENDING') return (
    <div className="p-3 rounded-xl space-y-1.5"
      style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
      <div className="flex items-center gap-2">
        <Clock size={14} style={{ color: '#d97706' }} />
        <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
          Pending Admin Approval
        </p>
      </div>
      <p className="text-xs" style={{ color: '#b45309' }}>{message}</p>
      {email && (
        <Link
          to={`/pending-approval?email=${encodeURIComponent(email)}`}
          className="text-xs underline underline-offset-2"
          style={{ color: '#d97706' }}>
          Check status →
        </Link>
      )}
    </div>
  )

  if (type === 'REJECTED') return (
    <div className="p-3 rounded-xl space-y-1.5"
      style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
      <div className="flex items-center gap-2">
        <XCircle size={14} className="text-red-500" />
        <p className="text-sm font-semibold text-red-700">Registration Not Approved</p>
      </div>
      {reason && (
        <p className="text-xs text-red-600 pl-2 border-l-2 border-red-200">{reason}</p>
      )}
      <Link to="/register" className="text-xs text-red-500 underline underline-offset-2">
        Re-register →
      </Link>
    </div>
  )

  if (type === 'INACTIVE') return (
    <div className="p-3 rounded-xl"
      style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">Account Deactivated</p>
      </div>
      <p className="text-xs text-gray-500 mt-1">{message}</p>
    </div>
  )

  return null
}

// ── Main login page ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const [form,       setForm]       = useState({ email: '', password: '' })
  const [showPw,     setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [banner,     setBanner]     = useState(null)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /**
   * Single submit handler.
   * Calls /auth/login — backend detects the role and returns it.
   * Frontend reads user.role and navigates to the correct dashboard.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      toast.error('Email (or mobile number) and password are required')
      return
    }

    setLoading(true)
    setBanner(null)

    try {
      const res  = await authAPI.login(form)
      const data = res.data?.data ?? res.data

      login(data.token, data.user, rememberMe)
      toast.success(`Welcome, ${data.user?.name || 'User'}!`)

      // Auto-redirect based on role returned by backend
      const role = data.user?.role
      if (role === 'ADMIN')    navigate('/admin',    { replace: true })
      else if (role === 'SECURITY') navigate('/security', { replace: true })
      else                     navigate('/user',     { replace: true })

    } catch (err) {
      const msg = err.response?.data?.message || ''

      if (msg.startsWith('PENDING:')) {
        setBanner({ type: 'PENDING', email: form.email, message: msg.slice('PENDING:'.length) })
        return
      }
      if (msg.startsWith('REJECTED:')) {
        setBanner({ type: 'REJECTED', email: form.email, reason: msg.slice('REJECTED:'.length) })
        return
      }
      if (msg.startsWith('INACTIVE:')) {
        setBanner({ type: 'INACTIVE', email: form.email, message: msg.slice('INACTIVE:'.length) })
        return
      }
      toast.error(msg || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${P.bg} 0%, #fff8f0 50%, #fff0e4 100%)`,
      }}>
      <div className="w-full max-w-md animate-scale-in">

        {/* ── Brand ── */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background: P.primary,
              boxShadow: '0 8px 24px rgba(0,121,121,0.30)',
            }}>
            <Building2 size={26} color="#fff" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: P.dark }}>R R Dhurya</h1>
          <p className="text-xs mt-1" style={{ color: P.secondary }}>
            Owners Welfare Association
          </p>
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: P.surface,
            border: `1px solid ${P.border}`,
            boxShadow: '0 4px 24px rgba(0,121,121,0.12)',
          }}>

          {/* Card header */}
          <div
            className="px-6 pt-6 pb-4"
            style={{ borderBottom: `1px solid ${P.border}`, background: P.accent + '66' }}>
            <h2 className="text-base font-bold" style={{ color: P.dark }}>Sign In</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">

            <Banner state={banner} />

            {/* Email / phone */}
            <div>
              <label className="label">Email Address or Mobile Number</label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: P.secondary }}
                />
                <input
                  type="text"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  autoComplete="username email"
                  required
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: P.secondary }}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="input-field pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: P.secondary }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(v => !v)}
                className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background:  rememberMe ? P.primary : 'transparent',
                  borderColor: rememberMe ? P.primary : P.border,
                }}>
                {rememberMe && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path
                      d="M1 3.5L3.5 6L8 1"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs" style={{ color: P.muted }}>
                Remember me
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold mt-2">
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {/* Register link — only for residents */}
            <div className="text-center space-y-1">
              <p className="text-xs" style={{ color: P.muted }}>
                New resident?{' '}
                <Link
                  to="/register"
                  className="font-semibold underline underline-offset-2"
                  style={{ color: P.primary }}>
                  Register here
                </Link>
              </p>
              {/* <p className="text-[10px]" style={{ color: P.border }}>
                Admin &amp; Security accounts are created by the Super Admin only.
              </p> */}
            </div>
          </form>
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: P.muted }}>
          © {new Date().getFullYear()} ResiTrack · Secure Resident Management
        </p>
      </div>
    </div>
  )
}