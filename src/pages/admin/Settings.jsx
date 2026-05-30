import { useState, useEffect } from 'react'
import { Save, Settings as SettingsIcon, Building2, DollarSign, Lock } from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'general',   label: 'General',        icon: SettingsIcon },
  { key: 'fees',      label: 'Fees & Penalty',  icon: DollarSign },
  { key: 'apartment', label: 'Apartment Info',  icon: Building2 },
  { key: 'password',  label: 'Change Password', icon: Lock },
]

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  const [general, setGeneral] = useState({
    maintenanceAmount: '', dueDate: '10', recurringCycle: 'Monthly',
    currencyFormat: 'INR', receiptFooter: 'Thank you for your timely payment.',
  })
  const [fees, setFees] = useState({
    penaltyPercentage: '5', lateFeeAmount: '100', gracePeriod: '5',
  })
  const [apartment, setApartment] = useState({
    apartmentName: 'R R Dhurya Owners Welfare Association',
    address: '', contactPhone: '', contactEmail: '', totalFlats: '60',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    // Check if ?tab=password is in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'password') setActiveTab('password')

    const load = async () => {
      try {
        const res = await adminAPI.getSettings()
        const s   = res.data?.data || res.data
        if (s?.general)   setGeneral(s.general)
        if (s?.fees)      setFees(s.fees)
        if (s?.apartment) setApartment(s.apartment)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const saveGeneral = async () => {
    setSaving(true)
    try {
      await adminAPI.updateSettings({ general, fees, apartment })
      toast.success('Settings saved successfully')
    } catch { toast.error('Could not save settings') }
    finally { setSaving(false) }
  }

  // FIX #2: Use adminAPI.changePassword which calls /auth/admin/change-password
  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Fill all password fields'); return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match'); return
    }
    if (passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters'); return
    }
    setSaving(true)
    try {
      await adminAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally { setSaving(false) }
  }

  const FieldGroup = ({ label, children }) => (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
  const Input = ({ value, onChange, placeholder, type = 'text' }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="input-field" />
  )

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="section-title text-xl">Settings</h1>
        <p className="section-subtitle">Configure global parameters and system preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white border border-[#bfdbf7] rounded-xl p-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
              activeTab === key ? 'bg-white text-[#022b3a]' : 'text-[#022b3a]/60 hover:text-[#022b3a] hover:bg-[#e1e5f2]'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Global Parameters</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Monthly Maintenance Amount (₹)">
              <Input value={general.maintenanceAmount} placeholder="e.g. 3000"
                onChange={e => setGeneral({ ...general, maintenanceAmount: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Payment Due Day (day of month)">
              <Input value={general.dueDate} placeholder="e.g. 10"
                onChange={e => setGeneral({ ...general, dueDate: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Recurring Cycle">
              <select value={general.recurringCycle} className="input-field"
                onChange={e => setGeneral({ ...general, recurringCycle: e.target.value })}>
                {['Monthly','Quarterly','Yearly'].map(c => <option key={c}>{c}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Currency Format">
              <select value={general.currencyFormat} className="input-field"
                onChange={e => setGeneral({ ...general, currencyFormat: e.target.value })}>
                <option value="INR">₹ Indian Rupees (INR)</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Receipt Footer Text">
              <textarea value={general.receiptFooter} rows={2}
                onChange={e => setGeneral({ ...general, receiptFooter: e.target.value })}
                className="input-field resize-none col-span-2" />
            </FieldGroup>
          </div>
          <SaveButton onClick={saveGeneral} saving={saving} />
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Fees & Penalty Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Penalty Percentage (%)">
              <Input value={fees.penaltyPercentage} placeholder="e.g. 5"
                onChange={e => setFees({ ...fees, penaltyPercentage: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Late Fee Amount (₹)">
              <Input value={fees.lateFeeAmount} placeholder="e.g. 100"
                onChange={e => setFees({ ...fees, lateFeeAmount: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Grace Period (days after due date)">
              <Input value={fees.gracePeriod} placeholder="e.g. 5"
                onChange={e => setFees({ ...fees, gracePeriod: e.target.value })} />
            </FieldGroup>
          </div>
          <SaveButton onClick={saveGeneral} saving={saving} />
        </div>
      )}

      {/* Apartment Tab */}
      {activeTab === 'apartment' && (
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Apartment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldGroup label="Association Name">
                <Input value={apartment.apartmentName} placeholder="Apartment association name"
                  onChange={e => setApartment({ ...apartment, apartmentName: e.target.value })} />
              </FieldGroup>
            </div>
            <FieldGroup label="Contact Phone">
              <Input value={apartment.contactPhone} placeholder="+91 98765 43210"
                onChange={e => setApartment({ ...apartment, contactPhone: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Contact Email">
              <Input value={apartment.contactEmail} placeholder="admin@apartment.com" type="email"
                onChange={e => setApartment({ ...apartment, contactEmail: e.target.value })} />
            </FieldGroup>
            <div className="col-span-2">
              <FieldGroup label="Full Address">
                <textarea value={apartment.address} rows={2}
                  onChange={e => setApartment({ ...apartment, address: e.target.value })}
                  placeholder="Full apartment address" className="input-field resize-none" />
              </FieldGroup>
            </div>
          </div>
          <SaveButton onClick={saveGeneral} saving={saving} />
        </div>
      )}

      {/* FIX #2: Change Password Tab */}
      {activeTab === 'password' && (
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Change Admin Password</h2>
          <div className="space-y-4">
            {[
              { label: 'Current Password', key: 'currentPassword', showKey: 'current' },
              { label: 'New Password',     key: 'newPassword',     showKey: 'new' },
              { label: 'Confirm Password', key: 'confirmPassword', showKey: 'confirm' },
            ].map(({ label, key, showKey }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[showKey] ? 'text' : 'password'}
                    value={passwords[key]}
                    onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                    placeholder={label}
                    className="input-field pr-10"
                  />
                  <button type="button"
                    onClick={() => setShowPw({ ...showPw, [showKey]: !showPw[showKey] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f7a8c] hover:text-[#022b3a] text-xs">
                    {showPw[showKey] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white/50 rounded-lg border border-[#bfdbf7] text-xs text-[#1f7a8c]">
            Password must be at least 8 characters. Changes are saved immediately and hashed securely.
          </div>
          <button onClick={changePassword} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />}
            <Lock size={13} /> Update Password
          </button>
        </div>
      )}
    </div>
  )
}

function SaveButton({ onClick, saving }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary flex items-center gap-2 mt-2">
      {saving
        ? <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />
        : <Save size={13} />
      }
      Save Changes
    </button>
  )
}