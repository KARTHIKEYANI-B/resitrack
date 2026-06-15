import { useState, useEffect, useRef } from 'react'
import {
  ExternalLink, CheckCircle, AlertCircle, Eye, Smartphone,
  CalendarDays, IndianRupee, Clock, ArrowUpRight, Upload,
  Send, FileImage, Banknote, Building2, CreditCard
} from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, getCurrentMonth } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const GPAY_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user&hl=en_IN'

const PAYMENT_METHODS = [
  {
    id: 'GPAY',
    label: 'Google Pay (GPay)',
    icon: Smartphone,
    desc: 'Pay via Google Pay & submit screenshot',
    color: '#4285F4',
  },
  {
    id: 'CASH',
    label: 'Cash',
    icon: Banknote,
    desc: 'Pay cash to an admin in person',
    color: '#2E7D32',
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: Building2,
    desc: 'Direct bank transfer with reference ID',
    color: '#6A1B9A',
  },
]

export default function CurrentMaintenance() {
  const [maintenance,      setMaintenance]      = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [billModal,        setBillModal]        = useState(false)
  const [paymentModal,     setPaymentModal]     = useState(false)
  const [selectedMethod,   setSelectedMethod]   = useState(null) 

  const [form,             setForm]             = useState({
    name: '', phoneNumber: '', paymentAmount: '',
    // GPAY
    transactionId: '',
    // CASH
    paidToAdminId: '',
    // BANK_TRANSFER
    referenceId: '', bankName: '',
  })
  const [screenshot,       setScreenshot]       = useState(null)
  const [screenshotName,   setScreenshotName]   = useState('')
  const [submitting,       setSubmitting]       = useState(false)
  const [errors,           setErrors]           = useState({})

  // Active admins for CASH payment
  const [activeAdmins,     setActiveAdmins]     = useState([])
  const [adminsLoading,    setAdminsLoading]    = useState(false)

  const fileRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userAPI.getCurrentMaintenance()
        setMaintenance(res.data)
        try {
          const profile = await userAPI.getProfile()
          const p = profile.data?.data || profile.data || {}
          setForm(f => ({ ...f, name: p.fullName || '', phoneNumber: p.phone || '' }))
        } catch { /* optional */ }
      } catch {
        setMaintenance(null)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedMethod === 'CASH' && activeAdmins.length === 0) {
      setAdminsLoading(true)
      userAPI.getActiveAdminsForCashPayment()
        .then(res => {
          const data = res.data?.data || res.data || []
          setActiveAdmins(Array.isArray(data) ? data : [])
        })
        .catch(() => toast.error('Could not load admin list'))
        .finally(() => setAdminsLoading(false))
    }
  }, [selectedMethod])

  if (loading) return <PageLoader />

  const m     = maintenance
  const total = m ? (m.amount || 0) + (m.lateFeeApplied ? (m.lateFee || 0) : 0) : 0

  const isPaid                = m?.status === 'PAID'
  const isPendingVerification = m?.status === 'PENDING_VERIFICATION'
  const isPending             = !isPaid && !isPendingVerification

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type.toLowerCase())) {
      toast.error('Invalid file type. Use JPG, PNG, WEBP, or PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10 MB.')
      return
    }
    setScreenshot(file)
    setScreenshotName(file.name)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name        = 'Name is required'
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required'
    if (!form.paymentAmount || isNaN(Number(form.paymentAmount)) || Number(form.paymentAmount) <= 0)
      e.paymentAmount = 'Enter a valid payment amount'

    if (selectedMethod === 'GPAY') {
      if (!form.transactionId.trim()) e.transactionId = 'Transaction ID is required'
    }
    if (selectedMethod === 'CASH') {
      if (!form.paidToAdminId) e.paidToAdminId = 'Please select the admin you paid cash to'
    }
    if (selectedMethod === 'BANK_TRANSFER') {
      if (!form.referenceId.trim()) e.referenceId = 'Reference / Transaction ID is required'
    }
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSubmitting(true)
    try {
      if (selectedMethod === 'GPAY') {
        await userAPI.submitPaymentVerificationRequest({
          name:          form.name.trim(),
          phoneNumber:   form.phoneNumber.trim(),
          paymentAmount: parseFloat(form.paymentAmount),
          transactionId: form.transactionId.trim(),
          screenshot,
        })
        toast.success('GPay details submitted! Admin will verify shortly.')
      } else if (selectedMethod === 'CASH') {
        await userAPI.submitCashPaymentRequest({
          name:          form.name.trim(),
          phoneNumber:   form.phoneNumber.trim(),
          paymentAmount: parseFloat(form.paymentAmount),
          paidToAdminId: parseInt(form.paidToAdminId, 10),
        })
        toast.success('Cash payment request submitted! Admin will verify shortly.')
      } else if (selectedMethod === 'BANK_TRANSFER') {
        await userAPI.submitBankTransferRequest({
          name:          form.name.trim(),
          phoneNumber:   form.phoneNumber.trim(),
          paymentAmount: parseFloat(form.paymentAmount),
          referenceId:   form.referenceId.trim(),
          bankName:      form.bankName.trim() || undefined,
          screenshot,
        })
        toast.success('Bank transfer details submitted! Admin will verify shortly.')
      }

      setPaymentModal(false)
      setSelectedMethod(null)
      setScreenshot(null)
      setScreenshotName('')
      setErrors({})
      const res = await userAPI.getCurrentMaintenance()
      setMaintenance(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  const set  = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const Err  = ({ f }) => errors[f] ? <p className="text-xs text-red-400 mt-1">{errors[f]}</p> : null

  const openPaymentModal = () => {
    setSelectedMethod(null)
    setErrors({})
    setScreenshot(null)
    setScreenshotName('')
    setPaymentModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title text-xl">My Monthly Maintenance Bill</h1>
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

        {m ? (
          <div className="space-y-3">
            {[
              { label: 'Maintenance Bill Amount', value: formatCurrency(m.amount), icon: IndianRupee },
              { label: 'Property Type',      value: m.flatType,               icon: null },
              { label: 'Payment Due Date',           value: formatDate(m.dueDate),    icon: CalendarDays },
              ...(m.lateFeeApplied ? [{ label: 'Late Fee', value: formatCurrency(m.lateFee), accent: true }] : []),
            ].map(({ label, value, accent }) => (
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

        {/* Action area */}
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
              <p className="text-sm font-semibold text-yellow-400">Awaiting Verification</p>
              <p className="text-xs text-[#1f7a8c]">Your payment request has been submitted and is pending admin verification.</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <button onClick={openPaymentModal}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <CreditCard size={16} />
              Pay Maintenance
            </button>
            <div className="flex gap-2">
              <button onClick={() => setBillModal(true)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Eye size={14} /> View Bill Details
              </button>
            </div>
          </div>
        ) }
      </div>

      {/* Instructions card */}
      {isPending && m && (
        <div className="card border border-[#bfdbf7]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1e5f2] flex items-center justify-center flex-shrink-0">
              <CreditCard size={18} className="text-[#022b3a]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#022b3a]">How to pay your maintenance</p>
              <ol className="mt-2 space-y-1 text-xs text-[#1f7a8c] list-decimal list-inside">
                <li>Tap <strong>"Pay Maintenance"</strong> above</li>
                <li>Choose your payment method: GPay, Cash, or Bank Transfer</li>
                <li>Fill in the payment details and submit</li>
                <li>Admin will verify and confirm your payment</li>
              </ol>
            </div>
          </div>
        </div>
      )}

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
                { label: 'Billing Month / Period',         value: m.month },
                { label: 'Property Type',         value: m.flatType },
                { label: 'Maintenance Bill Amount',    value: formatCurrency(m.amount), mono: true },
                { label: 'Payment Due Date',              value: formatDate(m.dueDate) },
                ...(m.lateFeeApplied ? [{ label: 'Late Fee', value: `+ ${formatCurrency(m.lateFee)}`, red: true, mono: true }] : []),
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
                <span className="text-lg font-bold text-[#022b3a] font-mono">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Maintenance Modal */}
      <Modal isOpen={paymentModal} onClose={() => { setPaymentModal(false); setSelectedMethod(null) }}
        title="Pay Maintenance">
        <div className="space-y-4">

          {/* Step 1: Choose payment method */}
          {!selectedMethod && (
            <>
              <p className="text-xs text-[#1f7a8c]">Select how you want to pay your maintenance of
                <strong className="text-[#022b3a] ml-1 font-mono">{formatCurrency(total)}</strong>
              </p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon
                  return (
                    <button key={pm.id} onClick={() => setSelectedMethod(pm.id)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-[#bfdbf7] hover:border-[#1f7a8c] hover:bg-[#f0f8fb] transition-all text-left">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: pm.color + '22' }}>
                        <Icon size={18} style={{ color: pm.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#022b3a]">{pm.label}</p>
                        <p className="text-xs text-[#1f7a8c]">{pm.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 2: GPAY form */}
          {selectedMethod === 'GPAY' && (
            <GpayForm
              form={form} set={set} Err={Err} errors={errors}
              total={total} screenshot={screenshot} screenshotName={screenshotName}
              fileRef={fileRef} handleFileChange={handleFileChange}
              submitting={submitting}
              onBack={() => { setSelectedMethod(null); setErrors({}) }}
              onSubmit={handleSubmit}
            />
          )}

          {/* Step 2: CASH form */}
          {selectedMethod === 'CASH' && (
            <CashForm
              form={form} set={set} Err={Err} errors={errors}
              total={total}
              activeAdmins={activeAdmins} adminsLoading={adminsLoading}
              submitting={submitting}
              onBack={() => { setSelectedMethod(null); setErrors({}) }}
              onSubmit={handleSubmit}
            />
          )}

          {/* Step 2: BANK_TRANSFER form */}
          {selectedMethod === 'BANK_TRANSFER' && (
            <BankTransferForm
              form={form} set={set} Err={Err} errors={errors}
              total={total} screenshot={screenshot} screenshotName={screenshotName}
              fileRef={fileRef} handleFileChange={handleFileChange}
              submitting={submitting}
              onBack={() => { setSelectedMethod(null); setErrors({}) }}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </Modal>

      {/* Hidden file input shared across forms */}
      <input ref={fileRef} type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden" />
    </div>
  )
}

// ─── GPAY form ────────────────────────────────────────────────────────────────
function GpayForm({ form, set, Err, errors, total, screenshot, screenshotName,
                    fileRef, handleFileChange, submitting, onBack, onSubmit }) {
  const GPAY_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user&hl=en_IN'
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack} className="text-xs text-[#1f7a8c] hover:text-[#022b3a] transition-colors">← Back</button>
        <span className="text-sm font-semibold text-[#022b3a]">Google Pay Details</span>
      </div>
      <div className="flex items-start gap-2 p-3 bg-[#e1e5f2]/50 border border-[#bfdbf7] rounded-xl text-xs text-[#1f7a8c]">
        <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-yellow-500" />
        Complete the GPay payment first, then fill in the details below.
        <button onClick={() => window.open(GPAY_PLAY_STORE, '_blank', 'noopener,noreferrer')}
          className="ml-auto flex items-center gap-1 text-[#022b3a] font-medium whitespace-nowrap">
          Open GPay <ExternalLink size={10} />
        </button>
      </div>
      <SharedNamePhone form={form} set={set} Err={Err} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Payment Amount (₹) *</label>
          <input type="number" value={form.paymentAmount}
            onChange={e => set('paymentAmount', e.target.value)}
            placeholder={total > 0 ? String(total) : 'e.g. 3500'}
            className="input-field font-mono" min="1" />
          <Err f="paymentAmount" />
        </div>
        <div>
          <label className="label">Transaction ID *</label>
          <input value={form.transactionId}
            onChange={e => set('transactionId', e.target.value)}
            placeholder="UPI/GPay transaction ID"
            className="input-field font-mono" />
          <Err f="transactionId" />
        </div>
      </div>
      <ScreenshotUpload screenshot={screenshot} screenshotName={screenshotName} fileRef={fileRef} />
      <FormActions submitting={submitting} onSubmit={onSubmit} label="Submit for Verification" />
    </div>
  )
}

// ─── CASH form ────────────────────────────────────────────────────────────────
function CashForm({ form, set, Err, errors, total, activeAdmins, adminsLoading, submitting, onBack, onSubmit }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack} className="text-xs text-[#1f7a8c] hover:text-[#022b3a] transition-colors">← Back</button>
        <span className="text-sm font-semibold text-[#022b3a]">Cash Payment Details</span>
      </div>
      <div className="flex items-start gap-2 p-3 bg-green-950/20 border border-green-900/30 rounded-xl text-xs text-green-300">
        <Banknote size={12} className="mt-0.5 flex-shrink-0" />
        Pay the cash to one of the listed admins, then select them below and submit.
      </div>
      <SharedNamePhone form={form} set={set} Err={Err} />
      <div>
        <label className="label">Payment Amount (₹) *</label>
        <input type="number" value={form.paymentAmount}
          onChange={e => set('paymentAmount', e.target.value)}
          placeholder={total > 0 ? String(total) : 'e.g. 3500'}
          className="input-field font-mono" min="1" />
        <Err f="paymentAmount" />
      </div>
      <div>
        <label className="label">Paid To (Admin) *</label>
        {adminsLoading ? (
          <div className="input-field text-[#1f7a8c] text-xs">Loading admins…</div>
        ) : activeAdmins.length === 0 ? (
          <div className="input-field text-[#1f7a8c] text-xs">No active admins found. Contact your super admin.</div>
        ) : (
          <select value={form.paidToAdminId}
            onChange={e => set('paidToAdminId', e.target.value)}
            className="input-field">
            <option value="">— Select admin you paid cash to —</option>
            {activeAdmins.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}{a.position ? ` (${a.position})` : ''}
              </option>
            ))}
          </select>
        )}
        <Err f="paidToAdminId" />
      </div>
      <FormActions submitting={submitting} onSubmit={onSubmit} label="Submit Cash Payment" />
    </div>
  )
}

// ─── BANK_TRANSFER form ───────────────────────────────────────────────────────
function BankTransferForm({ form, set, Err, errors, total, screenshot, screenshotName,
                            fileRef, handleFileChange, submitting, onBack, onSubmit }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack} className="text-xs text-[#1f7a8c] hover:text-[#022b3a] transition-colors">← Back</button>
        <span className="text-sm font-semibold text-[#022b3a]">Bank Transfer Details</span>
      </div>
      <div className="flex items-start gap-2 p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl text-xs text-purple-300">
        <Building2 size={12} className="mt-0.5 flex-shrink-0" />
        Complete the bank transfer, then fill in the reference ID and optionally upload a screenshot.
      </div>
      <SharedNamePhone form={form} set={set} Err={Err} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Payment Amount (₹) *</label>
          <input type="number" value={form.paymentAmount}
            onChange={e => set('paymentAmount', e.target.value)}
            placeholder={total > 0 ? String(total) : 'e.g. 3500'}
            className="input-field font-mono" min="1" />
          <Err f="paymentAmount" />
        </div>
        <div>
          <label className="label">Reference / Transaction ID *</label>
          <input value={form.referenceId}
            onChange={e => set('referenceId', e.target.value)}
            placeholder="Bank reference number"
            className="input-field font-mono" />
          <Err f="referenceId" />
        </div>
      </div>
      <div>
        <label className="label">Bank Name (Optional)</label>
        <input value={form.bankName}
          onChange={e => set('bankName', e.target.value)}
          placeholder="e.g. SBI, HDFC, ICICI"
          className="input-field" />
      </div>
      <ScreenshotUpload screenshot={screenshot} screenshotName={screenshotName} fileRef={fileRef} label="Bank Transfer Screenshot (Optional)" />
      <FormActions submitting={submitting} onSubmit={onSubmit} label="Submit for Verification" />
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function SharedNamePhone({ form, set, Err }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Your Name *</label>
        <input value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Full name" className="input-field" />
        <Err f="name" />
      </div>
      <div>
        <label className="label">Phone Number *</label>
        <input value={form.phoneNumber}
          onChange={e => set('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile" className="input-field font-mono" maxLength={10} />
        <Err f="phoneNumber" />
      </div>
    </div>
  )
}

function ScreenshotUpload({ screenshot, screenshotName, fileRef, label = 'Payment Screenshot' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#bfdbf7] rounded-xl p-5 text-center cursor-pointer hover:border-[#1f7a8c] hover:bg-[#f0f8fb] transition-all">
        {screenshotName ? (
          <div className="flex items-center justify-center gap-2 text-sm text-[#022b3a]">
            <FileImage size={16} className="text-green-500" />
            <span className="font-medium">{screenshotName}</span>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-[#1f7a8c] mb-2" />
            <p className="text-sm text-[#1f7a8c]">Tap to upload screenshot</p>
            <p className="text-xs text-[#022b3a]/40 mt-1">JPG, PNG, WEBP, PDF · max 10 MB</p>
          </>
        )}
      </div>
    </div>
  )
}

function FormActions({ submitting, onSubmit, label }) {
  return (
    <div className="flex gap-3 pt-1">
      <button onClick={onSubmit} disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {submitting
          ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : <Send size={14} />}
        {label}
      </button>
    </div>
  )
}
