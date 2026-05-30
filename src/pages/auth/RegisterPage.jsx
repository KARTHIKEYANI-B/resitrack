import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Building2, CheckCircle, XCircle, ChevronLeft, Home, Landmark } from 'lucide-react'
import { authAPI } from '../../api/authAPI'
import toast from 'react-hot-toast'

/* ─── password strength ──────────────────────────────────────── */
const RULES = [
  { label: 'At least 8 characters',     test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)',           test: (p) => /[0-9]/.test(p) },
  { label: 'One special character',      test: (p) => /[^A-Za-z0-9]/.test(p) },
]
function getStrength(pw) {
  const met = RULES.filter(r => r.test(pw)).length
  if (!pw)  return { met, level: 0, label: '',       bar: 'w-0' }
  if (met <= 2) return { met, level: 1, label: 'Weak',   bar: 'w-1/3',  barColor: 'bg-red-500' }
  if (met <= 3) return { met, level: 2, label: 'Medium', bar: 'w-2/3',  barColor: 'bg-yellow-500' }
  if (met === 4) return { met, level: 3, label: 'Good',   bar: 'w-4/5',  barColor: 'bg-blue-500' }
  return              { met, level: 4, label: 'Strong',  bar: 'w-full', barColor: 'bg-green-500' }
}

const INIT = {
  fullName: '', email: '', phone: '',
  flatType: 'Flat', sqFt: '', flatNumber: '',
  familyMembers: '', vehicleDetails: '', address: '',
  password: '', confirmPassword: '',
}

export default function RegisterPage() {
  const [form,        setForm]        = useState(INIT)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [errors,      setErrors]      = useState({})
  const navigate = useNavigate()
  const strength = getStrength(form.password)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  /* ── Client-side validation ────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.fullName.trim())   e.fullName   = 'Full name is required'
    if (!form.email.trim())      e.email      = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone.trim())      e.phone      = 'Phone number is required'
    else if (!/^[+]?[0-9]{10,13}$/.test(form.phone.replace(/\s/g,'')))
                                 e.phone      = 'Enter a valid phone number'
    if (!form.flatType)          e.flatType   = 'Property type is required'
    if (!form.sqFt)              e.sqFt       = 'Square feet is required'
    else if (isNaN(+form.sqFt) || +form.sqFt < 100) e.sqFt = 'Enter valid square feet (min 100)'
    if (!form.flatNumber.trim()) e.flatNumber = 'Flat/Villa number is required'
    if (!form.password)          e.password   = 'Password is required'
    else if (strength.level < 2) e.password   = 'Password is too weak'
    if (!form.confirmPassword)       e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix the highlighted errors'); return }
    setLoading(true)
    try {
      await authAPI.register({
        fullName:      form.fullName.trim(),
        email:         form.email.trim().toLowerCase(),
        phone:         form.phone.trim(),
        flatType:      form.flatType,
        sqFt:          parseFloat(form.sqFt),
        flatNumber:    form.flatNumber.trim(),
        familyMembers: form.familyMembers ? parseInt(form.familyMembers) : null,
        vehicleDetails:form.vehicleDetails.trim() || null,
        address:       form.address.trim() || null,
        password:      form.password,
      })
      toast.success('Registration submitted! Awaiting admin approval.')
      // Redirect to pending approval page with email in query params
      navigate(`/pending-approval?email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.'
      // Handle specific duplicate errors
      if (msg.toLowerCase().includes('email'))      setErrors(er => ({ ...er, email: msg }))
      else if (msg.toLowerCase().includes('phone')) setErrors(er => ({ ...er, phone: msg }))
      else if (msg.toLowerCase().includes('flat'))  setErrors(er => ({ ...er, flatNumber: msg }))
      else toast.error(msg)
    } finally { setLoading(false) }
  }

  const F = ({ label, name, type = 'text', placeholder, required = true, hint }) => (
    <div>
      <label className="label">
        {label}{required && <span className="text-[#1f7a8c] ml-0.5">*</span>}
      </label>
      <input
        type={type} value={form[name]} placeholder={placeholder}
        onChange={e => set(name, e.target.value)}
        className={`input-field ${errors[name] ? 'border-red-700' : ''}`}
      />
      {errors[name] && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><XCircle size={10}/>{errors[name]}</p>}
      {hint && !errors[name] && <p className="text-[10px] text-[#1f7a8c] mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#bfdbf720_1px,transparent_1px),linear-gradient(to_bottom,#bfdbf720_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 animate-slide-up space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="p-2 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#e1e5f2] transition-all">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                <Building2 size={14} className="text-[#022b3a]" />
              </div>
              <h1 className="text-lg font-bold text-[#022b3a]">Resident Registration</h1>
            </div>
            <p className="text-xs text-[#1f7a8c] mt-0.5">
              R R Dhurya Owners Welfare Association · Admin approval required
            </p>
          </div>
        </div>

        <div className="card border-[#bfdbf7]">
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Section 1: Personal Info ──────────────────────── */}
            <Section title="Personal Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <F label="Full Name" name="fullName" placeholder="As on property documents" />
                </div>
                <F label="Email Address" name="email" type="email" placeholder="your@email.com"
                   hint="You'll use this to log in after approval" />
                <div>
                  <label className="label">Phone Number <span className="text-[#1f7a8c]">*</span></label>
                  <div className="flex gap-2">
                    <span className="input-field w-14 text-[#1f7a8c] text-center flex-shrink-0 cursor-default">+91</span>
                    <input type="tel" value={form.phone} placeholder="98765 43210"
                      onChange={e => set('phone', e.target.value)}
                      className={`input-field flex-1 ${errors.phone ? 'border-red-700' : ''}`} />
                  </div>
                  {errors.phone && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><XCircle size={10}/>{errors.phone}</p>}
                </div>
              </div>
            </Section>

            {/* ── Section 2: Property Details ───────────────────── */}
            <Section title="Property Details">
              {/* Property Type toggle */}
              <div>
                <label className="label">Property Type <span className="text-[#1f7a8c]">*</span></label>
                <div className="flex gap-3">
                  {[
                    { value: 'Flat',  icon: Home,     desc: 'Apartment / Flat' },
                    { value: 'Villa', icon: Landmark,  desc: 'Independent Villa' },
                  ].map(({ value, icon: Icon, desc }) => (
                    <button
                      key={value} type="button"
                      onClick={() => set('flatType', value)}
                      className={`flex items-center gap-3 flex-1 p-3 rounded-xl border text-left transition-all ${
                        form.flatType === value
                          ? 'border-[#bfdbf7] bg-[#e1e5f2]'
                          : 'border-[#bfdbf7] bg-[#e1e5f2]/30 hover:bg-[#e1e5f2]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        form.flatType === value ? 'bg-white' : 'bg-[#bfdbf7]'
                      }`}>
                        <Icon size={16} className={form.flatType === value ? 'text-[#022b3a]' : 'text-[#022b3a]/60'} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#022b3a]">{value}</p>
                        <p className="text-[10px] text-[#1f7a8c]">{desc}</p>
                      </div>
                      {form.flatType === value && (
                        <CheckCircle size={15} className="text-[#022b3a] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                {errors.flatType && <p className="text-[10px] text-red-400 mt-1">{errors.flatType}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <F label={`${form.flatType} Number`} name="flatNumber"
                   placeholder={form.flatType === 'Villa' ? 'e.g. V-12 or Plot-5' : 'e.g. A-101, Flat 204'}
                   hint="Unique number identifying your property" />
                <div>
                  <label className="label">Square Feet <span className="text-[#1f7a8c]">*</span></label>
                  <div className="relative">
                    <input type="number" value={form.sqFt} placeholder="e.g. 1200"
                      onChange={e => set('sqFt', e.target.value)}
                      className={`input-field pr-14 ${errors.sqFt ? 'border-red-700' : ''}`}
                      min="100" step="1" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1f7a8c]">sq.ft</span>
                  </div>
                  {errors.sqFt && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><XCircle size={10}/>{errors.sqFt}</p>}
                </div>
                <F label="Family Members Count" name="familyMembers" type="number"
                   placeholder="e.g. 4" required={false} />
                <F label="Vehicle Details" name="vehicleDetails"
                   placeholder="e.g. TN01AB1234 (Car), KA05XY9900 (Bike)"
                   required={false} hint="Optional — list all vehicles" />
                <div className="sm:col-span-2">
                  <F label="Full Address" name="address"
                     placeholder="Full apartment address (optional)" required={false} />
                </div>
              </div>
            </Section>

            {/* ── Section 3: Password ───────────────────────────── */}
            <Section title="Set Password">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password <span className="text-[#1f7a8c]">*</span></label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      placeholder="Create a strong password"
                      onChange={e => set('password', e.target.value)}
                      className={`input-field pr-10 ${errors.password ? 'border-red-700' : ''}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f7a8c] hover:text-[#022b3a]">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-[#e1e5f2] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.bar} ${strength.barColor}`} />
                      </div>
                      <p className={`text-[10px] mt-1 ${
                        strength.level === 4 ? 'text-green-400' :
                        strength.level === 3 ? 'text-blue-400' :
                        strength.level === 2 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{strength.label} password</p>
                    </div>
                  )}
                  {errors.password && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><XCircle size={10}/>{errors.password}</p>}
                </div>

                <div>
                  <label className="label">Confirm Password <span className="text-[#1f7a8c]">*</span></label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                      placeholder="Re-enter password"
                      onChange={e => set('confirmPassword', e.target.value)}
                      className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-700' : ''}`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f7a8c] hover:text-[#022b3a]">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {form.confirmPassword && (
                    form.password === form.confirmPassword
                      ? <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><CheckCircle size={10}/>Passwords match</p>
                      : <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><XCircle size={10}/>Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Password rules */}
              <div className="mt-4 p-3 bg-[#e1e5f2]/40 rounded-xl border border-[#bfdbf7]/50 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {RULES.map(({ label, test }) => {
                  const met = form.password ? test(form.password) : false
                  return (
                    <div key={label} className="flex items-center gap-2">
                      {met
                        ? <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
                        : <XCircle    size={11} className="text-[#022b3a] flex-shrink-0" />}
                      <span className={`text-[11px] ${met ? 'text-green-400' : 'text-[#1f7a8c]'}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* ── Info banner ───────────────────────────────────── */}
            <div className="mt-5 p-4 bg-white/60 rounded-xl border border-[#bfdbf7]/50 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#e1e5f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[#022b3a]/60 font-bold">i</span>
              </div>
              <div>
                <p className="text-xs font-medium text-[#022b3a]">Admin Approval Required</p>
                <p className="text-[11px] text-[#1f7a8c] mt-0.5 leading-relaxed">
                  After submitting, your registration will be reviewed by the admin.
                  You'll receive a notification once approved or if more information is needed.
                  Typical approval time is 1–2 business days.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-5 h-11 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />Submitting...</>
                : 'Submit Registration'}
            </button>
          </form>

          <p className="text-center text-xs text-[#1f7a8c] mt-4">
            Already registered?{' '}
            <Link to="/login" className="text-[#022b3a]/60 hover:text-[#022b3a] underline underline-offset-2">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-[#1f7a8c] uppercase tracking-widest mb-4 pb-2 border-b border-[#bfdbf7]">
        {title}
      </h3>
      {children}
    </div>
  )
}