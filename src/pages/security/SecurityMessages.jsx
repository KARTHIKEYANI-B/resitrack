import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { securityAPI } from '../../api/securityAPI'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5',
}

export default function SecurityMessages() {
  const [form,    setForm]    = useState({ title: '', message: '' })
  const [sending, setSending] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSend = async () => {
    if (!form.message.trim()) { toast.error('Message cannot be empty'); return }
    setSending(true)
    try {
      await securityAPI.sendMessage(form)
      toast.success('Message sent to Admin')
      setForm({ title: '', message: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: P.dark }}>Send Message to Admin</h1>
        <p className="text-xs mt-0.5" style={{ color: P.muted }}>
          Your message will be delivered to the Admin team.
        </p>
      </div>

      {/* Compose card */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={16} style={{ color: P.primary }} />
          <p className="text-sm font-semibold" style={{ color: P.dark }}>New Message</p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
            Subject (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Gate maintenance issue"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2"
            style={{
              background: '#fff',
              border: `1px solid ${P.border}`,
              color: P.dark,
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: P.muted }}>
            Message <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Type your message here…"
            value={form.message}
            onChange={e => set('message', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 resize-none"
            style={{
              background: '#fff',
              border: `1px solid ${P.border}`,
              color: P.dark,
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !form.message.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: P.primary }}>
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