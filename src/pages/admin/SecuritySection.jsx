/**
 * SecuritySection.jsx
 *
 * DROP THIS FILE into: frontend/src/pages/admin/
 *
 * Then in MembersList.jsx:
 *   1. Import it at the top:
 *        import SecuritySection from './SecuritySection'
 *
 *   2. Add 'security' to the view-mode tab list (see instructions in MembersList.jsx patch)
 *
 *   3. Render it alongside the other view modes:
 *        {viewMode === 'security' && <SecuritySection />}
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Plus, Edit2, Trash2, Phone, Mail,
  Eye, EyeOff, Search, X, Save, AlertTriangle,
  CheckCircle, UserX, Send
} from 'lucide-react'
import { securityAdminAPI } from '../../api/securityAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
  surface: '#FFFAF5',
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '??'
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: P.primary, fontSize: size * 0.3 }}>
      {initials}
    </div>
  )
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function GuardModal({ guard, onClose, onSave }) {
  const isEdit = !!guard
  const [form, setForm] = useState({
    name:     guard?.name     || '',
    phone:    guard?.phone    || '',
    email:    guard?.email    || '',
    password: '',
    active:   guard?.active   ?? true,
  })
  const [showPw,  setShowPw]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                              e.name = 'Name is required'
    if (!form.email.trim() && !form.phone.trim())       e.email = 'Email or phone is required'
    if (!isEdit && form.password.length < 6)            e.password = 'Password must be at least 6 characters'
    if (isEdit && form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        const payload = {
          name:   form.name,
          phone:  form.phone || undefined,
          email:  form.email || undefined,
          active: form.active,
        }
        if (form.password) payload.password = form.password
        await securityAdminAPI.update(guard.id, payload)
        toast.success('Security account updated')
      } else {
        await securityAdminAPI.create({
          name:     form.name,
          phone:    form.phone || undefined,
          email:    form.email || undefined,
          password: form.password,
        })
        toast.success('Security account created')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: P.accent }}>
          <div className="flex items-center gap-2.5">
            <Shield size={16} style={{ color: P.primary }} />
            <p className="text-sm font-semibold" style={{ color: P.dark }}>
              {isEdit ? 'Edit Security Account' : 'Create Security Account'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: P.muted }}><X size={18} /></button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: errors.name ? '#ef4444' : P.border, background: '#fff', color: P.dark }} />
            {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
              Phone Number
            </label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: P.secondary }} />
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="9876543210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: errors.email ? '#ef4444' : P.border, background: '#fff', color: P.dark }} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
              Email Address
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: P.secondary }} />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="guard@example.com (optional)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: errors.email ? '#ef4444' : P.border, background: '#fff', color: P.dark }} />
            </div>
            {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
            <p className="text-[10px] mt-0.5" style={{ color: P.muted }}>
              At least one of Email or Phone is required for login.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
              Password {!isEdit && <span style={{ color: '#ef4444' }}>*</span>}
              {isEdit && <span className="ml-1 text-[10px]">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Min. 6 characters'}
                className="w-full px-3 pr-10 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: errors.password ? '#ef4444' : P.border, background: '#fff', color: P.dark }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: P.secondary }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>}
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => set('active', !form.active)}
                className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: form.active ? P.primary : '#d1d5db' }}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ left: form.active ? '22px' : '2px' }} />
              </div>
              <span className="text-sm" style={{ color: P.dark }}>
                Account {form.active ? 'Active' : 'Inactive'}
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4"
          style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: P.muted, background: P.accent, border: `1px solid ${P.border}` }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: P.primary }}>
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={14} />
            }
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Generate Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Send Message Modal ────────────────────────────────────────────────────────
function MessageModal({ guard, onClose }) {
  const [form,    setForm]    = useState({ title: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!form.message.trim()) { toast.error('Message cannot be empty'); return }
    setSending(true)
    try {
      await securityAdminAPI.sendMessage(guard.id, form)
      toast.success(`Message sent to ${guard.name}`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${P.border}`, background: P.accent }}>
          <p className="text-sm font-semibold" style={{ color: P.dark }}>
            Message to {guard.name}
          </p>
          <button onClick={onClose} style={{ color: P.muted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <input type="text" placeholder="Subject (optional)"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={{ borderColor: P.border, background: '#fff', color: P.dark }} />
          <textarea rows={4} placeholder="Type your message…"
            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
            style={{ borderColor: P.border, background: '#fff', color: P.dark }} />
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4"
          style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: P.muted, background: P.accent, border: `1px solid ${P.border}` }}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: P.primary }}>
            {sending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={14} />
            }
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Security Guard Card ───────────────────────────────────────────────────────
function GuardCard({ guard, onEdit, onDelete, onMessage }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ border: `1px solid ${P.border}` }}>
      <div className="flex items-start gap-3">
        <Avatar name={guard.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate" style={{ color: P.dark }}>{guard.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              guard.active
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
              {guard.active ? '● Active' : '○ Inactive'}
            </span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            {guard.phone && (
              <p className="flex items-center gap-1.5 text-xs" style={{ color: P.muted }}>
                <Phone size={11} style={{ color: P.secondary }} /> {guard.phone}
              </p>
            )}
            {guard.email && (
              <p className="flex items-center gap-1.5 text-xs truncate" style={{ color: P.muted }}>
                <Mail size={11} style={{ color: P.secondary }} /> {guard.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2 pt-2" style={{ borderTop: `1px solid ${P.border}` }}>
        <button onClick={() => onMessage(guard)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ color: P.primary, background: P.accent }}>
          <Send size={11} /> Message
        </button>
        <button onClick={() => onEdit(guard)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ color: P.secondary, background: '#e0f7f7' }}>
          <Edit2 size={11} /> Edit
        </button>
        <button onClick={() => onDelete(guard)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ color: '#dc2626', background: '#fef2f2' }}>
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  )
}

// ── Main Security Section ─────────────────────────────────────────────────────
export default function SecuritySection() {
  const [guards,  setGuards]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null) // null | { type: 'create'|'edit'|'delete'|'message', guard? }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await securityAdminAPI.getAll()
      setGuards(res.data?.data ?? res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load security accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (guard) => {
    if (!window.confirm(`Delete security account for ${guard.name}? This cannot be undone.`)) return
    try {
      await securityAdminAPI.remove(guard.id)
      toast.success('Security account deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const filtered = guards.filter(g =>
    !search ||
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search) ||
    g.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: P.dark }}>
            <Shield size={16} style={{ color: P.primary }} />
            Security Accounts
          </h2>
          <p className="text-xs mt-0.5" style={{ color: P.muted }}>
            Manage security guard login accounts · {guards.length} account(s)
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: P.primary }}>
          <Plus size={14} /> Create Security Account
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
          style={{ borderColor: P.border, background: '#fff', color: P.dark }} />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse"
              style={{ border: `1px solid ${P.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: P.muted }}>
          <UserX size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {search ? 'No security accounts match your search.' : 'No security accounts yet. Create one above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => (
            <GuardCard
              key={g.id}
              guard={g}
              onEdit={guard => setModal({ type: 'edit', guard })}
              onDelete={handleDelete}
              onMessage={guard => setModal({ type: 'message', guard })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'create' && (
        <GuardModal
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
      {modal?.type === 'edit' && modal.guard && (
        <GuardModal
          guard={modal.guard}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
      {modal?.type === 'message' && modal.guard && (
        <MessageModal
          guard={modal.guard}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}