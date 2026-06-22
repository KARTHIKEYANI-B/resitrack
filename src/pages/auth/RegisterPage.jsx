import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Building2, User, Mail, Phone,
  Home, Ruler, Users, Car, MapPin, Lock,
  CheckCircle, ArrowLeft, AlertCircle, ChevronDown,
  Upload, FileText, X
} from 'lucide-react'
import { authAPI } from '../../api/authAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  bg: '#FFF0E4', accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5',
}

const FLAT_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Penthouse', 'Studio', 'Duplex', 'Other']

function StrengthBar({ password }) {
  const calc = (p) => {
    let s = 0
    if (p.length >= 8)           s++
    if (/[A-Z]/.test(p))         s++
    if (/[0-9]/.test(p))         s++
    if (/[^A-Za-z0-9]/.test(p))  s++
    return s
  }
  const score  = calc(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-teal-400', 'bg-green-500']
  const text   = ['', 'text-red-500', 'text-yellow-600', 'text-teal-600', 'text-green-600']
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-[#E8C9AB]'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${text[score]}`}>{labels[score]}</p>
    </div>
  )
}

function StepDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i < current ? 'w-6 h-2' : i === current ? 'w-8 h-2' : 'w-2 h-2'
        }`} style={{
          background: i <= current ? P.primary : P.border,
        }} />
      ))}
    </div>
  )
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: P.secondary }} />
        )}
        {children}
      </div>
      {error && (
        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={10} />{error}
        </p>
      )}
    </div>
  )
}

const INIT = {
  fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  age: '',
  flatNumber: '', flatType: '', propertyType: '', squareFeet: '', familyMembers: '',
  vehicleDetails: '', address: '',
}

export default function RegisterPage() {
  const [form,    setForm]    = useState(INIT)
  const [showPw,  setShowPw]  = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState(0)
  const [errors,  setErrors]  = useState({})
  const [insuranceDoc, setInsuranceDoc] = useState(null)
  const [insuranceDocError, setInsuranceDocError] = useState('')
  const navigate = useNavigate()

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
    // If Vehicle Number is cleared, also clear any selected insurance document
    if (k === 'vehicleDetails' && !v.trim()) {
      setInsuranceDoc(null)
      setInsuranceDocError('')
    }
  }

  const handleInsuranceDocChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) { setInsuranceDoc(null); return }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setInsuranceDocError('Invalid file type. Use JPG, PNG, or PDF.')
      setInsuranceDoc(null)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setInsuranceDocError('File too large. Maximum 10 MB.')
      setInsuranceDoc(null)
      return
    }
    setInsuranceDocError('')
    setInsuranceDoc(file)
  }

  const validateStep0 = () => {
    const e = {}
    if (!form.fullName.trim())          e.fullName = 'Full name is required'
    if (!form.email.trim())             e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone.trim())             e.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = '10-digit number required'
    if (!form.password)                 e.password = 'Password is required'
    else if (form.password.length < 8)  e.password = 'At least 8 characters required'
    if (!form.confirmPassword)          e.confirmPassword = 'Confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.propertyType)          e.propertyType = 'Select Flat or Villa'
    if (!form.flatNumber.trim())     e.flatNumber   = 'Flat/Villa number is required'
    if (!form.flatType)              e.flatType     = 'Unit type is required'
    if (!form.address.trim())        e.address      = 'Address is required'
    return e
  }

  const goNext = () => {
    const e = step === 0 ? validateStep0() : {}
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({}); setStep(s => s + 1)
  }

  const goBack = () => { setErrors({}); setStep(s => s - 1) }

  const handleSubmit = async () => {
    const e = validateStep1()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setLoading(true)
    try {
      const payload = {
        fullName:       form.fullName.trim(),
        email:          form.email.trim().toLowerCase(),
        phone:          form.phone.trim(),
        password:       form.password,
        age:            form.age ? Number(form.age) : null,
        flatNumber:     form.flatNumber.trim().toUpperCase(),
        flatType:       form.flatType,
        propertyType:   form.propertyType,          // "FLAT" | "VILLA"
        sqFt:           form.squareFeet ? Number(form.squareFeet) : null,
        familyMembers:  form.familyMembers ? Number(form.familyMembers) : null,
        vehicleDetails: form.vehicleDetails.trim() || null,
        address:        form.address.trim(),
      }

      if (insuranceDoc) {
        await authAPI.registerWithVehicleDocument(payload, insuranceDoc)
      } else {
        await authAPI.register(payload)
      }
      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${P.bg} 0%, #fff8f0 100%)` }}>
      <div className="w-full max-w-md text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: P.dark }}>Registration Submitted!</h2>
          <p className="text-sm mt-2 leading-relaxed max-w-xs mx-auto" style={{ color: P.muted }}>
            Your request has been sent to the admin for review. You'll be able to log in once approved.
          </p>
        </div>
        <div className="rounded-2xl p-4 text-left space-y-2"
          style={{ background: P.surface, border: `1px solid ${P.border}` }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: P.primary }}>What happens next?</p>
          {['Admin reviews your registration details', 'You receive approval notification', 'Log in with your credentials'].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: P.primary }}>{i + 1}</span>
              <p className="text-xs" style={{ color: P.body }}>{s}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/login')} className="btn-primary w-full py-3 font-semibold">
          Go to Login
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${P.bg} 0%, #fff8f0 100%)` }}>
      <div className="w-full max-w-md animate-scale-in">

        {/* Brand */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2"
            style={{ background: P.primary, boxShadow: '0 6px 20px rgba(0,121,121,0.28)' }}>
            <Building2 size={22} color="#fff" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: P.dark }}>ResiTrack</h1>
          <p className="text-xs" style={{ color: P.secondary }}>Resident Registration</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: P.surface, border: `1px solid ${P.border}`, boxShadow: '0 4px 20px rgba(0,121,121,0.10)' }}>
          <div className="px-5 sm:px-7 pt-6 pb-2">
            <StepDots current={step} total={2} />
            <p className="text-center text-xs mb-5" style={{ color: P.secondary }}>
              Step {step + 1} of 2 — {step === 0 ? 'Personal Details' : 'Property Information'}
            </p>

            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <div className="space-y-4 pb-5">
                <Field label="Full Name *" icon={User} error={errors.fullName}>
                  <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
                    placeholder="Your full name"
                    className={`input-field pl-9 ${errors.fullName ? 'border-red-300' : ''}`} />
                </Field>

                <Field label="Email Address *" icon={Mail} error={errors.email}>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com" autoComplete="email"
                    className={`input-field pl-9 ${errors.email ? 'border-red-300' : ''}`} />
                </Field>

                <Field label="Phone Number *" icon={Phone} error={errors.phone}>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    className={`input-field pl-9 ${errors.phone ? 'border-red-300' : ''}`} />
                </Field>

                <Field label="Age" icon={Users}>
                  <input type="number" value={form.age} min="1" max="120"
                    onChange={e => set('age', e.target.value)}
                    placeholder="e.g. 35" className="input-field pl-9" />
                </Field>

                <Field label="Password *" icon={Lock} error={errors.password}>
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)} placeholder="At least 8 characters"
                    className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-300' : ''}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-3" style={{ color: P.secondary }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <StrengthBar password={form.password} />
                </Field>

                <Field label="Confirm Password *" icon={Lock} error={errors.confirmPassword}>
                  <input type={showCpw ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password"
                    className={`input-field pl-9 pr-10 ${errors.confirmPassword ? 'border-red-300' : ''}`} />
                  <button type="button" onClick={() => setShowCpw(!showCpw)}
                    className="absolute right-3 top-3" style={{ color: P.secondary }}>
                    {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </Field>
              </div>
            )}

            {/* ── Step 1: Property info ── */}
            {step === 1 && (
              <div className="space-y-4 pb-5">

                {/* ── NEW: mandatory Flat vs Villa selector ── */}
                <Field label="Property Category *" error={errors.propertyType}>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {['FLAT', 'VILLA'].map(t => (
                      <button key={t} type="button"
                        onClick={() => set('propertyType', t)}
                        className="py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: `1.5px solid ${form.propertyType === t ? P.primary : P.border}`,
                          background: form.propertyType === t ? P.primary : '#fff',
                          color: form.propertyType === t ? '#fff' : P.dark,
                        }}>
                        {t === 'FLAT' ? 'Flat' : 'Villa'}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Flat/Villa Number *" icon={Home} error={errors.flatNumber}>
                    <input value={form.flatNumber}
                      onChange={e => set('flatNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. A101"
                      className={`input-field pl-9 uppercase ${errors.flatNumber ? 'border-red-300' : ''}`} />
                  </Field>

                  <Field label="Unit Type *" error={errors.flatType}>
                    <div className="relative">
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: P.secondary }} />
                      <select value={form.flatType} onChange={e => set('flatType', e.target.value)}
                        className={`input-field pr-8 appearance-none ${errors.flatType ? 'border-red-300' : ''}`}
                        style={{ background: '#fff' }}>
                        <option value="">Select type</option>
                        {FLAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Square Feet" icon={Ruler}>
                    <input type="number" value={form.squareFeet}
                      onChange={e => set('squareFeet', e.target.value)}
                      placeholder="e.g. 1200" className="input-field pl-9" />
                  </Field>
                  <Field label="Family Members" icon={Users}>
                    <input type="number" value={form.familyMembers}
                      onChange={e => set('familyMembers', e.target.value)}
                      placeholder="e.g. 4" className="input-field pl-9" />
                  </Field>
                </div>

                <Field label="Vehicle Number" icon={Car}>
                  <input value={form.vehicleDetails}
                    onChange={e => set('vehicleDetails', e.target.value.toUpperCase())}
                    placeholder="MH01 AB 1234 (optional)" className="input-field pl-9 uppercase" />
                </Field>

                {/* Insurance Document Upload — only shown once a Vehicle Number is entered */}
                {form.vehicleDetails.trim() && (
                  <div>
                    <label className="label">Insurance Document (optional)</label>
                    {!insuranceDoc ? (
                      <label
                        htmlFor="insuranceDocInput"
                        className="flex items-center gap-2 rounded-xl px-3 py-3 cursor-pointer transition-colors"
                        style={{ border: `1.5px dashed ${P.border}`, color: P.muted, background: '#fff' }}>
                        <Upload size={15} style={{ color: P.secondary }} />
                        <span className="text-sm">Upload image or PDF of your insurance document</span>
                        <input
                          id="insuranceDocInput"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={handleInsuranceDocChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                        style={{ border: `1.5px solid ${P.primary}`, background: 'rgba(0,121,121,0.06)' }}>
                        <FileText size={15} style={{ color: P.primary }} />
                        <span className="text-sm truncate flex-1" style={{ color: P.dark }}>
                          {insuranceDoc.name}
                        </span>
                        <button type="button" onClick={() => setInsuranceDoc(null)}
                          style={{ color: P.muted }}>
                          <X size={15} />
                        </button>
                      </div>
                    )}
                    {insuranceDocError && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />{insuranceDocError}
                      </p>
                    )}
                    <p className="text-[11px] mt-1" style={{ color: P.muted }}>
                      Accepted formats: JPG, JPEG, PNG, PDF (max 10 MB)
                    </p>
                  </div>
                )}

                <Field label="Address *" icon={MapPin} error={errors.address}>
                  <textarea value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Full residential address" rows={2}
                    className={`input-field pl-9 resize-none ${errors.address ? 'border-red-300' : ''}`}
                    style={{ paddingTop: '0.625rem' }} />
                </Field>

                <div className="rounded-xl p-3 flex gap-2"
                  style={{ background: 'rgba(0,121,121,0.06)', border: `1px solid rgba(0,121,121,0.15)` }}>
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: P.primary }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: P.primary }}>
                    Your registration will be reviewed by the admin before you can log in.
                    Ensure all details match the apartment records.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-5 sm:px-7 pb-6 pt-1 space-y-3"
            style={{ borderTop: `1px solid ${P.border}`, background: P.accent + '60' }}>
            {step === 0 && (
              <button onClick={goNext} className="btn-primary w-full py-3 font-semibold">
                Continue →
              </button>
            )}
            {step === 1 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={goBack}
                  className="btn-secondary flex items-center justify-center gap-2 flex-1 order-2 sm:order-1">
                  <ArrowLeft size={14} />Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 order-1 sm:order-2 py-3 font-semibold">
                  {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Submitting…' : 'Submit Registration'}
                </button>
              </div>
            )}
            <p className="text-center text-xs" style={{ color: P.muted }}>
              Already registered?{' '}
              <Link to="/login" className="font-semibold underline underline-offset-2" style={{ color: P.primary }}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: P.muted }}>
          © {new Date().getFullYear()} ResiTrack · Secure Resident Management
        </p>
      </div>
    </div>
  )
}