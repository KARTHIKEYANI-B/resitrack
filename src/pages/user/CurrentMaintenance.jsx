import { useState, useEffect } from 'react'
import {
  ExternalLink, CheckCircle, AlertCircle, Eye, Smartphone,
  CalendarDays, IndianRupee, Clock, ArrowUpRight
} from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, getCurrentMonth } from '../../utils/dateUtils'

const GPAY_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user&hl=en_IN'

export default function CurrentMaintenance() {
  const [maintenance, setMaintenance] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [billModal,   setBillModal]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userAPI.getCurrentMaintenance()
        setMaintenance(res.data)
      } catch {
        setMaintenance(null)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <PageLoader />

  const m = maintenance
  const total = m
    ? (m.amount || 0) + (m.lateFeeApplied ? (m.lateFee || 0) : 0)
    : 0

  const isPaid                = m?.status === 'PAID'
  const isPendingVerification = m?.status === 'PENDING_VERIFICATION'
  const isPending             = !isPaid && !isPendingVerification

  const handlePayNow = () => {
    window.open(GPAY_PLAY_STORE, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title text-xl">Current Maintenance</h1>
        <p className="section-subtitle">Your maintenance bill for {m?.month || getCurrentMonth()}</p>
      </div>

      {/* Bill Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#bfdbf7]">
          <div>
            <p className="text-xs text-[#1f7a8c] uppercase tracking-wide">Bill for</p>
            <p className="text-base font-semibold text-[#022b3a] mt-0.5">{m?.month || getCurrentMonth()}</p>
          </div>
          <span className={
            isPaid                ? 'badge-paid text-sm px-3 py-1' :
            isPendingVerification ? 'text-xs px-3 py-1 rounded-full bg-yellow-950/40 border border-yellow-800/50 text-yellow-400' :
                                    'badge-pending text-sm px-3 py-1'
          }>
            {isPaid ? 'PAID' : isPendingVerification ? 'Pending Verification' : 'UNPAID'}
          </span>
        </div>

        {/* Bill breakdown */}
        {m ? (
          <div className="space-y-3">
            {[
              { label: 'Maintenance Amount', value: formatCurrency(m.amount), icon: IndianRupee },
              { label: 'Property Type',      value: m.flatType,               icon: null },
              { label: 'Due Date',           value: formatDate(m.dueDate),    icon: CalendarDays },
              ...(m.lateFeeApplied ? [{ label: 'Late Fee', value: formatCurrency(m.lateFee), accent: true }] : []),
            ].map(({ label, value, accent, icon: Icon }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-[#bfdbf7]/60">
                <span className="text-sm text-[#022b3a]/60">{label}</span>
                <span className={`text-sm font-medium ${accent ? 'text-red-400' : 'text-[#022b3a]'}`}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold text-[#022b3a]">Total Amount</span>
              <span className="text-xl font-bold text-[#022b3a] font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#1f7a8c] text-center py-6">
            No maintenance bill found for this month. Contact admin.
          </p>
        )}

        {/* Status / Action area */}
        {isPaid ? (
          <div className="mt-5 flex items-center gap-3 p-4 bg-green-950/20 border border-green-900/30 rounded-xl">
            <CheckCircle size={18} className="text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-400">Payment Completed</p>
              <p className="text-xs text-[#1f7a8c]">Your maintenance for {m?.month} is paid. Thank you!</p>
            </div>
          </div>
        ) : isPendingVerification ? (
          <div className="mt-5 flex items-center gap-3 p-4 bg-yellow-950/20 border border-yellow-900/30 rounded-xl">
            <Clock size={18} className="text-yellow-400" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Verification Pending</p>
              <p className="text-xs text-[#1f7a8c]">Your payment is awaiting admin approval.</p>
            </div>
          </div>
        ) : m ? (
          <div className="mt-5 space-y-3">
            {/* Pay Now via Google Pay */}
            <button
              onClick={handlePayNow}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Smartphone size={16} />
              Pay via Google Pay
              <ExternalLink size={13} className="opacity-70" />
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setBillModal(true)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Eye size={14} /> View Bill Details
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Google Pay info card */}
      {isPending && m && (
        <div className="card border border-[#bfdbf7]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1e5f2] flex items-center justify-center flex-shrink-0">
              <Smartphone size={18} className="text-[#022b3a]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#022b3a]">How to pay your maintenance</p>
              <ol className="mt-2 space-y-1 text-xs text-[#1f7a8c] list-decimal list-inside">
                <li>Tap <strong>"Pay via Google Pay"</strong> above</li>
                <li>Download or open Google Pay on your phone</li>
                <li>Pay the maintenance amount to the apartment UPI ID</li>
                <li>Take a screenshot of the payment confirmation</li>
                <li>Contact admin with the transaction ID for verification</li>
              </ol>
              <button
                onClick={handlePayNow}
                className="mt-3 flex items-center gap-1.5 text-xs text-[#022b3a] hover:text-[#1f7a8c] font-medium transition-colors"
              >
                Open Google Pay on Play Store <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Late fee notice */}
      {isPending && m?.lateFeeApplied && (
        <div className="flex items-start gap-3 p-4 bg-white border border-[#bfdbf7] rounded-xl">
          <AlertCircle size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#022b3a]/60">
            A late fee of <strong className="text-[#022b3a]">{formatCurrency(m.lateFee)}</strong> has been applied
            because your payment was not received by {formatDate(m.dueDate)}.
          </p>
        </div>
      )}

      {/* Bill Details Modal */}
      <Modal isOpen={billModal} onClose={() => setBillModal(false)} title="Bill Details">
        {m && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-[#bfdbf7] space-y-3">
              {[
                { label: 'Billing Month',         value: m.month },
                { label: 'Property Type',         value: m.flatType },
                { label: 'Maintenance Amount',    value: formatCurrency(m.amount), mono: true },
                { label: 'Due Date',              value: formatDate(m.dueDate) },
                ...(m.lateFeeApplied ? [{ label: 'Late Fee', value: `+ ${formatCurrency(m.lateFee)}`, red: true, mono: true }] : []),
                ...(m.previousDues > 0 ? [{ label: 'Previous Dues', value: `+ ${formatCurrency(m.previousDues)}`, red: true, mono: true }] : []),
              ].map(({ label, value, mono, red }) => (
                <div key={label} className="flex justify-between py-2 border-b border-[#bfdbf7]">
                  <span className="text-sm text-[#022b3a]/60">{label}</span>
                  <span className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${red ? 'text-red-400' : 'text-[#022b3a]'}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="text-sm font-bold text-[#022b3a]">Total Payable</span>
                <span className="text-lg font-bold text-[#022b3a] font-mono">
                  {formatCurrency(total + (m.previousDues || 0))}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg border border-[#bfdbf7]">
              <AlertCircle size={13} className="text-[#1f7a8c] flex-shrink-0" />
              <p className="text-xs text-[#1f7a8c]">
                Late fee applies after grace period. Contact admin for disputes.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
