import { useState, useEffect } from 'react'
import { Users, Phone, Mail, Calendar, ShieldCheck, Search, UserCircle2 } from 'lucide-react'
import { memberAPI } from '../../api/memberAPI'
import { getInitials } from '../../utils/initials'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
}

const POSITIONS = {
  PRESIDENT:       'President',
  VICE_PRESIDENT:  'Vice President',
  SECRETARY:       'Secretary',
  JOINT_SECRETARY: 'Joint Secretary',
  TREASURER:       'Treasurer',
}

const POSITION_COLORS = {
  PRESIDENT:       { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D' },
  VICE_PRESIDENT:  { bg: '#E8F5E9', text: '#2E7D32', border: '#66BB6A' },
  SECRETARY:       { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6' },
  JOINT_SECRETARY: { bg: '#F3E5F5', text: '#6A1B9A', border: '#BA68C8' },
  TREASURER:       { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' },
}

function Avatar({ name, photo, size = 64 }) {
  const initials = getInitials(name, '??')
  const [errored, setErrored] = useState(false)

  if (photo && !errored) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setErrored(true)}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, background: P.primary, fontSize: size * 0.28 }}
    >
      {initials}
    </div>
  )
}

function PositionBadge({ position }) {
  const c = POSITION_COLORS[position] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {position === 'PRESIDENT' && <ShieldCheck size={11} />}
      {POSITIONS[position] || position}
    </span>
  )
}

function MemberCard({ member }) {
  const isPresident   = member.position === 'PRESIDENT'
  const isPlaceholder = member.placeholder

  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{
        border: `1px solid ${isPresident ? '#FFB74D' : P.border}`,
        background: isPresident ? '#FFFDF7' : '#fff',
      }}
    >
      {/* Avatar + name */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="relative">
          <Avatar name={member.name} photo={member.photoUrl} size={72} />
          {isPresident && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow"
              style={{ background: '#E65100' }}>
              <ShieldCheck size={13} color="#fff" />
            </span>
          )}
          {isPlaceholder && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow"
              style={{ background: '#d1d5db' }}>
              <UserCircle2 size={13} color="#fff" />
            </span>
          )}
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: isPlaceholder ? P.muted : P.dark }}>
            {isPlaceholder ? <em>{member.name}</em> : member.name}
          </p>
          <div className="mt-1.5 flex justify-center">
            <PositionBadge position={member.position} />
          </div>
          {isPlaceholder && (
            <p className="text-[10px] mt-1" style={{ color: P.muted }}>Position Vacant</p>
          )}
        </div>
      </div>

      {/* Contact details */}
      {!isPlaceholder && (
        <div className="space-y-2 text-xs" style={{ color: P.body, borderTop: `1px solid ${P.border}`, paddingTop: 12 }}>
          {member.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: P.secondary }} />
              <a href={`tel:${member.phoneNumber}`} className="hover:underline truncate"
                style={{ color: P.primary }}>
                {member.phoneNumber}
              </a>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: P.secondary }} />
              <a href={`mailto:${member.email}`} className="hover:underline truncate"
                style={{ color: P.primary }}>
                {member.email}
              </a>
            </div>
          )}
          {member.joinedDate && (
            <div className="flex items-center gap-2">
              <Calendar size={12} style={{ color: P.secondary }} />
              <span>
                Since {new Date(member.joinedDate).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function UserMembersList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    memberAPI.getAllMembers()
      .then(r => setMembers(r.data?.data || []))
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = members.filter(m =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    (m.positionDisplayName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#f8fafa' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: P.primary }}>
          <Users size={20} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: P.dark }}>Community Members</h1>
          <p className="text-xs" style={{ color: P.muted }}>
            R R Dhurya Owners Welfare Association — Committee Members
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-5 px-4 py-3 rounded-xl text-xs"
        style={{ background: P.accent, border: `1px solid ${P.border}`, color: P.body }}>
        These are your elected Association Committee Members. Reach out to them for any queries related to your flat/villa.
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: P.muted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or position…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
          style={{ borderColor: P.border, background: '#fff', color: P.dark }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse"
              style={{ border: `1px solid ${P.border}` }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: P.muted }}>
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      )}
    </div>
  )
}
