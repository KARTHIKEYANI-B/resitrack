import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Edit2, Trash2, Wifi, WifiOff,
  Phone, Mail, User, Heart, X, Save,
  Eye, EyeOff, AlertTriangle, CheckCircle,
  Shield, ShieldOff, Baby
} from 'lucide-react'
import { familyMemberAPI } from '../../api/familyMemberAPI'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
  surface: '#FFFAF5',
}

const RELATIONSHIPS = [
  'FATHER','MOTHER','WIFE','HUSBAND',
  'SON','DAUGHTER','BROTHER','SISTER',
  'GRANDFATHER','GRANDMOTHER','OTHER',
]

const REL_LABELS = {
  FATHER:'Father', MOTHER:'Mother', WIFE:'Wife', HUSBAND:'Husband',
  SON:'Son', DAUGHTER:'Daughter', BROTHER:'Brother', SISTER:'Sister',
  GRANDFATHER:'Grandfather', GRANDMOTHER:'Grandmother', OTHER:'Other',
}

// Relationship → icon component (replaces emoji avatars with professional icon set)
const REL_ICONS = {
  FATHER: User, MOTHER: User, WIFE: Heart, HUSBAND: User,
  SON: Baby, DAUGHTER: Baby, BROTHER: User, SISTER: User,
  GRANDFATHER: User, GRANDMOTHER: User, OTHER: User,
}

// ── Access Status Badge ───────────────────────────────────────────────────
function AccessBadge({ hasAccess }) {
  return hasAccess
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: '#E8F5E9', color: '#2E7D32', border: '1px solid #66BB6A' }}>
        <Wifi size={9} /> App Access
      </span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}>
        <WifiOff size={9} /> No Access
      </span>
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────
function MemberFormModal({ member, onClose, onSave }) {
  const isEdit = !!member?.id
  const [form, setForm] = useState({
    name:         member?.name         || '',
    relationship: member?.relationship || '',
    age:          member?.age          || '',
    phone:        member?.phone        || '',
    email:        member?.email        || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim())     { toast.error('Name is required'); return }
    if (!form.relationship)    { toast.error('Relationship is required'); return }
    setSaving(true)
    try {
      const payload = {
        name:         form.name.trim(),
        relationship: form.relationship,
        age:          form.age ? Number(form.age) : null,
        phone:        form.phone.trim() || null,
        email:        form.email.trim().toLowerCase() || null,
      }
      if (isEdit) {
        await familyMemberAPI.update(member.id, payload)
        toast.success('Family member updated')
      } else {
        await familyMemberAPI.add(payload)
        toast.success('Family member added')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: P.surface }}>
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: P.primary }} />
            <h2 className="font-bold text-sm" style={{ color: P.dark }}>
              {isEdit ? 'Edit Family Member' : 'Add Family Member'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={15} style={{ color: P.muted }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Full Name *
            </label>
            <input type="text" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Enter full name"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Relationship *
            </label>
            <select value={form.relationship}
              onChange={e => set('relationship', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }}>
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map(r => (
                <option key={r} value={r}>{REL_ICONS[r]} {REL_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Age (optional)
            </label>
            <input type="number" min="0" max="120" value={form.age}
              onChange={e => set('age', e.target.value)}
              placeholder="e.g. 35"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Mobile Number (optional)
            </label>
            <input type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="10-digit number"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Email Address (optional)
            </label>
            <input type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="contact@example.com"
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: P.border, color: P.dark }} />
            <p className="text-[10px] mt-1" style={{ color: P.muted }}>
              This is a contact email. Login email is set separately when granting app access.
            </p>
          </div>
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
            <Save size={13} />
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grant Access Modal ────────────────────────────────────────────────────
function GrantAccessModal({ member, onClose, onSave }) {
  // loginEmail is pre-filled from the family member's contact details.
  // A unique system email is auto-generated; the family member logs in
  // using their mobile number + password.
  const autoEmail = member.phone
    ? `fm.${member.phone.trim()}@resitrack.internal`
    : `fm.${member.id}.${Date.now()}@resitrack.internal`

  const [form, setForm]     = useState({ loginEmail: autoEmail, password: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!member.phone || member.phone.trim().length < 10) {
      toast.error('Family member must have a mobile number to enable app access. Please add their mobile number first.')
      return
    }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await familyMemberAPI.grantAccess(member.id, {
        loginEmail: form.loginEmail.trim().toLowerCase(),
        password:   form.password,
      })
      toast.success(`App access granted to ${member.name}`)
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant access')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,46,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: '#E8F5E9' }}>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: '#2E7D32' }} />
            <h2 className="font-bold text-sm" style={{ color: '#2E7D32' }}>
              Give App Access — {member.name}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-green-100">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="p-3 rounded-xl text-xs"
            style={{ background: '#FFF8E1', border: '1px solid #FFD54F', color: '#E65100' }}>
            <p className="font-semibold mb-1">What happens next:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>A login account is created for {member.name}</li>
              <li>They log in using their mobile number and the password you set</li>
              <li>They can view notices, raise complaints, and view notifications</li>
              <li>They cannot access financial or admin features</li>
            </ul>
          </div>

          {/* Mobile login info */}
          <div className="p-3 rounded-xl" style={{ background: '#E8F5E9', border: '1px solid #A5D6A7' }}>
            <p className="text-xs font-semibold" style={{ color: '#2E7D32' }}>Login Method: Mobile Number</p>
            <p className="text-xs mt-1" style={{ color: '#388E3C' }}>
              {member.phone
                ? <><strong>{member.name}</strong> will log in using mobile number <strong>{member.phone}</strong></>
                : <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                    <AlertTriangle size={12} /> No mobile number on file — please add their phone number first.
                  </span>
              }
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>
              Initial Password * (min 8 characters)
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Set a secure password"
                className="w-full px-3 py-2 pr-10 rounded-xl text-sm border outline-none"
                style={{ borderColor: P.border, color: P.dark }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: P.muted }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: P.border, color: P.muted }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: '#2E7D32', opacity: saving ? 0.7 : 1 }}>
            <Shield size={13} />
            {saving ? 'Granting…' : 'Grant Access'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Family Member Card ────────────────────────────────────────────────────
function MemberCard({ member, onEdit, onRemove, onGrantAccess, onRevokeAccess }) {
  const [revoking, setRevoking] = useState(false)

  const handleRevoke = async () => {
    if (!window.confirm(`Revoke app access for ${member.name}? They will no longer be able to log in.`)) return
    setRevoking(true)
    try {
      await familyMemberAPI.revokeAccess(member.id)
      toast.success('App access revoked')
      onRevokeAccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke access')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ border: `1px solid ${P.border}` }}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: P.accent, color: P.body }}>
          {(() => { const RelIcon = REL_ICONS[member.relationship] || User; return <RelIcon size={22} /> })()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: P.dark }}>{member.name}</p>
          <p className="text-xs" style={{ color: P.secondary }}>
            {REL_LABELS[member.relationship] || member.relationship}
            {member.age ? ` · Age ${member.age}` : ''}
          </p>
          <div className="mt-1.5">
            <AccessBadge hasAccess={member.hasAppAccess} />
          </div>
        </div>
      </div>

      {/* Contact info */}
      {(member.phone || member.email) && (
        <div className="space-y-1 text-xs" style={{ color: P.body }}>
          {member.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={11} style={{ color: P.secondary }} />
              <span>{member.phone}</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-1.5">
              <Mail size={11} style={{ color: P.secondary }} />
              <span className="truncate">{member.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Login email if access is granted */}
      {member.hasAppAccess && (
        <div className="px-3 py-2 rounded-xl text-xs"
          style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32' }}>
          <p className="font-semibold mb-0.5">Login Email</p>
          <p className="truncate">{member.phone ? `Login: ${member.phone}` : member.loginEmail || 'App access active'}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1" style={{ borderTop: `1px solid ${P.border}` }}>
        <button onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ color: P.primary, background: P.accent }}>
          <Edit2 size={11} /> Edit
        </button>

        {!member.hasAppAccess ? (
          <button onClick={onGrantAccess}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: '#2E7D32', background: '#E8F5E9' }}>
            <Wifi size={11} /> Give Access
          </button>
        ) : (
          <button onClick={handleRevoke} disabled={revoking}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: '#c2410c', background: '#FFF3E0', opacity: revoking ? 0.7 : 1 }}>
            <WifiOff size={11} /> {revoking ? 'Revoking…' : 'Revoke Access'}
          </button>
        )}

        <button onClick={onRemove}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto"
          style={{ color: '#dc2626', background: '#fef2f2' }}>
          <Trash2 size={11} /> Remove
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function FamilyMembersPage() {
  const { user, isOwner, isFamilyMember } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // null | { type, member? }

  const loadMembers = useCallback(() => {
    setLoading(true)
    familyMemberAPI.getAll()
      .then(r => setMembers(r.data?.data || []))
      .catch(() => toast.error('Failed to load family members'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadMembers() }, [loadMembers])

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from your family members list?`)) return
    try {
      await familyMemberAPI.remove(member.id)
      toast.success('Family member removed')
      loadMembers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove')
    }
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center" style={{ color: P.muted }}>
          <ShieldOff size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Family member management is available to property owners only.</p>
        </div>
      </div>
    )
  }

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
            <h1 className="text-xl font-bold" style={{ color: P.dark }}>My Family Members & Dependants</h1>
            <p className="text-xs" style={{ color: P.muted }}>
              Flat {user?.flatNumber} · {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: P.primary }}>
          <Plus size={15} /> Add Family Member
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-5 p-4 rounded-xl text-xs space-y-1"
        style={{ background: P.accent, border: `1px solid ${P.border}`, color: P.body }}>
        <p className="font-semibold" style={{ color: P.dark }}>About App Access</p>
        <p>Adding a family member creates a record linked to your property. You can optionally give them app access so they can log in, view notices, and raise complaints. You can revoke access at any time.</p>
      </div>

      {/* Members grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse"
              style={{ border: `1px solid ${P.border}` }}>
              <div className="flex gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16" style={{ color: P.muted }}>
          <Users size={44} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium mb-1">No family members added yet</p>
          <p className="text-xs mb-4">Add your family members to link them to your property.</p>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: P.primary }}>
            <Plus size={14} className="inline mr-1" /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              onEdit={() => setModal({ type: 'edit', member: m })}
              onRemove={() => handleRemove(m)}
              onGrantAccess={() => setModal({ type: 'grant', member: m })}
              onRevokeAccess={loadMembers}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'add' && (
        <MemberFormModal
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadMembers() }}
        />
      )}
      {modal?.type === 'edit' && (
        <MemberFormModal
          member={modal.member}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadMembers() }}
        />
      )}
      {modal?.type === 'grant' && (
        <GrantAccessModal
          member={modal.member}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadMembers() }}
        />
      )}
    </div>
  )
}