import { useState, useEffect } from 'react'
import { Lock, Bell, CreditCard, User, Save, Eye, EyeOff } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'profile',   label: 'Profile',           icon: User },
  { key: 'password',  label: 'Change Password',    icon: Lock },
  { key: 'notify',    label: 'Notifications',      icon: Bell },
  { key: 'payment',   label: 'Payment Methods',    icon: CreditCard },
]

export default function UserSettings() {
  const { user }          = useAuth()
  const [tab, setTab]     = useState('profile')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const [profile, setProfile] = useState({
    fullName: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', address: user?.address || '',
    vehicleDetails: user?.vehicleDetails || '',
  })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPw, setShowPw]       = useState({ current: false, new: false, confirm: false })
  const [notify, setNotify]       = useState({ email: true, sms: true, dues: true, announcements: true })

  const saveProfile = async () => {
    setSaving(true)
    try {
      await userAPI.updateProfile(profile)
      toast.success('Profile updated successfully')
    } catch { toast.error('Could not update profile') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) { toast.error('Fill all fields'); return }
    if (passwords.new !== passwords.confirm) { toast.error('Passwords do not match'); return }
    if (passwords.new.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await userAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.new })
      toast.success('Password changed successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally { setSaving(false) }
  }

  const saveNotifyPrefs = async () => {
    setSaving(true)
    try {
      await userAPI.updateSettings({ notifications: notify })
      toast.success('Preferences saved')
    } catch { toast.error('Could not save preferences') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title text-xl">Settings</h1>
        <p className="section-subtitle">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#bfdbf7] rounded-xl p-1.5 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === key ? 'bg-white text-[#022b3a]' : 'text-[#022b3a]/60 hover:text-[#022b3a] hover:bg-[#e1e5f2]'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Account Details</h2>
          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#e1e5f2]/50 rounded-xl border border-[#bfdbf7]">
            {[
              ['Flat Number', user?.flatNumber || '—'],
              ['Register Number', user?.registerNumber || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide">{label}</p>
                <p className="text-sm font-mono text-[#022b3a] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name',       key: 'fullName',       placeholder: 'Your full name' },
              { label: 'Email Address',   key: 'email',          placeholder: 'your@email.com', type: 'email' },
              { label: 'Phone Number',    key: 'phone',          placeholder: '+91 98765 43210' },
              { label: 'Vehicle Details', key: 'vehicleDetails', placeholder: 'KA01AB1234' },
            ].map(({ label, key, placeholder, type = 'text' }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type} value={profile[key]}
                  onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                  placeholder={placeholder} className="input-field" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea value={profile.address}
                onChange={e => setProfile({ ...profile, address: e.target.value })}
                placeholder="Your full address" rows={2} className="input-field resize-none" />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" /> : <Save size={13} />}
            Save Changes
          </button>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Change Password</h2>
          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password',     key: 'new' },
            { label: 'Confirm Password', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input type={showPw[key] ? 'text' : 'password'} value={passwords[key]}
                  onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                  placeholder={label} className="input-field pr-10" />
                <button type="button"
                  onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f7a8c] hover:text-[#022b3a] transition-colors">
                  {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={changePassword} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" /> : <Lock size={13} />}
            Update Password
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notify' && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { key: 'email',         label: 'Email Notifications',      desc: 'Receive alerts via email' },
              { key: 'sms',           label: 'SMS Notifications',         desc: 'Receive SMS reminders' },
              { key: 'dues',          label: 'Due Payment Reminders',    desc: 'Get reminded before due date' },
              { key: 'announcements', label: 'Admin Announcements',      desc: 'Apartment-wide notices' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#e1e5f2]/40 rounded-xl border border-[#bfdbf7]">
                <div>
                  <p className="text-sm font-medium text-[#022b3a]">{label}</p>
                  <p className="text-xs text-[#1f7a8c]">{desc}</p>
                </div>
                <button onClick={() => setNotify({ ...notify, [key]: !notify[key] })}
                  className={`w-10 h-6 rounded-full transition-all relative ${notify[key] ? 'bg-white' : 'bg-[#bfdbf7]'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notify[key] ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={saveNotifyPrefs} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" /> : <Save size={13} />}
            Save Preferences
          </button>
        </div>
      )}

      {/* Payment Methods Tab */}
      {tab === 'payment' && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#022b3a] border-b border-[#bfdbf7] pb-3">Saved Payment Methods</h2>
          <div className="space-y-3">
            {[
              { label: 'Saved UPI ID',      value: user?.upiId || 'Not saved',      icon: '📱' },
              { label: 'Saved Bank Account', value: 'Not linked',                   icon: '🏦' },
              { label: 'Saved Card',         value: 'Not saved',                    icon: '💳' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-[#e1e5f2]/40 rounded-xl border border-[#bfdbf7]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-xs text-[#1f7a8c]">{label}</p>
                    <p className="text-sm font-medium text-[#022b3a]">{value}</p>
                  </div>
                </div>
                <button className="btn-secondary text-xs">Manage</button>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#1f7a8c]">Payment method management requires backend integration.</p>
        </div>
      )}
    </div>
  )
}