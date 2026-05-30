import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, RefreshCw, Building2,
         Mail, Phone, Home, AlertTriangle } from 'lucide-react'
import { authAPI } from '../../api/authAPI'

const STATUS_META = {
  PENDING: {
    icon:  Clock,
    color: 'text-yellow-400',
    bg:    'bg-yellow-950/30 border-yellow-900/40',
    label: 'Pending Review',
    desc:  'Your registration is being reviewed by the admin.',
  },
  APPROVED: {
    icon:  CheckCircle,
    color: 'text-green-400',
    bg:    'bg-green-950/30 border-green-900/40',
    label: 'Approved',
    desc:  'Your registration has been approved. You can now log in.',
  },
  REJECTED: {
    icon:  XCircle,
    color: 'text-red-400',
    bg:    'bg-red-950/30 border-red-900/40',
    label: 'Not Approved',
    desc:  'Your registration was not approved by the admin.',
  },
}

const REFRESH_INTERVAL = 30 // seconds

export default function PendingApprovalPage() {
  const [searchParams]            = useSearchParams()
  const navigate                  = useNavigate()
  const email                     = searchParams.get('email') || ''

  const [data,        setData]    = useState(null)
  const [loading,     setLoading] = useState(true)
  const [error,       setError]   = useState(null)
  const [countdown,   setCountdown] = useState(REFRESH_INTERVAL)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const fetchStatus = useCallback(async () => {
    if (!email) { setError('No email provided. Please register first.'); setLoading(false); return }
    setLoading(true)
    try {
      const res = await authAPI.getRegistrationStatus(email)
      setData(res.data?.data ?? null)
      setError(null)
      setCountdown(REFRESH_INTERVAL)
      setLastRefreshed(new Date())
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not fetch registration status.'
      setError(msg)
    } finally { setLoading(false) }
  }, [email])

  // Initial fetch
  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { fetchStatus(); return REFRESH_INTERVAL }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [fetchStatus])

  const meta    = STATUS_META[data?.status ?? 'PENDING']
  const StatusIcon = meta.icon

  if (!email) {
    return (
      <CenteredLayout>
        <div className="card text-center py-12 space-y-4">
          <AlertTriangle size={36} className="text-[#1f7a8c] mx-auto" />
          <p className="text-sm text-[#022b3a]/60">No registration email found.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Register Now
          </Link>
        </div>
      </CenteredLayout>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#bfdbf720_1px,transparent_1px),linear-gradient(to_bottom,#bfdbf720_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4 animate-slide-up">

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl mb-3">
            <Building2 size={22} className="text-[#022b3a]" />
          </div>
          <h1 className="text-lg font-bold text-[#022b3a]">Registration Status</h1>
          <p className="text-xs text-[#1f7a8c] mt-0.5">R R Dhurya Owners Welfare Association</p>
        </div>

        {/* Status Card */}
        <div className="card space-y-5">

          {loading && !data ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#bfdbf7] border-t-gray-300 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-6 space-y-3">
              <AlertTriangle size={28} className="text-red-400 mx-auto" />
              <p className="text-sm text-[#022b3a]/60">{error}</p>
              <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-sm">
                Register Again
              </Link>
            </div>
          ) : data && (
            <>
              {/* Status Badge */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg}`}>
                <StatusIcon size={22} className={meta.color} />
                <div>
                  <p className={`font-bold text-sm ${meta.color}`}>{meta.label}</p>
                  <p className="text-xs text-[#1f7a8c] mt-0.5">{meta.desc}</p>
                </div>
              </div>

              {/* User details */}
              <div className="space-y-2.5">
                <DetailRow icon={Building2} label="Name"     value={data.name} />
                <DetailRow icon={Mail}      label="Email"    value={data.email} />
                <DetailRow icon={Home}      label="Property" value={`${data.flatType || 'Flat'} ${data.flatNumber || ''}`} />
                <DetailRow icon={Clock}     label="Registered" value={data.registrationDate} />
                {data.approvedAt && (
                  <DetailRow icon={CheckCircle} label="Decision Date" value={data.approvedAt} />
                )}
              </div>

              {/* Status-specific content */}
              {data.status === 'PENDING' && (
                <div className="p-3 bg-white/60 rounded-xl border border-[#bfdbf7] space-y-2">
                  <p className="text-xs font-medium text-[#022b3a]">What happens next?</p>
                  <ul className="space-y-1.5">
                    {[
                      'Admin reviews your registration details',
                      'You\'ll be notified when approved',
                      'After approval, log in with your email and password',
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[#1f7a8c]">
                        <span className="w-4 h-4 rounded-full bg-[#e1e5f2] text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#022b3a]/60">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-[#1f7a8c] mt-2">
                    Estimated review time: 1–2 business days
                  </p>
                </div>
              )}

              {data.status === 'APPROVED' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-950/20 rounded-xl border border-green-900/30">
                    <p className="text-xs text-green-300 font-medium">
                      🎉 Your account is ready to use!
                    </p>
                    <p className="text-[11px] text-[#1f7a8c] mt-1">
                      Log in using your registered email and password.
                    </p>
                  </div>
                  <button onClick={() => navigate('/login')}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Click here to Login
                  </button>
                </div>
              )}

              {data.status === 'REJECTED' && (
                <div className="space-y-3">
                  {data.rejectedReason && (
                    <div className="p-3 bg-red-950/20 rounded-xl border border-red-900/30">
                      <p className="text-[10px] text-red-400 font-medium uppercase tracking-wide mb-1">
                        Rejection Reason
                      </p>
                      <p className="text-xs text-[#022b3a]">{data.rejectedReason}</p>
                    </div>
                  )}
                  <div className="p-3 bg-white/60 rounded-xl border border-[#bfdbf7]">
                    <p className="text-xs text-[#022b3a]/60">
                      Need help? Contact the admin at the apartment office.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/register"
                      className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                      Re-Register
                    </Link>
                    <Link to="/login" className="btn-secondary flex-1 text-sm text-center">
                      Back to Login
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Auto-refresh indicator */}
        {data && (
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-[#022b3a]">
              {lastRefreshed ? `Last checked: ${lastRefreshed.toLocaleTimeString()}` : ''}
            </p>
            <div className="flex items-center gap-2">
              {loading && <div className="w-3 h-3 border border-[#bfdbf7] border-t-gray-400 rounded-full animate-spin" />}
              <p className="text-[10px] text-[#1f7a8c]">
                Refreshing in {countdown}s
              </p>
              <button onClick={fetchStatus} disabled={loading}
                className="p-1 rounded text-[#1f7a8c] hover:text-[#022b3a]/60 disabled:opacity-30 transition-colors">
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-[#022b3a]">
          © 2025 ResiTrack · R R Dhurya Owners Welfare Association
        </p>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#bfdbf7]/60 last:border-0">
      <div className="w-6 h-6 rounded-md bg-[#e1e5f2] flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-[#1f7a8c]" />
      </div>
      <span className="text-[11px] text-[#1f7a8c] w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-[#022b3a] truncate">{value || '—'}</span>
    </div>
  )
}

function CenteredLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}