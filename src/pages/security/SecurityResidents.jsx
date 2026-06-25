import { useState, useEffect } from 'react'
import { Users, Phone, Home, Search, ChevronDown, ChevronUp, User } from 'lucide-react'
import { securityAPI } from '../../api/securityAPI'
import { getInitials } from '../../utils/initials'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5',
}

function Avatar({ name, size = 40 }) {
  const initials = getInitials(name, '??')
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: P.primary, fontSize: size * 0.3 }}>
      {initials}
    </div>
  )
}

function ResidentCard({ resident }) {
  const [expanded, setExpanded] = useState(false)
  const hasFamilyMembers = resident.familyMembers?.length > 0

  return (
    <div className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ background: P.surface, border: `1px solid ${P.border}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={resident.ownerName} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: P.dark }}>{resident.ownerName}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: P.muted }}>
                <Home size={11} /> Flat {resident.flatNumber}
              </span>
              {resident.phone && (
                <span className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: P.muted }}>
                  <Phone size={11} /> {resident.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
            style={{ background: P.accent, color: P.primary }}>
            {resident.propertyType || 'FLAT'}
          </span>
          {hasFamilyMembers && (
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
              style={{ background: expanded ? P.primary + '15' : P.accent, color: P.primary }}>
              <Users size={12} />
              {resident.familyMembers.length}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Family members panel */}
      {expanded && hasFamilyMembers && (
        <div style={{ borderTop: `1px solid ${P.border}`, background: '#fafafa' }}>
          <p className="px-5 py-2 text-xs font-semibold" style={{ color: P.muted }}>
            Family Members
          </p>
          {resident.familyMembers.map((fm, i) => (
            <div key={fm.id ?? i}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 hover:bg-white transition-colors"
              style={{ borderTop: i > 0 ? `1px solid ${P.border}` : undefined }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: P.secondary + '22' }}>
                  <User size={13} style={{ color: P.secondary }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: P.dark }}>{fm.name}</p>
                  {fm.relationship && (
                    <p className="text-[10px]" style={{ color: P.muted }}>{fm.relationship}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {fm.phone && (
                  <p className="text-xs flex items-center gap-1 whitespace-nowrap" style={{ color: P.muted }}>
                    <Phone size={10} /> {fm.phone}
                  </p>
                )}
                {fm.age && (
                  <p className="text-[10px]" style={{ color: P.muted }}>Age: {fm.age}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SecurityResidents() {
  const [residents, setResidents] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await securityAPI.getResidents()
        setResidents(res.data?.data ?? res.data ?? [])
      } catch {
        setResidents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = residents.filter(r => {
    const q = query.toLowerCase()
    return (
      r.ownerName?.toLowerCase().includes(q) ||
      r.flatNumber?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.familyMembers?.some(fm => fm.name?.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: P.dark }}>Residents List</h1>
          <p className="text-xs mt-0.5" style={{ color: P.muted }}>
            Read-only · {residents.length} resident(s) · {residents.reduce((s, r) => s + (r.familyMembers?.length ?? 0), 0)} family member(s)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: P.secondary }} />
        <input
          type="text"
          placeholder="Search by name, flat number, phone…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2"
          style={{
            background: P.surface,
            border: `1px solid ${P.border}`,
            color: P.dark,
            '--tw-ring-color': P.secondary + '40',
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: P.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: P.muted }}>
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">{query ? 'No residents match your search.' : 'No residents found.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => <ResidentCard key={r.id} resident={r} />)}
        </div>
      )}
    </div>
  )
}