import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Edit2, Trash2, ArrowRightLeft,
  Phone, Mail, Calendar, Shield, ShieldCheck, UserCircle2,
  X, Save, AlertTriangle, Search, UserPlus, UserMinus,
  Key, CheckCircle, Clock, History, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { memberAPI } from '../../api/memberAPI'
import { adminAPI } from '../../api/adminAPI'
import axiosInstance from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import SecuritySection from './SecuritySection'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
  surface: '#FFFAF5',
}

const POSITIONS = [
  { value: 'PRESIDENT',       label: 'President' },
  { value: 'VICE_PRESIDENT',  label: 'Vice President' },
  { value: 'SECRETARY',       label: 'Secretary' },
  { value: 'JOINT_SECRETARY', label: 'Joint Secretary' },
  { value: 'TREASURER',       label: 'Treasurer' },
]

/**
 * Canonical position email map — must match AdminAssignmentService.POSITION_EMAILS
 * and MemberService.resolvePositionEmail() exactly.
 */
const POSITION_EMAILS = {
  PRESIDENT:       'superadmin@gmail.com',
  VICE_PRESIDENT:  'admin.vicepresident@apartment.com',
  SECRETARY:       'secretary@gmail.com',
  JOINT_SECRETARY: 'joinsecratery@gmail.com',
  TREASURER:       'treasurer@gmail.com',
}

const POSITION_COLORS = {
  PRESIDENT:       { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D' },
  VICE_PRESIDENT:  { bg: '#E8F5E9', text: '#2E7D32', border: '#66BB6A' },
  SECRETARY:       { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6' },
  JOINT_SECRETARY: { bg: '#F3E5F5', text: '#6A1B9A', border: '#BA68C8' },
  TREASURER:       { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' },
}

function Avatar({ name, photo, size = 56 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '??'
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: P.primary, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  )
}

function PositionBadge({ position }) {
  const c = POSITION_COLORS[position] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
  const label = POSITIONS.find(p => p.value === position)?.label || position
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {position === 'PRESIDENT' && <ShieldCheck size={11} />}
      {label}
    </span>
  )
}

// ── Appoint Modal ─────────────────────────────────────────────────────────────
function AppointModal({ residents, onClose, onSave }) {
  const [form, setForm] = useState({
    residentId: '',
    position: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    resetPassword: true,
  })
  const [saving,  setSaving]  = useState(false)
  const [result,  setResult]  = useState(null)  // AppointResponse after success

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.residentId) { toast.error('Select a resident'); return }
    if (!form.position)   { toast.error('Select a position');  return }

    // Guard: personal email must not equal position email
    const selectedResident = residents.find(r => String(r.id) === String(form.residentId))
    const positionEmail = POSITION_EMAILS[form.position]
    if (selectedResident?.email?.toLowerCase() === positionEmail?.toLowerCase()) {
      toast.error('A resident\'s personal email cannot be used as an admin position email.')
      return
    }

    setSaving(true)
    try {
      const res = await memberAPI.appointResident({
        residentId:    Number(form.residentId),
        position:      form.position,
        startDate:     form.startDate || undefined,
        notes:         form.notes || undefined,
        resetPassword: form.resetPassword,
      })
      // Unwrap ApiResponse<AppointResponse>: axios body → { success, message, data: AppointResponse }
      const appointResponse = res.data?.data ?? res.data ?? {}
      // Attach the selected resident's display info so credentials screen can show it
      const enriched = {
        ...appointResponse,
        residentName:    selectedResident?.fullName ?? appointResponse.assignment?.residentName ?? '',
        positionLabel:   POSITIONS.find(p => p.value === form.position)?.label ?? form.position,
        positionEmail:   appointResponse.positionEmail ?? positionEmail,
        generatedPassword: appointResponse.generatedPassword ?? null,
      }
      setResult(enriched)
      // NOTE: onSave() is intentionally NOT called here.
      // It is called when the admin clicks "Done" after reading the credentials.
      // Calling onSave() here would set modal=null (unmount this component)
      // before React can render the credentials screen, making the password invisible.
    } catch (err) {
      toast.error(err.response?.data?.message || 'Appointment failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Credentials screen — shown after appointment succeeds ───────────────
  // onSave() is called here (on Done) so the parent reloads AFTER the admin
  // has read the credentials. Calling it earlier would unmount this modal.
  if (result) {
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Copied to clipboard'),
        () => toast.error('Copy failed — please select and copy manually')
      )
    }

    const copyAll = () => {
      const lines = [
        `Position    : ${result.positionLabel}`,
        `Admin Email : ${result.positionEmail}`,
        `Password    : ${result.generatedPassword ?? '(unchanged)'}`,
        `Assigned To : ${result.residentName}`,
        '',
        'Note: This is the POSITION admin account, not the personal owner account.',
        'Owner login credentials are unchanged.',
      ].join('\n')
      copyToClipboard(lines)
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(26,46,46,0.6)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          style={{ border: `1px solid ${P.border}` }}>

          {/* Header */}
          <div className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: `1px solid ${P.border}`, background: '#E8F5E9' }}>
            <CheckCircle size={18} style={{ color: '#2E7D32' }} />
            <h2 className="font-bold text-base" style={{ color: '#2E7D32' }}>
              Appointment Successful
            </h2>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Credential card */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${P.border}` }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: P.surface, borderBottom: `1px solid ${P.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: P.muted }}>
                  Position Admin Account Credentials
                </p>
                <button onClick={copyAll}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors"
                  style={{ borderColor: P.border, color: P.secondary }}>
                  <Key size={10} /> Copy All
                </button>
              </div>

              <div className="divide-y" style={{ '--tw-divide-color': P.border }}>

                {/* Position name */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: P.muted }}>Position</span>
                  <span className="font-semibold text-sm" style={{ color: P.dark }}>
                    {result.positionLabel}
                  </span>
                </div>

                {/* Assigned resident */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: `1px solid ${P.border}` }}>
                  <span className="text-xs font-medium" style={{ color: P.muted }}>Assigned Resident</span>
                  <span className="font-semibold text-sm" style={{ color: P.dark }}>
                    {result.residentName}
                  </span>
                </div>

                {/* Position admin email */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: `1px solid ${P.border}` }}>
                  <span className="text-xs font-medium" style={{ color: P.muted }}>Admin Login Email</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold" style={{ color: P.primary }}>
                      {result.positionEmail}
                    </span>
                    <button onClick={() => copyToClipboard(result.positionEmail)}
                      className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
                      style={{ borderColor: P.border, color: P.muted }}>
                      Copy
                    </button>
                  </div>
                </div>

                {/* Generated password — only present when resetPassword=true */}
                {result.generatedPassword ? (
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: `1px solid ${P.border}`, background: '#FFFBF5' }}>
                    <div>
                      <span className="text-xs font-medium" style={{ color: P.muted }}>
                        Admin Password
                      </span>
                      <p className="text-[9px] mt-0.5" style={{ color: '#E65100' }}>
                        Shown once — copy now
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold px-3 py-1 rounded-lg"
                        style={{ background: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D',
                                 letterSpacing: '0.05em' }}>
                        {result.generatedPassword}
                      </span>
                      <button onClick={() => copyToClipboard(result.generatedPassword)}
                        className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
                        style={{ borderColor: '#FFB74D', color: '#E65100', background: '#FFF3E0' }}>
                        Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs" style={{ borderTop: `1px solid ${P.border}`, color: P.muted }}>
                    Password unchanged — existing position account password retained.
                  </div>
                )}
              </div>
            </div>

            {/* Separation notice */}
            <div className="rounded-xl p-3 space-y-1.5"
              style={{ background: '#E8F5E9', border: '1px solid #A5D6A7' }}>
              <p className="text-xs font-semibold" style={{ color: '#2E7D32' }}>
                Account Separation — Important
              </p>
              <div className="text-[10px] space-y-1" style={{ color: '#388E3C' }}>
                <p>✓ <strong>Admin login:</strong> {result.positionEmail} → Admin Dashboard</p>
                <p>✓ <strong>Owner login:</strong> {result.residentName}'s personal email → Owner Dashboard</p>
                <p>✓ Owner's login credentials are <strong>not changed</strong> by this appointment.</p>
              </div>
            </div>

            {/* One-time warning */}
            <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{ background: '#FFF8E1', border: '1px solid #FFD54F', color: '#E65100' }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                This password is displayed <strong>only once</strong> and cannot be retrieved later.
                Share it securely with the appointee immediately. They must change it on first login.
              </span>
            </div>
          </div>

          {/* Done — triggers parent reload AFTER admin sees credentials */}
          <div className="px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
            <button
              onClick={() => { onSave() }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: P.primary }}>
              Done — I have saved the credentials
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${P.border}` }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: P.surface }}>
          <div className="flex items-center gap-2">
            <UserPlus size={18} style={{ color: P.primary }} />
            <h2 className="font-bold text-base" style={{ color: P.dark }}>Appoint to Position</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} style={{ color: P.muted }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Architecture note */}
          <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
            style={{ background: '#E3F2FD', border: '1px solid #64B5F6', color: '#1565C0' }}>
            <Shield size={13} className="flex-shrink-0 mt-0.5" />
            <span>
              The resident's personal email is kept separate. A position-based admin account
              (e.g. admin.treasurer@apartment.com) will be used for admin login.
              One Resident record — multiple roles possible.
            </span>
          </div>

          {/* Resident */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Select Resident (Owner) *
            </label>
            <select
              value={form.residentId}
              onChange={e => set('residentId', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}
            >
              <option value="">— Choose a resident —</option>
              {residents.map(r => (
                <option key={r.id} value={r.id}>
                  {r.fullName} — {r.flatNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Committee Position *
            </label>
            <select
              value={form.position}
              onChange={e => set('position', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}
            >
              <option value="">— Select position —</option>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Position email preview */}
          {form.position && (
            <div className="flex items-center justify-between p-3 rounded-xl text-xs"
              style={{ background: P.surface, border: `1px solid ${P.border}` }}>
              <span style={{ color: P.muted }}>Admin Login Email</span>
              <span className="font-mono font-semibold" style={{ color: P.primary }}>
                {POSITION_EMAILS[form.position] || '—'}
              </span>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Notes (optional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Appointed at AGM 2025"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}
            />
          </div>

          {/* Reset password toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50 transition-all"
            style={{ borderColor: P.border }}>
            <input
              type="checkbox"
              checked={form.resetPassword}
              onChange={e => set('resetPassword', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="text-xs font-semibold" style={{ color: P.dark }}>
                Generate new credentials
              </p>
              <p className="text-[10px]" style={{ color: P.muted }}>
                Generates a secure password for the position account. Shown once — share securely.
              </p>
            </div>
            {form.resetPassword && <Key size={15} style={{ color: P.primary }} />}
          </label>
        </div>

        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: P.border, color: P.muted }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            {saving
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <UserPlus size={14} />}
            Appoint
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Revoke Modal ──────────────────────────────────────────────────────────────
function RevokeModal({ assignment, onClose, onSave }) {
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const endDate = new Date().toISOString().split('T')[0]

  const handleRevoke = async () => {
    setSaving(true)
    try {
      await memberAPI.revokeAssignment({
        assignmentId: assignment.id,
        endDate,
        notes: notes || 'Revoked via Members List',
      })
      toast.success('Assignment revoked — position is now vacant')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Revoke failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ border: `1px solid ${P.border}` }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${P.border}`, background: '#FEF2F2' }}>
          <div className="flex items-center gap-2">
            <UserMinus size={18} style={{ color: '#dc2626' }} />
            <h2 className="font-bold text-base text-red-700">Revoke Assignment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2 p-3 rounded-xl text-sm"
            style={{ background: '#FFF8E1', border: '1px solid #FFD54F', color: '#E65100' }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Position will become vacant.</p>
              <p className="text-xs mt-1">
                The assignment record is preserved in history. The resident's personal account
                is not affected. The position admin account remains but is unassigned.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border text-sm" style={{ borderColor: P.border }}>
            <p style={{ color: P.muted }} className="text-xs mb-1">Revoking assignment:</p>
            <p className="font-semibold" style={{ color: P.dark }}>{assignment.residentName}</p>
            <p className="text-xs" style={{ color: P.secondary }}>
              {assignment.positionDisplayName} · {assignment.adminPositionEmail}
            </p>
            <p className="text-xs mt-1" style={{ color: P.muted }}>
              Personal email: {assignment.residentPersonalEmail}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Reason / Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Committee term ended"
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
              style={{ borderColor: P.border, color: P.dark }}
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: P.border, color: P.muted }}>
            Cancel
          </button>
          <button onClick={handleRevoke} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-red-600 disabled:opacity-50">
            {saving
              ? <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
              : <UserMinus size={14} />}
            Confirm Revoke
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Admin Accounts Panel — Reset Password + Delete (Task 1 / Task 3 support) ──
// Super Admin / President can view all admin accounts, reset passwords,
// and delete stale/duplicate accounts directly from the UI.
function AdminAccountsPanel() {
  const [accounts,      setAccounts]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [resetTarget,   setResetTarget]   = useState(null) // { id, name, email }
  const [deleteTarget,  setDeleteTarget]  = useState(null) // { id, name, email }
  const [newPassword,   setNewPassword]   = useState('')
  const [showPw,        setShowPw]        = useState(false)
  const [saving,        setSaving]        = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/admin/accounts')
      setAccounts(res.data?.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      const res = await axiosInstance.put(`/admin/accounts/${resetTarget.id}/reset-password`, {
        newPassword,
      })
      // The backend echoes the email and name of the account that was actually updated.
      // Show the email in the toast so Super Admin can confirm the correct account was reset.
      const updated = res.data?.data
      const label = updated?.email || resetTarget.email
      toast.success(`Password reset — login email: ${label}`)
      setResetTarget(null)
      setNewPassword('')
      load() // refresh the list to reflect forcePasswordChange=false
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await axiosInstance.delete(`/admin/accounts/${deleteTarget.id}`)
      toast.success(`Account '${deleteTarget.email}' deleted`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: P.dark }}>
          <Key size={16} style={{ color: P.primary }} />
          Admin Account Management
        </h2>
        <p className="text-xs mt-0.5" style={{ color: P.muted }}>
          Manage admin accounts — reset passwords and remove duplicates. Super Admin / President only.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-32">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: P.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${P.border}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: P.primary }}>
                {['Name', 'Email', 'Position', 'Role', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, i) => (
                <tr key={acc.id}
                  className="border-t"
                  style={{ borderColor: P.border, background: i % 2 === 0 ? P.surface : '#fff' }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: P.dark }}>
                    {acc.name}
                    {acc.superAdmin && (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: P.primary + '20', color: P.primary }}>
                        SUPER ADMIN
                      </span>
                    )}
                    {acc.forcePasswordChange && (
                      <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fef3c7', color: '#d97706' }}>
                        MUST CHANGE PWD
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: P.muted }}>
                    {acc.email}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: P.body }}>
                    {acc.position
                      ? acc.position.replace(/_/g, ' ')
                      : <span style={{ color: P.muted }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: acc.superAdmin ? P.primary + '15' : P.accent,
                        color: acc.superAdmin ? P.primary : P.body,
                      }}>
                      {acc.superAdmin ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setResetTarget(acc); setNewPassword(''); setShowPw(false) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: P.accent, color: P.primary, border: `1px solid ${P.border}` }}>
                        <Key size={11} /> Reset Password
                      </button>
                      {/* Delete only shown for non-superAdmin accounts to prevent accidental self-lockout */}
                      {!acc.superAdmin && (
                        <button
                          onClick={() => setDeleteTarget(acc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,46,46,0.55)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            style={{ border: `1px solid ${P.border}` }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${P.border}`, background: P.accent }}>
              <div className="flex items-center gap-2">
                <Key size={16} style={{ color: P.primary }} />
                <p className="text-sm font-semibold" style={{ color: P.dark }}>
                  Reset Password
                </p>
              </div>
              <button onClick={() => setResetTarget(null)}
                className="p-1 rounded-lg hover:bg-white/60"
                style={{ color: P.muted }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-xl" style={{ background: P.surface, border: `1px solid ${P.border}` }}>
                <p className="text-xs font-semibold" style={{ color: P.dark }}>{resetTarget.name}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: P.muted }}>{resetTarget.email}</p>
                {resetTarget.position && (
                  <p className="text-[10px] mt-0.5" style={{ color: P.secondary }}>
                    {resetTarget.position.replace(/_/g, ' ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
                  New Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 pr-10 py-2.5 rounded-xl text-sm border outline-none"
                    style={{ borderColor: P.border, color: P.dark }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: P.secondary }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] mt-1" style={{ color: P.muted }}>
                  No current password needed. This is a Super Admin override reset.
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
              <button onClick={() => setResetTarget(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: P.border, color: P.muted }}>
                Cancel
              </button>
              <button onClick={handleReset} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: P.primary }}>
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Key size={14} />}
                {saving ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,46,46,0.55)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            style={{ border: `1px solid ${P.border}` }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${P.border}`, background: '#fef2f2' }}>
              <div className="flex items-center gap-2">
                <Trash2 size={16} style={{ color: '#dc2626' }} />
                <p className="text-sm font-semibold text-red-700">Delete Admin Account</p>
              </div>
              <button onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg hover:bg-red-100" style={{ color: P.muted }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <p className="text-xs font-semibold text-red-700">This action cannot be undone.</p>
                <p className="text-xs text-red-600 mt-1">
                  Account: <span className="font-mono font-bold">{deleteTarget.email}</span>
                </p>
                <p className="text-xs text-red-600">Name: {deleteTarget.name}</p>
              </div>
              <p className="text-xs" style={{ color: P.muted }}>
                All assignment history rows for this account will also be removed.
                Use this to clean up duplicate or stale admin accounts.
              </p>
            </div>

            <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: P.border, color: P.muted }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 bg-red-600">
                {saving
                  ? <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                  : <Trash2 size={14} />}
                {saving ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Member Modal (Add / Edit — existing, unchanged) ───────────────────────────
function MemberModal({ member, residents, onClose, onSave }) {
  const isEdit = !!member?.id && !member?.placeholder
  const [form, setForm] = useState({
    residentId:   member?.residentId  || '',
    position:     member?.position    || '',
    name:         member?.name        || '',
    photoUrl:     member?.photoUrl    || '',
    phoneNumber:  member?.phoneNumber || '',
    email:        member?.email       || '',
    joinedDate:   member?.joinedDate  || '',
    active:       member?.active !== false,
    adminPassword: '',   // Task 2: Super Admin can set the position admin account password
  })
  const [saving,  setSaving]  = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleResidentChange = (resId) => {
    set('residentId', resId)
    if (resId) {
      const r = residents.find(r => String(r.id) === String(resId))
      if (r) {
        setForm(f => ({
          ...f,
          residentId:  r.id,
          name:        f.name        || r.fullName || '',
          phoneNumber: f.phoneNumber || r.phone    || '',
          // IMPORTANT: email field intentionally NOT auto-filled from resident.email
          // The admin account uses the position email, not the personal email.
        }))
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.position) { toast.error('Please select a position'); return }
    if (!form.name)     { toast.error('Please enter a name'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        residentId:    form.residentId    || null,
        joinedDate:    form.joinedDate    || null,
        adminPassword: form.adminPassword || null,
      }
      if (isEdit) {
        await memberAPI.updateMember(member.id, payload)
        toast.success('Member updated')
      } else {
        await memberAPI.createMember(payload)
        toast.success('Member added')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${P.border}` }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: P.surface }}>
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: P.primary }} />
            <h2 className="font-bold text-base" style={{ color: P.dark }}>
              {isEdit ? 'Edit Member' : 'Add Committee Member'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} style={{ color: P.muted }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Position *</label>
            <select value={form.position} onChange={e => set('position', e.target.value)}
              disabled={isEdit}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, background: isEdit ? '#f9fafb' : '#fff', color: P.dark }}>
              <option value="">Select position</option>
              {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Link to Resident (Flat/Villa Owner)
            </label>
            <select value={form.residentId} onChange={e => handleResidentChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}>
              <option value="">— None (placeholder) —</option>
              {residents.map(r => (
                <option key={r.id} value={r.id}>{r.fullName} — {r.flatNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Name *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Phone Number</label>
            <input type="tel" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
              placeholder="10-digit mobile"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Photo URL</label>
            <input type="url" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          {/* ── Task 2: Admin Account Password ── */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Position Admin Account Password
              <span className="ml-1 text-[10px] font-normal" style={{ color: P.muted }}>
                {isEdit ? '(leave blank to keep existing password)' : '(optional — sets login password for the position account)'}
              </span>
            </label>
            <div className="relative">
              <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.secondary }} />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.adminPassword}
                onChange={e => set('adminPassword', e.target.value)}
                placeholder={isEdit ? 'Enter new password or leave blank' : 'e.g. Admin@123'}
                className="w-full pl-9 pr-10 py-2 rounded-xl text-sm border outline-none"
                style={{ borderColor: P.border, color: P.dark }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: P.secondary }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: P.muted }}>
              This sets the password for the committee position login account (e.g. admin.president@apartment.com).
              Min. 6 characters.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Joined Date</label>
            <input type="date" value={form.joinedDate} onChange={e => set('joinedDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-5 rounded-full relative transition-colors"
                style={{ background: form.active ? P.primary : '#d1d5db' }}
                onClick={() => set('active', !form.active)}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                  style={{ left: form.active ? '1.375rem' : '0.125rem' }} />
              </div>
              <span className="text-sm" style={{ color: P.body }}>Active member</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: P.border, color: P.muted }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            <Save size={14} />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Transfer Presidency Modal (unchanged) ─────────────────────────────────────
function TransferModal({ members, onClose, onSave }) {
  const nonPresidents = members.filter(m => m.position !== 'PRESIDENT' && !m.placeholder)
  const [selected, setSelected] = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleTransfer = async () => {
    if (!selected) { toast.error('Select the new President'); return }
    setSaving(true)
    try {
      await memberAPI.transferPresidency({ newPresidentMemberId: Number(selected) })
      toast.success('Presidency transferred successfully')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ border: `1px solid ${P.border}` }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${P.border}`, background: '#FFF3E0' }}>
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={18} style={{ color: '#E65100' }} />
            <h2 className="font-bold text-base" style={{ color: '#E65100' }}>Transfer Presidency</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-orange-100"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2 p-3 rounded-xl text-sm"
            style={{ background: '#FFF8E1', border: '1px solid #FFD54F', color: '#E65100' }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>The current President will lose SUPER_ADMIN privileges. The new President will automatically gain full SUPER_ADMIN access.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Select New President *</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}>
              <option value="">— Choose a committee member —</option>
              {nonPresidents.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.positionDisplayName})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: P.border, color: P.muted }}>Cancel</button>
          <button onClick={handleTransfer} disabled={saving || !selected}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: '#E65100', opacity: saving || !selected ? 0.7 : 1 }}>
            <ArrowRightLeft size={14} />
            {saving ? 'Transferring…' : 'Confirm Transfer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Active Assignment Card (replaces raw Member card for position-holders) ─────
function AssignmentCard({ assignment, isSuperAdmin, onRevoke }) {
  return (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: P.border }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <PositionBadge position={assignment.position} />
          <p className="font-bold text-sm mt-2" style={{ color: P.dark }}>{assignment.residentName}</p>
          <p className="text-xs mt-0.5" style={{ color: P.muted }}>Flat {assignment.flatNumber}</p>
        </div>
        {isSuperAdmin && (
          <button onClick={onRevoke}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors"
            style={{ borderColor: '#fecaca', color: '#dc2626', background: '#fef2f2' }}>
            <UserMinus size={11} /> Revoke
          </button>
        )}
      </div>
      <div className="space-y-1 text-xs border-t pt-3" style={{ borderColor: P.border }}>
        <div className="flex items-center gap-1.5" style={{ color: P.secondary }}>
          <Mail size={11} />
          <span className="truncate font-mono text-[10px]">{assignment.adminPositionEmail}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: P.muted }}>
          <Clock size={11} />
          <span>Since {assignment.startDate}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminMembersList() {
  const { isSuperAdmin } = useAuth()
  const [members,     setMembers]     = useState([])
  const [assignments, setAssignments] = useState([])
  const [residents,   setResidents]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(null) // null | { type, member?, assignment? }
  const [viewMode,    setViewMode]    = useState('committee') // 'committee' | 'assignments'

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [membersRes, assignmentsRes] = await Promise.allSettled([
        memberAPI.getAllMembers(),
        memberAPI.getActiveAssignments(),
      ])
      if (membersRes.status === 'fulfilled') {
        setMembers(membersRes.value.data?.data || [])
      }
      if (assignmentsRes.status === 'fulfilled') {
        setAssignments(assignmentsRes.value.data?.data || [])
      }
    } catch {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    if (isSuperAdmin) {
      adminAPI.getActiveResidents().then(r => {
        setResidents(r.data?.data || r.data || [])
      }).catch(() => {})
    }
  }, [loadAll, isSuperAdmin])

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from ${member.positionDisplayName}?`)) return
    try {
      await memberAPI.removeMember(member.id)
      toast.success('Member removed')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed')
    }
  }

  const filteredMembers = members.filter(m =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.positionDisplayName?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAssignments = assignments.filter(a =>
    !search ||
    a.residentName?.toLowerCase().includes(search.toLowerCase()) ||
    a.positionDisplayName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#f8fafa' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: P.primary }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: P.dark }}>Members List</h1>
            <p className="text-xs" style={{ color: P.muted }}>Association Committee · Position-Based Admin Accounts</p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setModal({ type: 'appoint' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
              style={{ background: P.primary }}>
              <UserPlus size={13} /> Appoint Resident
            </button>
            <button onClick={() => setModal({ type: 'transfer' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
              style={{ borderColor: '#E65100', color: '#E65100' }}>
              <ArrowRightLeft size={13} /> Transfer Presidency
            </button>
            <button onClick={() => setModal({ type: 'add' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
              style={{ borderColor: P.border, color: P.muted }}>
              <Plus size={13} /> Add Member
            </button>
          </div>
        )}
      </div>

      {/* Architecture info bar
      <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-medium"
        style={{ background: '#E3F2FD', border: '1px solid #64B5F6', color: '#1565C0' }}>
        <Shield size={14} className="flex-shrink-0 mt-0.5" />
        {/* <span>
          <strong>One Resident = One Record.</strong> Position-based admin accounts
          (admin.president@apartment.com etc.) are separate from residents' personal emails.
          When a committee changes, the position account is reassigned — no duplicate records are created.
        </span> }
      </div> */}
{/* 
      {!isSuperAdmin && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
          style={{ background: '#E3F2FD', border: '1px solid #64B5F6', color: '#1565C0' }}>
          <Shield size={14} />
          Read-only access. Only the SUPER_ADMIN (President) can manage committee members.
        </div>
      )} */}

      {/* View mode tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{ background: P.accent, border: `1px solid ${P.border}` }}>
        {[
          { key: 'committee',   label: 'Committee',          icon: Users   },
          { key: 'assignments', label: 'Active Assignments',  icon: History },
          { key: 'security',    label: 'Security',            icon: Shield  },
          // Admin Accounts tab — visible to Super Admin / President only
          ...(isSuperAdmin ? [{ key: 'accounts', label: 'Admin Accounts', icon: Key }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => setViewMode(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: viewMode === t.key ? P.primary : 'transparent',
              color:      viewMode === t.key ? '#fff'    : P.body,
            }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search members or positions…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
          style={{ borderColor: P.border, background: '#fff', color: P.dark }} />
      </div>

      {/* ── Committee view (original) ─────────────────────────────────── */}
      {viewMode === 'committee' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse"
                style={{ border: `1px solid ${P.border}` }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16" style={{ color: P.muted }}>
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                isSuperAdmin={isSuperAdmin}
                onEdit={() => setModal({ type: 'edit', member })}
                onRemove={() => handleRemove(member)}
              />
            ))}
          </div>
        )
      )}

      {/* ── Assignment view (new) ──────────────────────────────────────── */}
      {viewMode === 'assignments' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse"
                style={{ border: `1px solid ${P.border}` }}>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-16" style={{ color: P.muted }}>
            <History size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No active assignments</p>
            <p className="text-xs mt-1">Use "Appoint Resident" to assign committee positions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map(a => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                isSuperAdmin={isSuperAdmin}
                onRevoke={() => setModal({ type: 'revoke', assignment: a })}
              />
            ))}
          </div>
        )
      )}

      {/* ── Security section ──────────────────────────────────────────── */}
      {viewMode === 'security' && (
        <SecuritySection />
      )}

      {/* ── Admin Accounts — Reset Password (Task 1 + Task 2 support) ── */}
      {viewMode === 'accounts' && (
        <AdminAccountsPanel />
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {modal?.type === 'appoint' && (
        <AppointModal
          residents={residents}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAll() }}
        />
      )}
      {modal?.type === 'add' && (
        <MemberModal
          residents={residents}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAll() }}
        />
      )}
      {modal?.type === 'edit' && (
        <MemberModal
          member={modal.member}
          residents={residents}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAll() }}
        />
      )}
      {modal?.type === 'transfer' && (
        <TransferModal
          members={members}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAll() }}
        />
      )}
      {modal?.type === 'revoke' && modal.assignment && (
        <RevokeModal
          assignment={modal.assignment}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAll() }}
        />
      )}
    </div>
  )
}

// ── Member Card (existing — unchanged) ────────────────────────────────────────
function MemberCard({ member, isSuperAdmin, onEdit, onRemove }) {
  const isPresident   = member.position === 'PRESIDENT'
  const isPlaceholder = member.placeholder

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{
        border: `1px solid ${isPresident ? '#FFB74D' : P.border}`,
        background: isPresident ? '#FFFDF7' : '#fff',
      }}>
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar name={member.name} photo={member.photoUrl} size={56} />
          {isPresident && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#E65100' }}>
              <ShieldCheck size={11} color="#fff" />
            </span>
          )}
          {isPlaceholder && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#d1d5db' }}>
              <UserCircle2 size={11} color="#fff" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: P.dark }}>
            {isPlaceholder ? <em style={{ color: P.muted }}>{member.name}</em> : member.name}
          </p>
          <div className="mt-1"><PositionBadge position={member.position} /></div>
          {isPlaceholder && <p className="text-[10px] mt-1" style={{ color: P.muted }}>Position vacant</p>}
        </div>
      </div>

      {!isPlaceholder && (
        <div className="space-y-1.5 text-xs" style={{ color: P.body }}>
          {member.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: P.secondary }} />
              <span className="truncate">{member.phoneNumber}</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: P.secondary }} />
              <span className="truncate text-[10px] font-mono">{member.email}</span>
            </div>
          )}
          {member.joinedDate && (
            <div className="flex items-center gap-2">
              <Calendar size={12} style={{ color: P.secondary }} />
              <span>{new Date(member.joinedDate).toLocaleDateString('en-IN',
                { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}

      {isSuperAdmin && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: P.border }}>
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: P.primary, background: P.accent }}>
            <Edit2 size={11} /> Edit
          </button>
          {member.position !== 'PRESIDENT' && (
            <button onClick={onRemove}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: '#dc2626', background: '#fef2f2' }}>
              <Trash2 size={11} /> Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}