import { useState, useEffect, useRef } from 'react'
import {
  Lock, Bell, User, Save, Eye, EyeOff, Camera, Trash2,
  Shield, FileText, AlertCircle, Calendar, ToggleLeft, ToggleRight,
  Plus, Car, Upload, Download, X, Edit2, FileImage
} from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { vehicleAPI } from '../../api/vehicleAPI'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../../components/common/LoadingSpinner'
import ProfileAvatar from '../../components/ProfileAvatar'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
}

const TABS = [
  { key: 'profile',   label: 'Profile',          icon: User },
  { key: 'insurance', label: 'Vehicle / Insurance', icon: Shield },
  { key: 'taxes',     label: 'Tax Payment Reminder',   icon: FileText },
  { key: 'password',  label: 'Change Password',   icon: Lock },
  { key: 'notify',    label: 'Notification Preferences',     icon: Bell },
]

// ── Profile Photo Section ─────────────────────────────────────────────────
function PhotoSection({ user, profileData, onPhotoUpdated }) {
  const [uploading, setUploading] = useState(false)
  const [removing,  setRemoving]  = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type.toLowerCase())) {
      toast.error('Invalid file type. Use JPG, PNG, or WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5 MB.')
      return
    }
    setUploading(true)
    try {
      const res = await userAPI.uploadProfilePhoto(file)
      const updated = res.data?.data || res.data
      toast.success('Profile photo updated')
      onPhotoUpdated(updated?.profilePhotoUrl || null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!window.confirm('Remove profile photo?')) return
    setRemoving(true)
    try {
      await userAPI.removeProfilePhoto()
      toast.success('Profile photo removed')
      onPhotoUpdated(null)
    } catch {
      toast.error('Could not remove photo')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-5 p-4 rounded-2xl mb-4"
      style={{ background: P.accent, border: `1px solid ${P.border}` }}>
      <div className="relative flex-shrink-0">
        <ProfileAvatar
          name={profileData.fullName || user?.name || ''}
          photoUrl={profileData.profilePhotoUrl}
          size={72}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
          style={{ background: P.primary }}>
          <Camera size={13} color="#fff" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange} className="hidden" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: P.dark }}>
          {profileData.fullName || user?.name || 'Your Name'}
        </p>
        <p className="text-xs truncate mb-2" style={{ color: P.muted }}>{profileData.email || user?.email}</p>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="text-xs px-3 py-1 rounded-lg font-medium text-white"
            style={{ background: P.primary, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Uploading…' : profileData.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          {profileData.profilePhotoUrl && (
            <button onClick={handleRemove} disabled={removing}
              className="text-xs px-3 py-1 rounded-lg font-medium flex items-center gap-1"
              style={{ border: `1px solid ${P.border}`, color: P.muted }}>
              <Trash2 size={11} />
              {removing ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Toggle Switch ─────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle }) {
  return (
    <button onClick={onToggle}
      className="flex items-center gap-2 text-sm font-semibold transition-colors"
      style={{ color: enabled ? P.primary : P.muted }}>
      {enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      {enabled ? 'Enabled' : 'Disabled'}
    </button>
  )
}

// ── Add / Edit Vehicle Modal ───────────────────────────────────────────────
function VehicleFormModal({ vehicle, onClose, onSaved }) {
  const isEdit = !!vehicle?.id
  const [form, setForm] = useState({
    vehicleNumber:       vehicle?.vehicleNumber       || '',
    vehicleType:         vehicle?.vehicleType         || '',
    insuranceProvider:   vehicle?.insuranceProvider   || '',
    insuranceNumber:     vehicle?.insuranceNumber      || '',
    insuranceExpiryDate: vehicle?.insuranceExpiryDate || '',
  })
  const [file, setFile]       = useState(null)
  const [fileError, setFileError] = useState('')
  const [saving, setSaving]   = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) { setFile(null); return }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowed.includes(f.type)) {
      setFileError('Invalid file type. Use JPG, PNG, or PDF.')
      setFile(null)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError('File too large. Maximum 10 MB.')
      setFile(null)
      return
    }
    setFileError('')
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!form.vehicleNumber.trim()) { toast.error('Vehicle number is required'); return }
    setSaving(true)
    try {
      const payload = {
        vehicleNumber:       form.vehicleNumber.trim().toUpperCase(),
        vehicleType:         form.vehicleType || null,
        insuranceProvider:   form.insuranceProvider.trim() || null,
        insuranceNumber:     form.insuranceNumber.trim() || null,
        insuranceExpiryDate: form.insuranceExpiryDate || null,
      }

      if (isEdit) {
        await vehicleAPI.update(vehicle.id, payload)
        if (file) await vehicleAPI.uploadInsuranceDocument(vehicle.id, file)
        toast.success('Vehicle updated')
      } else {
        if (file) {
          await vehicleAPI.addWithDocument({ ...payload, insuranceDocument: file })
        } else {
          await vehicleAPI.add(payload)
        }
        toast.success('Vehicle added')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm border outline-none'
  const inputStyle = { borderColor: P.border, color: P.dark }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: '#FFFAF5' }}>
          <div className="flex items-center gap-2">
            <Car size={16} style={{ color: P.primary }} />
            <h2 className="font-bold text-sm" style={{ color: P.dark }}>
              {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={15} style={{ color: P.muted }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Vehicle Number *
            </label>
            <input value={form.vehicleNumber}
              onChange={e => set('vehicleNumber', e.target.value.toUpperCase())}
              placeholder="e.g. MH01 AB 1234"
              className={inputCls + ' uppercase'} style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Vehicle Type
            </label>
            <select value={form.vehicleType}
              onChange={e => set('vehicleType', e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value="">Select type (optional)</option>
              <option value="TWO_WHEELER">Two-Wheeler</option>
              <option value="FOUR_WHEELER">Four-Wheeler</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                Insurance Provider
              </label>
              <input value={form.insuranceProvider}
                onChange={e => set('insuranceProvider', e.target.value)}
                placeholder="e.g. New India Assurance"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                Insurance Number
              </label>
              <input value={form.insuranceNumber}
                onChange={e => set('insuranceNumber', e.target.value)}
                placeholder="e.g. NIA/12345/2024"
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Insurance Expiry Date
            </label>
            <input type="date" value={form.insuranceExpiryDate}
              onChange={e => set('insuranceExpiryDate', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Insurance Document {isEdit && vehicle?.insuranceDocumentUrl ? '(replace)' : '(optional)'}
            </label>
            {!file ? (
              <label htmlFor="vehicleDocInput"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer"
                style={{ border: `1.5px dashed ${P.border}`, color: P.muted }}>
                <Upload size={14} style={{ color: P.secondary }} />
                <span className="text-xs">Upload image or PDF</span>
                <input id="vehicleDocInput" type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ border: `1.5px solid ${P.primary}`, background: 'rgba(0,121,121,0.06)' }}>
                <FileText size={14} style={{ color: P.primary }} />
                <span className="text-xs truncate flex-1" style={{ color: P.dark }}>{file.name}</span>
                <button type="button" onClick={() => setFile(null)} style={{ color: P.muted }}>
                  <X size={14} />
                </button>
              </div>
            )}
            {fileError && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={10} />{fileError}
              </p>
            )}
            <p className="text-[10px] mt-1" style={{ color: P.muted }}>JPG, JPEG, PNG, PDF — max 10 MB</p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: `1px solid ${P.border}`, color: P.muted }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  )
}

const VEHICLE_TYPE_LABELS = {
  TWO_WHEELER: 'Two-Wheeler',
  FOUR_WHEELER: 'Four-Wheeler',
  OTHER: 'Other',
}

// ── Single Vehicle Card ────────────────────────────────────────────────────
function VehicleCard({ vehicle, onEdit, onRemove }) {
  const isExpired = vehicle.insuranceExpiryDate
    ? new Date(vehicle.insuranceExpiryDate) < new Date()
    : false

  return (
    <div className="p-4 rounded-xl space-y-3" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: P.primary }}>
            <Car size={16} color="#fff" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: P.dark }}>{vehicle.vehicleNumber}</p>
            <p className="text-[11px]" style={{ color: P.muted }}>
              {vehicle.vehicleType ? VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType : 'Vehicle'}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(vehicle)}
            className="p-1.5 rounded-lg" style={{ border: `1px solid ${P.border}`, color: P.primary }}>
            <Edit2 size={12} />
          </button>
          <button onClick={() => onRemove(vehicle)}
            className="p-1.5 rounded-lg" style={{ border: `1px solid ${P.border}`, color: '#c0392b' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {(vehicle.insuranceProvider || vehicle.insuranceNumber || vehicle.insuranceExpiryDate) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {vehicle.insuranceProvider && (
            <div>
              <p className="text-[10px]" style={{ color: P.muted }}>Provider</p>
              <p className="font-medium" style={{ color: P.body }}>{vehicle.insuranceProvider}</p>
            </div>
          )}
          {vehicle.insuranceNumber && (
            <div>
              <p className="text-[10px]" style={{ color: P.muted }}>Policy No.</p>
              <p className="font-medium" style={{ color: P.body }}>{vehicle.insuranceNumber}</p>
            </div>
          )}
          {vehicle.insuranceExpiryDate && (
            <div className="col-span-2">
              <p className="text-[10px]" style={{ color: P.muted }}>Expiry Date</p>
              <p className="font-medium" style={{ color: isExpired ? '#c0392b' : P.body }}>
                {formatDate(vehicle.insuranceExpiryDate)}
                {isExpired && ' (Expired)'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${P.border}` }}>
        {vehicle.insuranceDocumentUrl ? (
          <a href={vehicle.insuranceDocumentUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: P.primary }}>
            <FileImage size={13} />
            View / Download Document
          </a>
        ) : (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: P.muted }}>
            <FileText size={13} />
            No insurance document uploaded
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function UserSettings() {
  const { user } = useAuth()
  const [tab, setTab]     = useState('profile')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  const [profile, setProfile] = useState({
    fullName: '', email: '', phone: '', address: '',
    vehicleDetails: '', profilePhotoUrl: null,
  })

  // Vehicle Insurance fields
  const [insurance, setInsurance] = useState({
    insuranceProvider:    '',
    insuranceNumber:      '',
    insuranceExpiryDate:  '',
  })

  // Taxes Reminder fields
  const [taxesEnabled, setTaxesEnabled]   = useState(false)
  const [taxes, setTaxes] = useState({
    ebReferenceNumber:             '',
    ebDueDate:                     '',
    waterTaxReferenceNumber:       '',
    waterTaxDueDate:               '',
    buildingTaxReferenceNumber:    '',
    buildingTaxDueDate:            '',
    taxesInsuranceReferenceNumber: '',
    taxesInsuranceDueDate:         '',
  })

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPw, setShowPw]       = useState({ current: false, new: false, confirm: false })
  const [notify, setNotify]       = useState({ email: true, sms: true, dues: true, announcements: true })

  // Multiple Vehicles
  const [vehicles, setVehicles]             = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [vehicleModal, setVehicleModal]     = useState(null) // null = closed, {} = add, {...vehicle} = edit

  const loadVehicles = () => {
    setVehiclesLoading(true)
    vehicleAPI.getAll()
      .then(res => setVehicles(res.data?.data || []))
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false))
  }

  const handleRemoveVehicle = async (vehicle) => {
    if (!window.confirm(`Remove vehicle ${vehicle.vehicleNumber}? This will also remove its insurance document.`)) return
    try {
      await vehicleAPI.remove(vehicle.id)
      toast.success('Vehicle removed')
      loadVehicles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove vehicle')
    }
  }

  useEffect(() => {
    userAPI.getProfile()
      .then(res => {
        const d = res.data?.data || res.data || {}
        setProfile({
          fullName:        d.fullName        || user?.name  || '',
          email:           d.email           || user?.email || '',
          phone:           d.phone           || '',
          address:         d.address         || '',
          vehicleDetails:  d.vehicleDetails  || '',
          profilePhotoUrl: d.profilePhotoUrl || null,
        })
        setInsurance({
          insuranceProvider:   d.insuranceProvider   || '',
          insuranceNumber:     d.insuranceNumber     || '',
          insuranceExpiryDate: d.insuranceExpiryDate || '',
        })
        setTaxesEnabled(d.taxesReminderEnabled || false)
        setTaxes({
          ebReferenceNumber:             d.ebReferenceNumber             || '',
          ebDueDate:                     d.ebDueDate                     || '',
          waterTaxReferenceNumber:       d.waterTaxReferenceNumber       || '',
          waterTaxDueDate:               d.waterTaxDueDate               || '',
          buildingTaxReferenceNumber:    d.buildingTaxReferenceNumber    || '',
          buildingTaxDueDate:            d.buildingTaxDueDate            || '',
          taxesInsuranceReferenceNumber: d.taxesInsuranceReferenceNumber || '',
          taxesInsuranceDueDate:         d.taxesInsuranceDueDate         || '',
        })
      })
      .catch(() => {
        setProfile({
          fullName:        user?.name  || '',
          email:           user?.email || '',
          phone:           '', address: '', vehicleDetails: '', profilePhotoUrl: null,
        })
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadVehicles()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await userAPI.updateProfile({
        fullName:       profile.fullName,
        phone:          profile.phone,
        address:        profile.address,
        vehicleDetails: profile.vehicleDetails,
      })
      toast.success('Profile updated successfully')
    } catch { toast.error('Could not update profile') }
    finally { setSaving(false) }
  }

  const saveInsurance = async () => {
    setSaving(true)
    try {
      await userAPI.updateFullProfile({
        insuranceProvider:   insurance.insuranceProvider   || null,
        insuranceNumber:     insurance.insuranceNumber     || null,
        insuranceExpiryDate: insurance.insuranceExpiryDate || null,
      })
      toast.success('Vehicle insurance details saved')
    } catch { toast.error('Could not save insurance details') }
    finally { setSaving(false) }
  }

  const saveTaxes = async () => {
    setSaving(true)
    try {
      await userAPI.updateFullProfile({
        taxesReminderEnabled:          taxesEnabled,
        ebReferenceNumber:             taxes.ebReferenceNumber             || null,
        ebDueDate:                     taxes.ebDueDate                     || null,
        waterTaxReferenceNumber:       taxes.waterTaxReferenceNumber       || null,
        waterTaxDueDate:               taxes.waterTaxDueDate               || null,
        buildingTaxReferenceNumber:    taxes.buildingTaxReferenceNumber    || null,
        buildingTaxDueDate:            taxes.buildingTaxDueDate            || null,
        taxesInsuranceReferenceNumber: taxes.taxesInsuranceReferenceNumber || null,
        taxesInsuranceDueDate:         taxes.taxesInsuranceDueDate         || null,
      })
      toast.success('Taxes reminder settings saved')
    } catch { toast.error('Could not save taxes reminder settings') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Fill all fields'); return
    }
    if (passwords.new !== passwords.confirm) { toast.error('Passwords do not match'); return }
    if (passwords.new.length < 8) { toast.error('Min 8 characters'); return }
    setSaving(true)
    try {
      await userAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.new })
      toast.success('Password changed')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const saveNotifyPrefs = async () => {
    setSaving(true)
    try {
      await userAPI.updateSettings({ notifications: notify })
      toast.success('Preferences saved')
    } catch { toast.error('Could not save') }
    finally { setSaving(false) }
  }

  if (loading) return <PageLoader />

  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-1'
  const inputStyle = { borderColor: P.border }

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: P.dark }}>Settings</h1>
        <p className="text-xs" style={{ color: P.muted }}>Manage your profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 gap-1 flex-wrap" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center min-w-[80px]"
            style={{
              background: tab === t.key ? P.primary : 'transparent',
              color:      tab === t.key ? '#fff' : P.muted,
            }}>
            <t.icon size={12} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${P.border}` }}>
          <PhotoSection
            user={user}
            profileData={profile}
            onPhotoUpdated={(url) => setProfile(p => ({ ...p, profilePhotoUrl: url }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Full Name</label>
              <input value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Email</label>
              <input value={profile.email} disabled
                className={inputCls + ' bg-gray-50'}
                style={{ ...inputStyle, color: P.muted }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Phone</label>
              <input value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Vehicle Details</label>
              <input value={profile.vehicleDetails}
                onChange={e => setProfile(p => ({ ...p, vehicleDetails: e.target.value }))}
                placeholder="e.g. TN01AB1234"
                className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Address</label>
            <textarea value={profile.address} rows={2}
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
              className={inputCls + ' resize-none'} style={inputStyle} />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* ── Vehicle / Insurance Tab ──────────────────────────────────────── */}
      {tab === 'insurance' && (
        <div className="space-y-4">

          {/* ── My Vehicles (multiple vehicles + insurance documents) ──────── */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${P.border}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car size={16} style={{ color: P.primary }} />
                <h2 className="text-sm font-bold" style={{ color: P.dark }}>My Vehicles</h2>
              </div>
              <button onClick={() => setVehicleModal({})}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: P.primary }}>
                <Plus size={13} />
                Add Another Vehicle
              </button>
            </div>
            <p className="text-xs" style={{ color: P.muted }}>
              Add any number of vehicles — two-wheelers, four-wheelers, or others — and optionally
              upload an insurance document (image or PDF) for each one.
            </p>

            {vehiclesLoading ? (
              <div className="py-8 text-center text-xs" style={{ color: P.muted }}>Loading vehicles…</div>
            ) : vehicles.length === 0 ? (
              <EmptyState
                icon={Car}
                title="No vehicles added yet"
                description="Click 'Add Another Vehicle' to register your first vehicle."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map(v => (
                  <VehicleCard
                    key={v.id}
                    vehicle={v}
                    onEdit={(veh) => setVehicleModal(veh)}
                    onRemove={handleRemoveVehicle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Legacy single-vehicle insurance reminder (unchanged) ───────── */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${P.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} style={{ color: P.primary }} />
              <h2 className="text-sm font-bold" style={{ color: P.dark }}>Vehicle Insurance Reminder</h2>
            </div>
            <p className="text-xs" style={{ color: P.muted }}>
              These details power your expiry reminder notification and are kept separately from the
              vehicle list above for backward compatibility.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                  Insurance Provider (optional)
                </label>
                <input value={insurance.insuranceProvider}
                  onChange={e => setInsurance(i => ({ ...i, insuranceProvider: e.target.value }))}
                  placeholder="e.g. New India Assurance"
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                  Policy / Insurance Number (optional)
                </label>
                <input value={insurance.insuranceNumber}
                  onChange={e => setInsurance(i => ({ ...i, insuranceNumber: e.target.value }))}
                  placeholder="e.g. NIA/12345/2024"
                  className={inputCls} style={inputStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                  Insurance Expiry Date <span style={{ color: '#c0392b' }}>*</span>
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.muted }} />
                  <input type="date" value={insurance.insuranceExpiryDate}
                    onChange={e => setInsurance(i => ({ ...i, insuranceExpiryDate: e.target.value }))}
                    className={inputCls + ' pl-8'} style={inputStyle} />
                </div>
                {insurance.insuranceExpiryDate && (
                  <p className="text-[10px] mt-1" style={{ color: P.primary }}>
                    Reminder will be sent on {new Date(new Date(insurance.insuranceExpiryDate).getTime() - 2*24*60*60*1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <button onClick={saveInsurance} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
              <Save size={14} />
              {saving ? 'Saving…' : 'Save Insurance Details'}
            </button>
          </div>
        </div>
      )}

      {vehicleModal !== null && (
        <VehicleFormModal
          vehicle={vehicleModal.id ? vehicleModal : null}
          onClose={() => setVehicleModal(null)}
          onSaved={() => { setVehicleModal(null); loadVehicles() }}
        />
      )}


      {/* ── Taxes Reminder Tab ───────────────────────────────────────────── */}
      {tab === 'taxes' && (
        <div className="bg-white rounded-2xl p-5 space-y-5" style={{ border: `1px solid ${P.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: P.primary }} />
              <h2 className="text-sm font-bold" style={{ color: P.dark }}>Taxes Reminder</h2>
            </div>
            <Toggle enabled={taxesEnabled} onToggle={() => setTaxesEnabled(v => !v)} />
          </div>

          <p className="text-xs" style={{ color: P.muted }}>
            {taxesEnabled
              ? 'Reminders are enabled. Fill in the details below and you will receive notifications 2 days before each due date.'
              : 'Enable this feature to set up reminders for your tax payments. All fields are optional.'}
          </p>

          {taxesEnabled && (
            <>
              {/* EB Details */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: P.dark }}>EB (Electricity Bill)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Reference Number (optional)</label>
                    <input value={taxes.ebReferenceNumber}
                      onChange={e => setTaxes(t => ({ ...t, ebReferenceNumber: e.target.value }))}
                      placeholder="e.g. EB/001234"
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Due Date</label>
                    <input type="date" value={taxes.ebDueDate}
                      onChange={e => setTaxes(t => ({ ...t, ebDueDate: e.target.value }))}
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Water Tax */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: P.dark }}>Water Tax</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Reference Number (optional)</label>
                    <input value={taxes.waterTaxReferenceNumber}
                      onChange={e => setTaxes(t => ({ ...t, waterTaxReferenceNumber: e.target.value }))}
                      placeholder="e.g. WT/005678"
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Due Date</label>
                    <input type="date" value={taxes.waterTaxDueDate}
                      onChange={e => setTaxes(t => ({ ...t, waterTaxDueDate: e.target.value }))}
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Building Tax */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: P.dark }}>Building Tax</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Reference Number (optional)</label>
                    <input value={taxes.buildingTaxReferenceNumber}
                      onChange={e => setTaxes(t => ({ ...t, buildingTaxReferenceNumber: e.target.value }))}
                      placeholder="e.g. BT/009012"
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Due Date</label>
                    <input type="date" value={taxes.buildingTaxDueDate}
                      onChange={e => setTaxes(t => ({ ...t, buildingTaxDueDate: e.target.value }))}
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Insurance (taxes module) */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: P.dark }}>Insurance</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Reference Number (optional)</label>
                    <input value={taxes.taxesInsuranceReferenceNumber}
                      onChange={e => setTaxes(t => ({ ...t, taxesInsuranceReferenceNumber: e.target.value }))}
                      placeholder="e.g. INS/0034"
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Expiry / Due Date</label>
                    <input type="date" value={taxes.taxesInsuranceDueDate}
                      onChange={e => setTaxes(t => ({ ...t, taxesInsuranceDueDate: e.target.value }))}
                      className={inputCls + ' bg-white'} style={inputStyle} />
                  </div>
                </div>
              </div>
            </>
          )}

          <button onClick={saveTaxes} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Taxes Reminder'}
          </button>
        </div>
      )}

      {/* ── Password Tab ─────────────────────────────────────────────────── */}
      {tab === 'password' && (
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${P.border}` }}>
          {['current', 'new', 'confirm'].map(k => (
            <div key={k}>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                {k === 'current' ? 'Current Password' : k === 'new' ? 'New Password' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPw[k] ? 'text' : 'password'}
                  value={passwords[k]}
                  onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))}
                  className={inputCls + ' pr-10'}
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPw(s => ({ ...s, [k]: !s[k] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: P.muted }}>
                  {showPw[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={changePassword} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            <Lock size={14} />
            {saving ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      )}

      {/* ── Notifications Tab ─────────────────────────────────────────────── */}
      {tab === 'notify' && (
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${P.border}` }}>
          {[
            { key: 'email',         label: 'Email Notifications' },
            { key: 'sms',           label: 'SMS Notifications' },
            { key: 'dues',          label: 'Dues & Payment Reminders' },
            { key: 'announcements', label: 'Announcements' },
          ].map(n => (
            <label key={n.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm" style={{ color: P.body }}>{n.label}</span>
              <div
                className="w-10 h-5 rounded-full relative transition-colors cursor-pointer"
                style={{ background: notify[n.key] ? P.primary : '#d1d5db' }}
                onClick={() => setNotify(p => ({ ...p, [n.key]: !p[n.key] }))}
              >
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                  style={{ left: notify[n.key] ? '1.375rem' : '0.125rem' }} />
              </div>
            </label>
          ))}
          <button onClick={saveNotifyPrefs} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  )
}