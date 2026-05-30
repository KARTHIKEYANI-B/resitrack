import { useState, useEffect } from 'react'
import { Edit2, Trash2, Search, RefreshCw, Users } from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const INIT_EDIT = {
  fullName: '', email: '', phone: '',
  flatNumber: '', squareFeet: '', familyMembers: '', vehicleDetails: '', address: '',
}

export default function ResidentList() {
  const [residents, setResidents] = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [editOpen,  setEditOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form,      setForm]      = useState(INIT_EDIT)
  const [saving,    setSaving]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res  = await adminAPI.getAllResidents()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setResidents(data)
      setFiltered(data)
    } catch {
      toast.error('Could not load residents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) { setFiltered(residents); return }
    setFiltered(residents.filter(r =>
      [r.fullName, r.email, r.phone, r.flatNumber, r.address]
        .some(v => v?.toLowerCase().includes(q))
    ))
  }, [search, residents])

  const openEdit = (r) => {
    setForm({
      fullName:      r.fullName      ?? '',
      email:         r.email         ?? '',
      phone:         r.phone         ?? '',
      flatNumber:    r.flatNumber    ?? '',
      squareFeet:    r.squareFeet    ?? '',
      familyMembers: r.familyMembers ?? '',
      vehicleDetails:r.vehicleDetails ?? '',
      address:       r.address       ?? '',
    })
    setEditTarget(r)
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error('Full name is required'); return }
    setSaving(true)
    try {
      await adminAPI.updateResident(editTarget.id, {
        ...form,
        squareFeet:    form.squareFeet    ? Number(form.squareFeet)    : null,
        familyMembers: form.familyMembers ? Number(form.familyMembers) : null,
      })
      toast.success('Resident updated')
      setEditOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r) => {
    if (!confirm(`Delete ${r.fullName} (${r.flatNumber})? This cannot be undone.`)) return
    try {
      await adminAPI.deleteResident(r.id)
      toast.success('Resident deleted')
      setResidents(prev => prev.filter(x => x.id !== r.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const statusBadge = (s) => {
    const cls = s === 'ACTIVE'
      ? 'bg-[#bfdbf7] text-[#022b3a] border border-[#bfdbf7]'
      : 'bg-white text-[#1f7a8c] border border-[#bfdbf7]'
    return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{s}</span>
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Residents</h1>
          <p className="section-subtitle">View and manage registered residents</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Residents', value: residents.length },
          { label: 'Active',          value: residents.filter(r => r.status === 'ACTIVE').length },
          { label: 'Inactive',        value: residents.filter(r => r.status !== 'ACTIVE').length },
        ].map(({ label, value }) => (
          <div key={label} className="card card-hover text-center py-4">
            <p className="text-2xl font-bold text-[#022b3a] font-mono">{value}</p>
            <p className="text-xs text-[#1f7a8c] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#bfdbf7] flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-[#022b3a] flex items-center gap-2">
            <Users size={15} className="text-[#022b3a]/60" />
            Resident Directory
            <span className="text-xs text-[#1f7a8c] font-normal">({filtered.length} shown)</span>
          </h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
            <input
              type="text"
              placeholder="Search name, flat, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-8 w-56 text-xs"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No results found' : 'No residents yet'}
            description={search ? `No residents match "${search}"` : 'Residents appear here after they register and are approved.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#bfdbf7] bg-white/50">
                <tr>
                  {['Name', 'Email', 'Phone', 'Flat No.', 'Sq.Ft', 'Family', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell font-medium text-[#022b3a]">{r.fullName}</td>
                    <td className="table-cell text-[#022b3a]/60 text-xs">{r.email || '—'}</td>
                    <td className="table-cell">{r.phone || '—'}</td>
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-[#e1e5f2] border border-[#bfdbf7] text-[#022b3a] px-2 py-0.5 rounded">
                        {r.flatNumber}
                      </span>
                    </td>
                    <td className="table-cell font-mono">{r.squareFeet ? `${r.squareFeet}` : '—'}</td>
                    <td className="table-cell text-center">{r.familyMembers ?? '—'}</td>
                    <td className="table-cell">{statusBadge(r.status)}</td>
                    <td className="table-cell text-xs text-[#1f7a8c]">{r.createdAt ? formatDate(r.createdAt) : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all"
                          title="Edit resident">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(r)}
                          className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-red-400 hover:bg-red-950/30 transition-all"
                          title="Delete resident">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Resident">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="input-field" placeholder="Full name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="Email address" type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input-field" placeholder="Phone number" />
            </div>
            <div>
              <label className="label">Flat Number</label>
              <input value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })}
                className="input-field" placeholder="e.g. A101" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Square Feet</label>
              <input type="number" value={form.squareFeet} onChange={e => setForm({ ...form, squareFeet: e.target.value })}
                className="input-field" placeholder="e.g. 1200" />
            </div>
            <div>
              <label className="label">Family Members</label>
              <input type="number" value={form.familyMembers} onChange={e => setForm({ ...form, familyMembers: e.target.value })}
                className="input-field" placeholder="e.g. 4" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="input-field" placeholder="Address" />
          </div>
          <div>
            <label className="label">Vehicle Details</label>
            <input value={form.vehicleDetails} onChange={e => setForm({ ...form, vehicleDetails: e.target.value })}
              className="input-field" placeholder="e.g. MH01 AB 1234" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}