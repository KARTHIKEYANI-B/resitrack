import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Wrench, CheckCircle, Clock, AlertCircle, IndianRupee,
  CalendarDays, Send, Smartphone, Banknote, Building2, X
} from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

/* ── helpers ──────────────────────────────────────────────────── */
const STATUS_STYLE = {
  UNPAID:               'bg-red-50 text-red-600 border-red-200',
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-600 border-amber-200',
  PAID:                 'bg-green-50 text-green-700 border-green-200',
  REJECTED:             'bg-red-50 text-red-600 border-red-200',
}
const STATUS_LABEL = {
  UNPAID:               'Unpaid',
  PENDING_VERIFICATION: 'Pending Verification',
  PAID:                 'Paid',
  REJECTED:             'Rejected — Resubmit',
}

const PAYMENT_METHODS = [
  { id: 'UPI',           label: 'UPI / Google Pay', icon: Smartphone, desc: 'Pay via UPI and enter the transaction ID' },
  { id: 'CASH',          label: 'Cash',              icon: Banknote,   desc: 'Pay cash to an admin in person' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer',     icon: Building2,  desc: 'Direct bank transfer with reference ID' },
]

/* ── Main page ──────────────────────────────────────────────── */
export default function MaintenanceBatchDues() {
  const [dues,      setDues]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [payModal,  setPayModal]  = useState(false)
  const [selected,  setSelected]  = useState(null)   // the due being paid
  const [method,    setMethod]    = useState(null)
  const [txnId,     setTxnId]     = useState('')
  const [submitting,setSubmitting]= useState(false)

  const loadDues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userAPI.getMaintenanceBatchDues()
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setDues(data)
    } catch {
      toast.error('Could not load maintenance batch dues')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDues() }, [loadDues])

  const openPay = (due) => {
    setSelected(due)
    setMethod(null)
    setTxnId('')
    setPayModal(true)
  }

  const handleSubmitPayment = async () => {
    if (!method) { toast.error('Select a payment method'); return }
    if ((method === 'UPI' || method === 'BANK_TRANSFER') && !txnId.trim()) {
      toast.error('Transaction / reference ID is required'); return
    }
    setSubmitting(true)
    try {
      await userAPI.payMaintenanceBatchDue(selected.batchPaymentId, {
        paymentMethod: method,
        transactionId: txnId.trim() || undefined,
      })
      toast.success('Payment submitted! Admin will verify shortly.')
      setPayModal(false)
      loadDues()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit payment')
    } finally { setSubmitting(false) }
  }

  const totalUnpaid = dues
    .filter(d => d.status === 'UNPAID' || d.status === 'REJECTED')
    .reduce((s, d) => s + (d.amount || 0), 0)
  const unpaidCount = dues.filter(d => d.status === 'UNPAID' || d.status === 'REJECTED').length
  const paidCount   = dues.filter(d => d.status === 'PAID').length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Maintenance Batch Dues</h1>
          <p className="section-subtitle">
            Special / one-off maintenance batches (e.g. festival collections) billed to your property
          </p>
        </div>
        <button onClick={loadDues} className="btn-secondary flex items-center gap-2 text-xs w-fit">
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Summary cards */}
      {dues.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Outstanding Batch Dues</p>
                <p className="stat-value mt-1 text-red-500">{formatCurrency(totalUnpaid)}</p>
                <p className="text-xs text-[#1f7a8c] mt-1">{unpaidCount} unpaid batch{unpaidCount === 1 ? '' : 'es'}</p>
              </div>
              <div className="stat-icon"><IndianRupee size={17} className="text-red-400/60" /></div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Batches Paid</p>
                <p className="stat-value mt-1 text-green-600">{paidCount}</p>
                <p className="text-xs text-[#1f7a8c] mt-1">Verified by admin</p>
              </div>
              <div className="stat-icon"><CheckCircle size={17} className="text-green-500/60" /></div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Total Batches</p>
                <p className="stat-value mt-1">{dues.length}</p>
                <p className="text-xs text-[#1f7a8c] mt-1">Assigned to your property</p>
              </div>
              <div className="stat-icon"><Wrench size={17} className="text-[#022b3a]/60" /></div>
            </div>
          </div>
        </div>
      )}

      {/* Dues list */}
      {dues.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#022b3a]">No Batch Dues</h2>
            <p className="text-sm text-[#1f7a8c] mt-1">
              You have no special maintenance batches assigned right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#bfdbf7]">
            <h2 className="text-sm font-semibold text-[#022b3a]">Batch-wise Dues</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#bfdbf7] bg-white/50">
                <tr>
                  {['Batch Name', 'Amount', 'Due Date', 'Status', ''].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dues.map(d => (
                  <tr key={d.batchPaymentId} className="table-row">
                    <td className="table-cell font-medium text-[#022b3a]">
                      {d.batchTitle}
                      {d.category && <p className="text-[10px] text-[#1f7a8c]/70">{d.category}</p>}
                    </td>
                    <td className="table-cell font-mono">{formatCurrency(d.amount)}</td>
                    <td className="table-cell">{d.dueDate ? formatDate(d.dueDate) : '—'}</td>
                    <td className="table-cell">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[d.status] ?? STATUS_STYLE.UNPAID}`}>
                        {STATUS_LABEL[d.status] ?? d.status}
                      </span>
                      {d.status === 'REJECTED' && d.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[180px]">{d.rejectionReason}</p>
                      )}
                    </td>
                    <td className="table-cell">
                      {(d.status === 'UNPAID' || d.status === 'REJECTED') && (
                        <button onClick={() => openPay(d)} className="btn-primary text-xs px-3 py-1.5">Pay Now</button>
                      )}
                      {d.status === 'PENDING_VERIFICATION' && (
                        <span className="text-[10px] text-amber-600">Awaiting verification</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-[#e8eef5]">
            {dues.map(d => (
              <div key={d.batchPaymentId} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#022b3a]">{d.batchTitle}</p>
                    {d.category && <p className="text-[10px] text-[#1f7a8c]/70">{d.category}</p>}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLE[d.status] ?? STATUS_STYLE.UNPAID}`}>
                    {STATUS_LABEL[d.status] ?? d.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#1f7a8c]">
                  <span className="flex items-center gap-1"><IndianRupee size={11} />{formatCurrency(d.amount)}</span>
                  {d.dueDate && <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(d.dueDate)}</span>}
                </div>
                {d.status === 'REJECTED' && d.rejectionReason && (
                  <p className="text-[10px] text-red-500">{d.rejectionReason}</p>
                )}
                {(d.status === 'UNPAID' || d.status === 'REJECTED') && (
                  <button onClick={() => openPay(d)} className="btn-primary text-xs w-full mt-1">Pay Now</button>
                )}
                {d.status === 'PENDING_VERIFICATION' && (
                  <p className="text-[10px] text-amber-600">Awaiting admin verification</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title={`Pay — ${selected?.batchTitle ?? ''}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
            <span className="text-sm text-blue-900">Amount Due</span>
            <span className="text-lg font-bold text-blue-950 font-mono">{formatCurrency(selected?.amount)}</span>
          </div>

          <div>
            <label className="label">Payment Method *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                <button key={id} onClick={() => setMethod(id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    method === id ? 'border-sky-400 bg-sky-50' : 'border-cyan-200 hover:border-sky-300 bg-white'
                  }`}>
                  <Icon size={16} className="text-sky-600 mb-1" />
                  <p className="text-xs font-semibold text-blue-950">{label}</p>
                  <p className="text-[10px] text-sky-500 mt-0.5 leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {(method === 'UPI' || method === 'BANK_TRANSFER') && (
            <div>
              <label className="label">{method === 'UPI' ? 'Transaction ID *' : 'Reference / Transaction ID *'}</label>
              <input value={txnId} onChange={e => setTxnId(e.target.value)}
                placeholder="Enter transaction reference" className="input-field font-mono" />
            </div>
          )}

          {method === 'CASH' && (
            <div className="flex gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-600 leading-relaxed">
                Hand the cash to an admin, then submit. The admin will verify and mark this batch as paid.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setPayModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmitPayment} disabled={submitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Send size={14} />}
              {submitting ? 'Submitting…' : 'Submit Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
