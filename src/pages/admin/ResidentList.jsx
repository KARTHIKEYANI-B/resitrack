import { useState, useEffect, useCallback } from 'react'
import {
  Edit2, Trash2, Search, RefreshCw, Users, AlertTriangle,
  ChevronDown, ChevronUp, Wifi, WifiOff, UserCheck,
  BarChart2, Home, Building2, Shield, Activity, UserCircle2
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const P = {
  primary: '#007979', secondary: '#24B1B1',
  accent: '#FFE0C5', border: '#E8C9AB',
  dark: '#1a2e2e', body: '#2d4040', muted: '#6b8080',
}

const REL_ICONS = {
  FATHER:'👨', MOTHER:'👩', WIFE:'💑', HUSBAND:'👨',
  SON:'👦', DAUGHTER:'👧', BROTHER:'🧒', SISTER:'🧒',
  GRANDFATHER:'👴', GRANDMOTHER:'👵', OTHER:'👤',
}

const INIT_EDIT = {
  fullName: '', email: '', phone: '',
  flatNumber: '', squareFeet: '', familyMembers: '', age: '', vehicleDetails: '', address: '',
}

// ── PROFILE AVATAR ────────────────────────────────────────────────────────
function ResidentAvatar({ name, photoUrl, size = 36 }) {
  const [imgError, setImgError] = useState(false)
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const hue = name
    ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 200

  if (photoUrl && !imgError) {
    return (
      <img src={photoUrl} alt={name || 'Resident'} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
                 border: `2px solid ${P.border}`, flexShrink: 0 }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},45%,55%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700,
      fontSize: size <= 32 ? 11 : size <= 40 ? 13 : 15,
      border: `2px solid ${P.border}`, userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

// ── POPULATION SUMMARY PANEL ──────────────────────────────────────────────

// ── POPULATION SUMMARY PANEL ──────────────────────────────────────────────
function PopulationSummary() {
  const [pop,     setPop]     = useState(null)
  const [loading, setLoading] = useState(true)

  // From Age / To Age range filter state
  const [fromAge,      setFromAge]      = useState('')
  const [toAge,        setToAge]        = useState('')
  const [rangeMembers, setRangeMembers] = useState(null)   // null = not searched yet
  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeError,   setRangeError]   = useState('')

  useEffect(() => {
    adminAPI.getPopulationStats()
      .then(r => setPop(r.data?.data || r.data))
      .catch(() => toast.error('Could not load population stats'))
      .finally(() => setLoading(false))
  }, [])

  const handleRangeSearch = async () => {
    const from = parseInt(fromAge, 10)
    const to   = parseInt(toAge,   10)
    if (isNaN(from) || from < 0) { setRangeError('Enter a valid From Age (0 or above)'); return }
    if (isNaN(to)   || to < 0)  { setRangeError('Enter a valid To Age (0 or above)');   return }
    if (from > to)               { setRangeError('From Age must be less than or equal to To Age'); return }
    setRangeError('')
    setRangeLoading(true)
    try {
      const res = await adminAPI.getFamilyMembersByAgeRange({ minAge: from, maxAge: to })
      const data = res.data?.data ?? res.data ?? []
      setRangeMembers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Could not fetch family members for this age range')
    } finally {
      setRangeLoading(false)
    }
  }

  const handleReset = () => {
    setFromAge('')
    setToAge('')
    setRangeMembers(null)
    setRangeError('')
  }

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100" />)}
    </div>
  )

  const stats = [
    { label: 'Total Population',     value: pop?.totalPopulation ?? 0,    icon: Users,      color: P.primary },
    { label: 'Property Owners',      value: pop?.totalOwners ?? 0,        icon: Home,       color: '#2E7D32' },
    { label: '— Flat Owners',        value: pop?.totalFlatOwners ?? 0,    icon: Building2,  color: P.secondary, indent: true },
    { label: '— Villa Owners',       value: pop?.totalVillaOwners ?? 0,   icon: Home,       color: '#6A1B9A', indent: true },
    { label: 'Family Members',       value: pop?.totalFamilyMembers ?? 0, icon: Users,      color: '#E65100' },
    { label: '— With App Access',    value: pop?.familyMembersWithAccess ?? 0, icon: Wifi,  color: '#1565C0', indent: true },
    { label: 'Admins',               value: pop?.totalAdmins ?? 0,        icon: Shield,     color: '#880E4F' },
    { label: 'Active Portal Users',   value: pop?.totalActiveUsers ?? 0,   icon: Activity,   color: '#2E7D32' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.filter(s => !s.indent).map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border" style={{ borderColor: P.border }}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} style={{ color: s.color }} />
              <p className="text-xs font-medium" style={{ color: P.muted }}>{s.label}</p>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: P.dark }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-4 space-y-2" style={{ borderColor: P.border }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: P.muted }}>Full Breakdown</p>
        {stats.map(s => (
          <div key={s.label} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${s.indent ? 'pl-6' : ''}`} style={{ borderColor: P.border }}>
            <div className="flex items-center gap-2">
              <s.icon size={12} style={{ color: s.color }} />
              <span className="text-sm" style={{ color: s.indent ? P.muted : P.body }}>{s.label}</span>
            </div>
            <span className="font-mono font-semibold text-sm" style={{ color: P.dark }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Family Member Age Groups — From / To range filter ─────────── */}
      <div className="bg-white rounded-2xl border p-4" style={{ borderColor: P.border }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: P.muted }}>
          Family Member Age Groups
        </p>

        {/* From Age / To Age inputs */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: P.body }}>
              From Age
            </label>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 18"
              value={fromAge}
              onChange={e => { setFromAge(e.target.value); setRangeError('') }}
              className="w-28 px-3 py-2 rounded-xl text-sm border outline-none font-mono"
              style={{ borderColor: rangeError ? '#ef4444' : P.border, color: P.dark }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: P.body }}>
              To Age
            </label>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 30"
              value={toAge}
              onChange={e => { setToAge(e.target.value); setRangeError('') }}
              className="w-28 px-3 py-2 rounded-xl text-sm border outline-none font-mono"
              style={{ borderColor: rangeError ? '#ef4444' : P.border, color: P.dark }}
            />
          </div>
          <button
            onClick={handleRangeSearch}
            disabled={rangeLoading || !fromAge || !toAge}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: P.primary }}
          >
            {rangeLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Search size={13} />}
            Search
          </button>
          {rangeMembers !== null && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-sm border transition-colors"
              style={{ borderColor: P.border, color: P.muted }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Validation error */}
        {rangeError && (
          <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
            <AlertTriangle size={12} /> {rangeError}
          </p>
        )}

        {/* Results */}
        {rangeMembers === null ? (
          <div className="text-center py-8 rounded-xl" style={{ background: '#f8fafa', border: `1px dashed ${P.border}` }}>
            <UserCheck size={28} className="mx-auto mb-2 opacity-30" style={{ color: P.primary }} />
            <p className="text-sm" style={{ color: P.muted }}>
              Enter a From Age and To Age, then press Search.
            </p>
            <p className="text-xs mt-1" style={{ color: P.muted }}>
              Example: From <strong>18</strong> To <strong>30</strong> → shows all family members aged 18–30.
            </p>
          </div>
        ) : rangeMembers.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: '#f8fafa', border: `1px dashed ${P.border}` }}>
            <Users size={28} className="mx-auto mb-2 opacity-30" style={{ color: P.muted }} />
            <p className="text-sm" style={{ color: P.muted }}>
              No active family members found aged {fromAge}–{toAge}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Count summary */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: P.accent, border: `1px solid ${P.border}` }}>
              <span className="text-xs font-semibold" style={{ color: P.body }}>
                Family members aged {fromAge}–{toAge}
              </span>
              <span className="font-mono font-bold text-sm" style={{ color: P.primary }}>
                {rangeMembers.length} found
              </span>
            </div>
            {/* Member cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {rangeMembers.map(m => (
                <div key={m.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: '#f8fafa', border: `1px solid ${P.border}` }}>
                  <span className="text-xl flex-shrink-0">{REL_ICONS[m.relationship] || '👤'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: P.dark }}>{m.name}</p>
                    <p className="text-[10px]" style={{ color: P.secondary }}>
                      {m.relationshipDisplayName}
                      {m.age != null ? ` · Age ${m.age}` : ''}
                    </p>
                    {m.phone && (
                      <p className="text-[10px] truncate" style={{ color: P.muted }}>{m.phone}</p>
                    )}
                    {m.email && (
                      <p className="text-[10px] truncate" style={{ color: P.muted }}>{m.email}</p>
                    )}
                    <div className="mt-1">
                      {m.hasAppAccess
                        ? <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#E8F5E9', color: '#2E7D32', border: '1px solid #66BB6A' }}>
                            <Wifi size={8} /> App Access
                          </span>
                        : <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#f3f4f6', color: P.muted, border: `1px solid ${P.border}` }}>
                            <WifiOff size={8} /> No Access
                          </span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── FAMILY MEMBER INLINE PANEL ─────────────────────────────────────────────
function FamilyMembersPanel({ residentId }) {
  const [members, setMembers] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getResidentFamilyMembers(residentId)
      .then(r => setMembers(r.data?.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [residentId])

  if (loading) return <div className="px-6 py-3 animate-pulse"><div className="h-4 bg-gray-100 rounded w-40" /></div>
  if (!members?.length) return <div className="px-6 py-3 text-xs" style={{ color: P.muted }}>No family members recorded.</div>

  return (
    <div className="px-4 py-3 space-y-2" style={{ background: '#f8fafa', borderTop: `1px solid ${P.border}` }}>
      <p className="text-xs font-semibold mb-2" style={{ color: P.muted }}>Family Members ({members.length})</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-3 flex items-start gap-3" style={{ border: `1px solid ${P.border}` }}>
            <span className="text-xl flex-shrink-0">{REL_ICONS[m.relationship] || '👤'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: P.dark }}>{m.name}</p>
              <p className="text-[10px]" style={{ color: P.secondary }}>{m.relationshipDisplayName}{m.age ? ` · Age ${m.age}` : ''}</p>
              {m.phone && <p className="text-[10px] truncate" style={{ color: P.muted }}>{m.phone}</p>}
              {m.email && <p className="text-[10px] truncate" style={{ color: P.muted }}>{m.email}</p>}
              <div className="mt-1">
                {m.hasAppAccess
                  ? <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#E8F5E9', color: '#2E7D32', border: '1px solid #66BB6A' }}><Wifi size={8} /> App Access · {m.loginEmail || ''}</span>
                  : <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: P.muted, border: `1px solid ${P.border}` }}><WifiOff size={8} /> No Access</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function ResidentList() {
  const [tab,          setTab]          = useState('residents')
  const [residents,    setResidents]    = useState([])
  const [filtered,     setFiltered]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('ALL')
  const [expandedId,   setExpandedId]   = useState(null)
  const [editOpen,     setEditOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [form,         setForm]         = useState(INIT_EDIT)
  const [saving,       setSaving]       = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await adminAPI.getAllResidents()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setResidents(data.filter(r =>
        !r.flatNumber?.startsWith('DEL-') &&
        r.registrationStatus === 'APPROVED' &&
        r.status === 'ACTIVE'
      ))
    } catch { toast.error('Could not load residents') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    let list = residents
    if (typeFilter !== 'ALL') list = list.filter(r => r.propertyType === typeFilter)
    if (q) list = list.filter(r =>
      [r.fullName, r.email, r.phone, r.flatNumber, r.address].some(v => v?.toLowerCase().includes(q))
    )
    setFiltered(list)
  }, [search, residents, typeFilter])

  const openEdit = (r) => {
    setForm({ fullName: r.fullName ?? '', email: r.email ?? '', phone: r.phone ?? '',
      flatNumber: r.flatNumber ?? '', squareFeet: r.squareFeet ?? '',
      familyMembers: r.familyMembers ?? '', age: r.age ?? '', vehicleDetails: r.vehicleDetails ?? '', address: r.address ?? '' })
    setEditTarget(r); setEditOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error('Full name is required'); return }
    setSaving(true)
    try {
      await adminAPI.updateResident(editTarget.id, {
        ...form,
        squareFeet: form.squareFeet ? Number(form.squareFeet) : null,
        familyMembers: form.familyMembers ? Number(form.familyMembers) : null,
        age: form.age ? Number(form.age) : null,
      })
      toast.success('Resident updated'); setEditOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSaving(false) }
  }

  const openDeleteModal = (r) => { setDeleteTarget(r); setDeleteConfirmText(''); setDeleteOpen(true) }

  const handlePermanentDelete = async () => {
    if (deleteConfirmText !== 'DELETE') { toast.error('Please type DELETE to confirm'); return }
    setDeleting(true)
    try {
      await adminAPI.deleteResident(deleteTarget.id)
      toast.success(`${deleteTarget.fullName} removed. Historical records preserved.`)
      setDeleteOpen(false); setDeleteTarget(null)
      setResidents(prev => prev.filter(x => x.id !== deleteTarget.id))
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
    finally { setDeleting(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header + tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: P.dark }}>Resident Management</h1>
          <p className="text-xs" style={{ color: P.muted }}>Property owners and apartment population</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl p-1 gap-1" style={{ background: P.accent, border: `1px solid ${P.border}` }}>
            {[{ key: 'residents', label: 'Resident Directory', icon: Users }, { key: 'population', label: 'Population Overview', icon: BarChart2 }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: tab === t.key ? P.primary : 'transparent', color: tab === t.key ? '#fff' : P.body }}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>
          {tab === 'residents' && (
            <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors" style={{ borderColor: P.border, color: P.muted }}>
              <RefreshCw size={12} /> Refresh
            </button>
          )}
        </div>
      </div>

      {tab === 'population' && <PopulationSummary />}

      {tab === 'residents' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Active Residents', value: residents.length },
              { label: 'Flat Owners',               value: residents.filter(r => r.propertyType === 'FLAT').length },
              { label: 'Villa Owners',              value: residents.filter(r => r.propertyType === 'VILLA').length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl text-center py-4 border" style={{ borderColor: P.border }}>
                <p className="text-2xl font-bold font-mono" style={{ color: P.dark }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: P.muted }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: P.border }}>
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: P.border }}>
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: P.muted }} />
                <span className="text-sm font-semibold" style={{ color: P.dark }}>Resident Directory</span>
                <span className="text-xs" style={{ color: P.muted }}>({filtered.length} shown)</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex rounded-lg p-1 gap-1" style={{ background: P.accent }}>
                  {['ALL', 'FLAT', 'VILLA'].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)} className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                      style={{ background: typeFilter === t ? '#fff' : 'transparent', color: typeFilter === t ? P.dark : P.muted }}>
                      {t === 'ALL' ? 'All' : t === 'FLAT' ? 'Flats' : 'Villas'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.muted }} />
                  <input type="text" placeholder="Search name, flat, phone…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none w-56"
                    style={{ borderColor: P.border, color: P.dark }} />
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title={search || typeFilter !== 'ALL' ? 'No results found' : 'No residents yet'}
                description={search ? `No residents match "${search}"` : typeFilter !== 'ALL' ? `No approved ${typeFilter.toLowerCase()} owners found.` : 'Approved active owners appear here.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full rt-table-animate">
                  <thead className="border-b" style={{ borderColor: P.border }}>
                    <tr>
                      {['Name', 'Email', 'Phone', 'Flat No.', 'Type', 'Sq.Ft', 'Family', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: P.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <>
                        <tr key={r.id} className="border-b transition-colors hover:bg-gray-50/50" style={{ borderColor: P.border }}>
                          
                          
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ResidentAvatar name={r.fullName} photoUrl={r.profilePhotoUrl} size={36} />
                              <span className="text-sm font-medium truncate" style={{ color: P.dark }}>{r.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: P.muted }}>{r.email || '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: P.body }}>{r.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: P.accent, color: P.dark }}>{r.flatNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded border ${r.propertyType === 'VILLA' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                              {r.propertyType === 'VILLA' ? 'Villa' : 'Flat'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: P.body }}>{r.squareFeet || '—'}</td>
                          <td className="px-4 py-3 text-xs text-center" style={{ color: P.body }}>{r.familyMembers ?? '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: P.muted }}>{r.createdAt ? formatDate(r.createdAt) : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} title="Family members"
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: expandedId === r.id ? P.primary : P.muted, background: expandedId === r.id ? P.accent : 'transparent' }}>
                                {expandedId === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                              <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg transition-colors" style={{ color: P.muted }} title="Edit"><Edit2 size={13} /></button>
                              <button onClick={() => openDeleteModal(r)} className="p-1.5 rounded-lg transition-colors hover:text-red-500" style={{ color: P.muted }} title="Delete"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === r.id && (
                          <tr key={`fm-${r.id}`}><td colSpan={9} className="p-0"><FamilyMembersPanel residentId={r.id} /></td></tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Resident">
        <div className="space-y-4">
          {editTarget && (
            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: P.border }}>
              <ResidentAvatar name={editTarget.fullName} photoUrl={editTarget.profilePhotoUrl} size={44} />
              <div>
                <p className="text-sm font-semibold" style={{ color: P.dark }}>{editTarget.fullName}</p>
                <p className="text-xs" style={{ color: P.muted }}>{editTarget.flatNumber}</p>
              </div>
            </div>
          )}
          {[
            { label: 'Full Name *', key: 'fullName', placeholder: 'Full name', cols: 1 },
            { label: 'Email', key: 'email', placeholder: 'Email', type: 'email', cols: 1 },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>{f.label}</label>
              <input value={form[f.key]} type={f.type || 'text'} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={{ borderColor: P.border }} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Phone', key: 'phone', placeholder: 'Phone' },
              { label: 'Flat Number', key: 'flatNumber', placeholder: 'e.g. A101' },
              { label: 'Square Feet', key: 'squareFeet', placeholder: 'e.g. 1200', type: 'number' },
              { label: 'Family Members', key: 'familyMembers', placeholder: 'e.g. 4', type: 'number' },
              { label: 'Age', key: 'age', placeholder: 'e.g. 35', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>{f.label}</label>
                <input value={form[f.key]} type={f.type || 'text'} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={{ borderColor: P.border }} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={{ borderColor: P.border }} placeholder="Address" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: P.body }}>Vehicle Details</label>
            <input value={form.vehicleDetails} onChange={e => setForm({ ...form, vehicleDetails: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={{ borderColor: P.border }} placeholder="e.g. MH01 AB 1234" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditOpen(false)} className="flex-1 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: P.border, color: P.muted }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
              {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }} title="Permanently Delete Resident">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">This action cannot be undone</p>
                <p className="text-xs text-red-600 mt-1">Login access revoked permanently. Historical records (payments, receipts) are preserved.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: P.border }}>
              <ResidentAvatar name={deleteTarget.fullName} photoUrl={deleteTarget.profilePhotoUrl} size={40} />
              <div>
                <p className="text-sm font-semibold" style={{ color: P.dark }}>{deleteTarget.fullName}</p>
                <p className="text-xs" style={{ color: P.muted }}>{deleteTarget.flatNumber} · {deleteTarget.email || deleteTarget.phone || '—'}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-red-600">Type <span className="font-mono font-bold">DELETE</span> to confirm</label>
              <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE"
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono" style={{ borderColor: '#FECACA' }} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }} className="flex-1 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: P.border, color: P.muted }}>Cancel</button>
              <button onClick={handlePermanentDelete} disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-red-600 disabled:opacity-50">
                {deleting && <div className="w-4 h-4 border-2 border-red-200 border-t-transparent rounded-full animate-spin" />}
                Permanently Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}