import { useState, useEffect } from 'react'
import {
  CreditCard, Clock, CheckCircle, TrendingUp, AlertCircle,
  ChevronRight, IndianRupee, Calendar, Receipt, Bell
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import { useAuth } from '../../context/AuthContext'

/* ── helper: month label from YYYY-MM ─────────────────────────────────── */
function monthLabel(ym) {
  if (!ym) return new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

/* ── status badge ─────────────────────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    PAID:                 { cls: 'bg-green-950/40 border-green-800/50 text-green-400',   label: 'PAID' },
    PENDING_VERIFICATION: { cls: 'bg-yellow-950/40 border-yellow-800/50 text-yellow-400', label: 'PENDING VERIFICATION' },
    OVERDUE:              { cls: 'bg-red-950/40 border-red-800/50 text-red-400',          label: 'OVERDUE' },
    PENDING:              { cls: 'bg-[#e1e5f2] border-[#bfdbf7] text-[#022b3a]/60',       label: 'UNPAID THIS MONTH' },
  }
  const c = map[status] || map.PENDING
  return (
    <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${c.cls}`}>{c.label}</span>
  )
}

export default function UserDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const { user }              = useAuth()
  const navigate              = useNavigate()

  useEffect(() => {
    userAPI.getDashboardStats()
      .then(res => setStats(res.data?.data ?? res.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const s            = stats || {}
  const isPaid       = s.paymentStatus === 'PAID'
  const isOverdue    = s.paymentStatus === 'OVERDUE'
  const isPendVerify = s.paymentStatus === 'PENDING_VERIFICATION'
  const currentDue   = s.currentDue  ?? 0
  const monthlyDue   = s.currentMonthDue ?? 0
  const paidAmount   = s.paidAmount   ?? 0
  const totalPaid    = s.totalPaidAmount ?? 0

  const currentMonthLabel = monthLabel(s.currentMonth)
  const year2026 = new Date().getFullYear()

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome header */}
      <div>
        <h1 className="section-title text-xl">
          Welcome back, {user?.name?.split(' ')[0] || 'Resident'}!
        </h1>
        <p className="section-subtitle">
          {user?.flatNumber ? `${user.flatType || 'Flat'} ${user.flatNumber} · ` : ''}
          {currentMonthLabel} Overview
        </p>
      </div>

      {/* Alert Banner */}
      {!isPaid && !isPendVerify && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          isOverdue ? 'bg-red-950/20 border-red-900/40' : 'bg-white border-[#bfdbf7]'
        }`}>
          <AlertCircle size={16} className={isOverdue ? 'text-red-400' : 'text-yellow-400'} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#022b3a]">
              {isOverdue ? 'Maintenance Overdue!' : 'Maintenance Due'}
            </p>
            <p className="text-xs text-[#1f7a8c] truncate">
              {formatCurrency(currentDue)} due{s.dueDate ? ` by ${formatDate(s.dueDate)}` : ''}.
              {isOverdue && ' Late fee may apply.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/user/maintenance')}
            className="btn-primary text-xs flex items-center gap-1 flex-shrink-0"
          >
            Pay Now <ChevronRight size={12} />
          </button>
        </div>
      )}

      {isPendVerify && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-950/20 border border-yellow-900/40">
          <Clock size={16} className="text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">Payment Awaiting Verification</p>
            <p className="text-xs text-[#1f7a8c]">
              Your payment is submitted and pending admin approval. Hang tight!
            </p>
          </div>
        </div>
      )}

      {/* ── 4-card grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rt-stat-grid">

        {/* Card 1 — Current Month Due */}
        <div className="card card-hover">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="stat-label">This Month's Maintenance Due</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${
                isPaid ? 'text-green-400' : isOverdue ? 'text-red-400' : 'text-[#022b3a]'
              }`}>
                {isPaid ? '₹0' : formatCurrency(currentDue)}
              </p>
              <p className="text-xs text-[#1f7a8c] mt-1">
                Maintenance: {formatCurrency(monthlyDue)}
                {s.lateFeeApplied && s.lateFee > 0 && (
                  <span className="text-red-400"> + {formatCurrency(s.lateFee)} late fee</span>
                )}
              </p>
            </div>
            <div className={`stat-icon flex-shrink-0 ${
              isPaid ? 'bg-green-950/30' : isOverdue ? 'bg-red-950/30' : 'bg-[#e1e5f2]'
            }`}>
              {isPaid
                ? <CheckCircle size={18} className="text-green-400" />
                : <IndianRupee size={18} className={isOverdue ? 'text-red-400' : 'text-yellow-500'} />
              }
            </div>
          </div>
          {s.dueDate && !isPaid && (
            <p className="text-xs text-[#022b3a]/50 mt-3 flex items-center gap-1">
              <Calendar size={11} />
              Due date: {formatDate(s.dueDate)}
            </p>
          )}
          {!isPaid && !isPendVerify && (
            <button
              onClick={() => navigate('/user/maintenance')}
              className="mt-3 btn-primary w-full text-xs flex items-center justify-center gap-1.5"
            >
              Pay via Google Pay <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Card 2 — Payment Status */}
        <div className="card card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Current Payment Status</p>
              <div className="mt-2">
                <StatusPill status={s.paymentStatus || 'PENDING'} />
              </div>
              <p className="text-xs text-[#1f7a8c] mt-2">{currentMonthLabel} {year2026}</p>
              {isPaid && s.transactionId && (
                <p className="text-xs font-mono text-[#022b3a]/40 mt-1 truncate">
                  TXN: {s.transactionId}
                </p>
              )}
            </div>
            <div className="stat-icon flex-shrink-0">
              <CreditCard size={18} className="text-[#022b3a]/60" />
            </div>
          </div>
          {isPaid && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle size={11} />
              Paid: {formatCurrency(paidAmount)}
            </div>
          )}
        </div>

        {/* Card 3 — Last Payment */}
        <div className="card card-hover">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="stat-label">Last Payment Received</p>
              <p className="text-2xl font-bold font-mono text-[#022b3a] mt-1">
                {s.lastPaymentAmount ? formatCurrency(s.lastPaymentAmount) : '—'}
              </p>
              <p className="text-xs text-[#1f7a8c] mt-1">
                {s.lastPaymentDate
                  ? `${formatDate(s.lastPaymentDate)}${s.lastPaymentMethod ? ` · ${s.lastPaymentMethod}` : ''}`
                  : 'No payment recorded yet'}
              </p>
            </div>
            <div className="stat-icon flex-shrink-0">
              <CheckCircle size={18} className="text-[#022b3a]/60" />
            </div>
          </div>
        </div>

        {/* Card 4 — Total Paid */}
        <div className="card card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Amount Paid (All Time)</p>
              <p className="text-2xl font-bold font-mono text-[#022b3a] mt-1">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-[#1f7a8c] mt-1">Since registration</p>
            </div>
            <div className="stat-icon flex-shrink-0">
              <TrendingUp size={18} className="text-[#022b3a]/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[#022b3a] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rt-stat-grid">
          {[
            { label: 'Pay Maintenance Bill',  path: '/user/maintenance',     icon: CreditCard },
            { label: 'Payment History',  path: '/user/payment-history', icon: Clock },
            { label: 'Outstanding Dues',     path: '/user/pending-dues',    icon: AlertCircle },
            { label: 'My Payment Receipts',      path: '/user/receipts',        icon: Receipt },
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#e1e5f2] hover:bg-[#bfdbf7] border border-[#bfdbf7] transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#bfdbf7] group-hover:bg-white/60 flex items-center justify-center transition-all">
                <Icon size={15} className="text-[#022b3a]/60 group-hover:text-[#022b3a]" />
              </div>
              <span className="text-xs text-[#022b3a]/60 group-hover:text-[#022b3a] text-center leading-tight transition-colors">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notice */}
      {/* <div className="flex items-start gap-3 p-3 bg-white/60 border border-[#bfdbf7] rounded-xl">
        <Bell size={13} className="text-[#1f7a8c] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1f7a8c]">
          Maintenance amount is set by admin. Contact admin if you have any discrepancy.
          Payments made via Google Pay should be reported to admin for verification.
        </p>
      </div> */}
    </div>
  )
}
