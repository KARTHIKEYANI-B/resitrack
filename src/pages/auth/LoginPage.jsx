import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Eye, EyeOff, Building2, Lock, Mail,
  Shield, User, Clock, XCircle, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/authAPI'
import toast from 'react-hot-toast'

/* ─── approval-state banner after failed login ──────────────── */
function ApprovalBanner({ state }) {
  if (!state) return null

  const { type, email, message, reason } = state

  if (type === 'PENDING') return (
    <div className="p-4 bg-yellow-950/30 border border-yellow-900/50 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-yellow-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-yellow-300">Registration Pending Approval</p>
      </div>
      <p className="text-xs text-[#022b3a]/60 leading-relaxed">{message}</p>
      <Link
        to={`/pending-approval?email=${encodeURIComponent(email)}`}
        className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors"
      >
        <Clock size={11} /> Check your approval status →
      </Link>
    </div>
  )

  if (type === 'REJECTED') return (
    <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <XCircle size={15} className="text-red-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-red-300">Registration Not Approved</p>
      </div>
      {reason && (
        <div className="pl-2 border-l-2 border-red-900">
          <p className="text-[11px] text-[#1f7a8c] font-medium">Reason provided by admin:</p>
          <p className="text-xs text-[#022b3a]/60">{reason}</p>
        </div>
      )}
      <div className="flex items-center gap-3 pt-1">
        <Link
          to={`/pending-approval?email=${encodeURIComponent(email)}`}
          className="text-xs text-[#022b3a]/60 hover:text-[#022b3a] underline underline-offset-2"
        >
          View details
        </Link>
        <span className="text-[#022b3a]">·</span>
        <Link to="/register" className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2">
          Re-register
        </Link>
      </div>
    </div>
  )

  if (type === 'INACTIVE') return (
    <div className="p-4 bg-white border border-[#bfdbf7] rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="text-[#022b3a]/60 flex-shrink-0" />
        <p className="text-sm font-semibold text-[#022b3a]">Account Deactivated</p>
      </div>
      <p className="text-xs text-[#1f7a8c]">{message}</p>
      <p className="text-xs text-[#1f7a8c]">
        Contact the apartment admin office for assistance.
      </p>
    </div>
  )

  return null
}

export default function LoginPage() {
  const [tab,    setTab]    = useState('admin')
  const [form,   setForm]   = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading,setLoading]= useState(false)
  const [banner, setBanner] = useState(null)   // {type, email, message, reason}
  const { login }           = useAuth()
  const navigate            = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (banner) setBanner(null)  // clear banner on new input
  }

  const handleTabChange = (t) => {
    setTab(t)
    setForm({ email: '', password: '' })
    setBanner(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    setBanner(null)
    try {
      const fn  = tab === 'admin' ? authAPI.adminLogin : authAPI.userLogin
      const res = await fn(form)

      const jwt = res.data?.data
      if (!jwt?.token) { toast.error('Unexpected server response'); return }

      login(jwt.token, jwt.user)
      toast.success(`Welcome back, ${jwt.user.name}!`)
      navigate(jwt.user.role === 'ADMIN' ? '/admin' : '/user', { replace: true })

    } catch (err) {
      const rawMsg = err.response?.data?.message || ''

      // Backend encodes approval state in the error message:
      // "PENDING:email:Human readable message"
      // "REJECTED:email:Rejection reason"
      // "INACTIVE::Human readable message"
      if (rawMsg.startsWith('PENDING:')) {
        const parts = rawMsg.split(':')
        const email = parts[1]
        const msg   = parts.slice(2).join(':')
        setBanner({ type: 'PENDING', email, message: msg })
        return
      }
      if (rawMsg.startsWith('REJECTED:')) {
        const parts  = rawMsg.split(':')
        const email  = parts[1]
        const reason = parts.slice(2).join(':')
        setBanner({ type: 'REJECTED', email, message: rawMsg, reason })
        return
      }
      if (rawMsg.startsWith('INACTIVE:')) {
        const msg = rawMsg.split(':').slice(2).join(':')
        setBanner({ type: 'INACTIVE', email: form.email, message: msg })
        return
      }

      toast.error(rawMsg || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#bfdbf720_1px,transparent_1px),linear-gradient(to_bottom,#bfdbf720_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4 shadow-lg">
            <Building2 size={26} className="text-[#022b3a]" />
          </div>
          <h1 className="text-2xl font-bold text-[#022b3a]">ResiTrack</h1>
          <p className="text-[#1f7a8c] text-sm mt-1">Apartment Management System</p>
          <p className="text-[11px] text-[#1f7a8c] mt-0.5">R R Dhurya Owners Welfare Association</p>
        </div>

        <div className="card border-[#bfdbf7]">

          {/* Role toggle */}
          <div className="flex bg-[#e1e5f2] rounded-lg p-1 mb-6">
            {[
              { key: 'admin', icon: Shield, label: 'Admin Login' },
              { key: 'user',  icon: User,   label: 'Resident Login' },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => handleTabChange(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  tab === key
                    ? 'bg-[#022b3a] text-white shadow-sm'
                    : 'text-[#1f7a8c] hover:text-[#022b3a]'
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Approval state banner — shown instead of generic toast */}
          {banner && <div className="mb-4"><ApprovalBanner state={banner} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange}
                  placeholder={tab === 'admin' ? 'admin@resitrack.com' : 'your@email.com'}
                  className="input-field pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
                <input
                  type={showPw ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Enter your password"
                  className="input-field pl-9 pr-10" autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f7a8c] hover:text-[#022b3a] transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 h-10">
              {loading
                ? <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />
                : <><Lock size={14} />{tab === 'admin' ? 'Login as Admin' : 'Login as Resident'}</>}
            </button>
          </form>

          {tab === 'user' && (
            <p className="text-center text-xs text-[#1f7a8c] mt-4">
              New resident?{' '}
              <Link to="/register"
                className="text-[#022b3a] hover:text-[#022b3a] underline underline-offset-2 transition-colors">
                Register here
              </Link>
            </p>
          )}

          {tab === 'admin' && (
            <p className="text-center text-xs text-[#1f7a8c] mt-4">
              Admin accounts are managed internally.
            </p>
          )}
        </div>

        <p className="text-center text-[11px] text-[#022b3a] mt-6">
          © 2026 ResiTrack · R R Dhurya Owners Welfare Association
        </p>
      </div>
    </div>
  )
}