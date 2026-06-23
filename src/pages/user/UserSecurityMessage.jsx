import { useState, useEffect } from 'react'
import { Shield, Send, ChevronDown } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
  surface: '#FFFAF5',
}

export default function UserSecurityMessage() {
  const [guards,   setGuards]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState({ guardId: '', title: '', message: '' })
  const [sending,  setSending]  = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    userAPI.getSecurityGuards()
      .then(res => setGuards(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error('Could not load security guards'))
      .finally(() => setLoading(false))
  }, [])

  const handleSend = async () => {
    if (!form.guardId)         { toast.error('Please select a security guard'); return }
    if (!form.message.trim())  { toast.error('Message cannot be empty'); return }
    setSending(true)
    try {
      await userAPI.sendMessageToSecurity(form.guardId, {
        title:   form.title.trim() || 'Message from Resident',
        message: form.message.trim(),
      })
      toast.success('Message sent to security guard')
      setForm(f => ({ ...f, title: '', message: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: P.dark }}>
          <Shield size={20} style={{ color: P.primary }} />
          Message Security
        </h1>
        
      </div>

      {/* Compose card */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>

        {/* Guard selector */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
            Select Security Guard <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {loading ? (
            <div className="w-full h-10 rounded-xl animate-pulse" style={{ background: P.accent }} />
          ) : (
            <div className="relative">
              <select
                value={form.guardId}
                onChange={e => set('guardId', e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm border outline-none pr-9"
                style={{ borderColor: P.border, background: '#fff', color: form.guardId ? P.dark : P.muted }}
              >
                <option value="">— Choose a guard —</option>
                {guards.map(g => (
                  <option key={g.id} value={g.id}>{g.name}{g.phone ? ` · ${g.phone}` : ''}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: P.muted }} />
            </div>
          )}
          {!loading && guards.length === 0 && (
            <p className="text-xs mt-1" style={{ color: P.muted }}>
              No active security guards found.
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
            Subject <span className="font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Visitor at gate"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={{ borderColor: P.border, background: '#fff', color: P.dark }}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
            Message <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Type your message to the security guard…"
            value={form.message}
            onChange={e => set('message', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
            style={{ borderColor: P.border, background: '#fff', color: P.dark }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: P.primary }}
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Send size={14} />
          }
          {sending ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}
