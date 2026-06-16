import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, RefreshCw, Wrench, Users, CheckCircle,
  Clock, ChevronDown, ChevronUp, Trash2, ToggleLeft, ToggleRight,
  CalendarDays, IndianRupee, Tag, AlertCircle, X, Calculator
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

/* ── helpers ──────────────────────────────────────────────────── */
const fmt      = (n)   => `₹${Number(n ?? 0).toLocaleString('en-IN')}`
const todayStr = ()    => new Date().toISOString().split('T')[0]

const STATUS_STYLE = {
  ACTIVE:    'bg-sky-100 text-sky-700 border-sky-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
}

const CATEGORIES = [
  'Monthly Maintenance', 'Lift Maintenance', 'Water Charges',
  'Security', 'Cleaning', 'Electricity', 'Repairs', 'Other',
]

const ASSIGNMENT_TYPES = [
  { value: 'ALL',         label: 'All Properties',  desc: 'Every active resident' },
  { value: 'BLOCK',       label: 'Block-wise',       desc: 'Filter by flat prefix (e.g. A, B)' },
  { value: 'VILLA_GROUP', label: 'Villa Group',      desc: 'Only villa-type units' },
  { value: 'INDIVIDUAL',  label: 'Individual Flats', desc: 'Pick specific flats' },
]

const BLANK = {
  title: '', description: '', category: 'Monthly Maintenance',
  amount: '', dueDate: todayStr(), penaltyAmount: '', penaltyEnabled: false,
  assignmentType: 'ALL', blockPrefix: '', selectedFlats: [],
}

/* ── Batch row card ─────────────────────────────────────────── */
function BatchCard({ batch, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const paid    = batch.totalPaid    ?? 0
  const pending = batch.totalPending ?? 0
  const total   = batch.totalAssigned ?? 0
  const pct     = total > 0 ? Math.round((paid / total) * 100) : 0

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-start sm:items-center gap-3 cursor-pointer hover:bg-cyan-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-9 h-9 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
          <Wrench size={15} className="text-sky-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-blue-950 truncate">{batch.title}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[batch.status] ?? STATUS_STYLE.ACTIVE}`}>
              {batch.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="text-xs text-sky-600 flex items-center gap-1"><Tag size={10} />{batch.category}</span>
            <span className="text-xs text-sky-600 flex items-center gap-1"><CalendarDays size={10} />Due {batch.dueDate}</span>
            <span className="text-xs text-sky-600 flex items-center gap-1"><IndianRupee size={10} />{fmt(batch.amount)}/unit</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
          <div><p className="text-base font-bold text-blue-950 font-mono">{paid}</p><p className="text-[10px] text-sky-500">Paid</p></div>
          <div><p className="text-base font-bold text-sky-400 font-mono">{pending}</p><p className="text-[10px] text-sky-500">Pending</p></div>
          <div><p className="text-base font-bold text-blue-900 font-mono">{total}</p><p className="text-[10px] text-sky-500">Total</p></div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-sky-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-sky-400 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-cyan-100 px-4 py-4 bg-cyan-50/40 space-y-4">
          <div className="flex sm:hidden gap-4">
            {[['Paid', paid], ['Pending', pending], ['Total', total]].map(([l, v]) => (
              <div key={l} className="text-center">
                <p className="text-lg font-bold text-blue-950 font-mono">{v}</p>
                <p className="text-[10px] text-sky-500">{l}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-sky-600">Collection progress</span>
              <span className="text-sky-600 font-mono">{paid}/{total} · {pct}%</span>
            </div>
            <div className="w-full bg-cyan-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ['Assignment',  batch.assignmentType?.replace('_', ' ')],
              ['Assigned To', batch.assignedFlats || 'All'],
              ['Period',      batch.paymentMonth  || '—'],
              ['Penalty',     batch.penaltyEnabled ? fmt(batch.penaltyAmount) : 'None'],
            ].map(([l, v]) => (
              <div key={l} className="bg-white rounded-lg border border-cyan-200 px-3 py-2">
                <p className="text-[10px] text-sky-500 uppercase tracking-wide">{l}</p>
                <p className="text-xs text-blue-900 font-medium truncate mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          {batch.description && (
            <p className="text-xs text-sky-600 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">{batch.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {batch.status === 'ACTIVE' && (
              <button onClick={() => onStatusChange(batch.id, 'COMPLETED')}
                className="btn-secondary text-xs flex items-center gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
                <CheckCircle size={12} />Mark Completed
              </button>
            )}
            {batch.status !== 'CANCELLED' && (
              <button onClick={() => onStatusChange(batch.id, 'CANCELLED')}
                className="btn-secondary text-xs text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5">
                <X size={12} />Cancel
              </button>
            )}
            <button onClick={() => onDelete(batch.id)}
              className="btn-secondary text-xs text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 ml-auto">
              <Trash2 size={12} />Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function MaintenanceManagement() {
  const [batches,   setBatches]   = useState([])
  const [residents, setResidents] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form,      setForm]      = useState(BLANK)
  const [saving,    setSaving]    = useState(false)
  const [flatSearch,setFlatSearch]= useState('')
  const [tab,       setTab]       = useState('batches')

  /* Rate-config tab state */
  const [configs,     setConfigs]     = useState([])
  const [configModal, setConfigModal] = useState(false)
  const [editConfig,  setEditConfig]  = useState(null)
  const [configForm,  setConfigForm]  = useState({
    maintenanceType: 'Monthly', ratePerSqFt: '', amount: '',
    dueDate: todayStr(), lateFee: '', lateFeeEnabled: false,
  })

  /* ── Feature 1: Rate-per-Sq.Ft auto-calc ─────────────────────────────
     When Admin opens the Create Batch modal, we load the active monthly
     rate config.  If it has a ratePerSqFt configured, the Amount field
     is disabled and shows a "calculated per resident" notice instead.
     The actual per-resident amount is calculated server-side in
     MaintenanceService.createBatch() — this is purely UX feedback.      */
  const [activeRate, setActiveRate]     = useState(null)  // the active Maintenance config
  const [sqFtMode,   setSqFtMode]       = useState(false) // true = use rate×sqFt
  const [previewRate,setPreviewRate]    = useState('')    // rate input in batch modal

  const loadBatches  = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getMaintenanceBatches()
      setBatches(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch { toast.error('Could not load maintenance batches') }
    finally   { setLoading(false) }
  }, [])

  const loadConfigs = useCallback(async () => {
    try {
      const res = await adminAPI.getMaintenanceList()
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setConfigs(data)
      // Find the active monthly rate config for the Create Batch modal
      const active = data.find(c => c.ratePerSqFt && Number(c.ratePerSqFt) > 0)
      setActiveRate(active ?? null)
    } catch {}
  }, [])

  const loadResidents = useCallback(async () => {
    try {
      const res = await adminAPI.getActiveResidents()
      setResidents(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }, [])

  useEffect(() => { loadBatches(); loadConfigs(); loadResidents() }, [loadBatches, loadConfigs, loadResidents])

  /* form helpers */
  const patch      = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleFlat = (flat) => {
    const sel = form.selectedFlats
    patch('selectedFlats', sel.includes(flat) ? sel.filter(f => f !== flat) : [...sel, flat])
  }

  const openCreate = () => {
    setForm(BLANK)
    setFlatSearch('')
    setSqFtMode(false)
    setPreviewRate(activeRate?.ratePerSqFt ? String(activeRate.ratePerSqFt) : '')
    setModalOpen(true)
  }

  // When sqFtMode enabled, compute a representative amount for display
  // using the median sq.ft of loaded residents (UI only — backend recalculates per resident)
  const representativeAmount = (() => {
    if (!sqFtMode || !previewRate || !residents.length) return null
    const rate = Number(previewRate)
    if (isNaN(rate) || rate <= 0) return null
    const sqFts = residents.map(r => r.squareFeet ?? 0).filter(v => v > 0)
    if (!sqFts.length) return null
    const median = sqFts.sort((a, b) => a - b)[Math.floor(sqFts.length / 2)]
    return Math.ceil(rate * median)  // ceil to whole rupee — matches backend CEILING rounding
  })()

  const handleCreate = async () => {
    if (!form.title.trim())         { toast.error('Title is required'); return }
    if (!form.dueDate)              { toast.error('Due date is required'); return }

    // In sq.ft mode the backend uses ratePerSqFt; amount is optional/0
    if (!sqFtMode && (!form.amount || Number(form.amount) <= 0)) {
      toast.error('Amount must be positive'); return
    }
    if (sqFtMode && (!previewRate || Number(previewRate) <= 0)) {
      toast.error('Rate per Sq.Ft must be positive'); return
    }
    if (form.assignmentType === 'BLOCK' && !form.blockPrefix.trim()) { toast.error('Block prefix is required'); return }
    if (form.assignmentType === 'INDIVIDUAL' && !form.selectedFlats.length) { toast.error('Select at least one flat'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        // If sqFtMode: send ratePerSqFt and amount=0 so backend calculates per resident
        amount:        sqFtMode ? 0 : Number(form.amount),
        ratePerSqFt:   sqFtMode ? Number(previewRate) : null,
        penaltyAmount: form.penaltyEnabled && form.penaltyAmount ? Number(form.penaltyAmount) : 0,
        selectedFlats: form.assignmentType === 'INDIVIDUAL' ? form.selectedFlats : [],
      }
      const res = await adminAPI.createMaintenanceBatch(payload)
      const d   = res.data?.data ?? {}
      toast.success(`Batch created — ${d.totalAssigned ?? '?'} residents assigned`)
      setModalOpen(false)
      loadBatches()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create batch')
    } finally { setSaving(false) }
  }

  const handleDelete       = async (id) => {
    if (!confirm('Delete this batch? Payment records will remain.')) return
    try { await adminAPI.deleteMaintenanceBatch(id); toast.success('Deleted'); loadBatches() }
    catch { toast.error('Delete failed') }
  }

  const handleStatusChange = async (id, status) => {
    try { await adminAPI.updateBatchStatus(id, status); toast.success(`Marked ${status.toLowerCase()}`); loadBatches() }
    catch { toast.error('Update failed') }
  }

  const handleSaveConfig = async () => {
    try {
      const p = {
        ...configForm,
        ratePerSqFt: configForm.ratePerSqFt ? Number(configForm.ratePerSqFt) : null,
        amount:      configForm.amount       ? Number(configForm.amount)       : null,
        lateFee:     Number(configForm.lateFee) || 0,
      }
      editConfig ? await adminAPI.updateMaintenance(editConfig.id, p) : await adminAPI.createMaintenance(p)
      toast.success(editConfig ? 'Updated' : 'Created')
      setConfigModal(false)
      loadConfigs()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
  }

  /* summary */
  const totalAssigned = batches.reduce((s, b) => s + (b.totalAssigned ?? 0), 0)
  const totalPaid     = batches.reduce((s, b) => s + (b.totalPaid    ?? 0), 0)
  const totalPending  = batches.reduce((s, b) => s + (b.totalPending ?? 0), 0)
  const activeBatches = batches.filter(b => b.status === 'ACTIVE').length

  const shown = batches.filter(b =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase())
      || b.category?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredResidents = residents.filter(r =>
    !flatSearch || r.flatNumber?.toLowerCase().includes(flatSearch.toLowerCase())
      || r.fullName?.toLowerCase().includes(flatSearch.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Maintenance Batch Management</h1>
          {/* <p className="section-subtitle">Create and manage maintenance billing batches for residents</p> */}
        </div>
        <div className="flex gap-2">
          <button onClick={loadBatches} className="btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw size={13} />Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={13} />Create Batch
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          [Wrench,      'Total Active Batches', activeBatches],
          [Users,       'Total Assigned', totalAssigned],
          [CheckCircle, 'Paid',           totalPaid],
          [Clock,       'Pending',        totalPending],
        ].map(([Icon, label, value]) => (
          <div key={label} className="card card-hover py-4 text-center">
            <Icon size={15} className="text-sky-500 mx-auto mb-1" />
            <p className="stat-value">{value}</p>
            <p className="text-xs text-sky-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-cyan-200">
        {[['batches', 'Total Active Batches'], ['config', 'Maintenance Rate Settings']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === key ? 'border-sky-500 text-sky-700' : 'border-transparent text-sky-400 hover:text-sky-700'
            }`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Batches tab ──────────────────────────────────────────── */}
      {tab === 'batches' && (
        <div className="space-y-3">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
            <input type="text" placeholder="Search batches…" value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pl-8 text-xs" />
          </div>

          {shown.length === 0 ? (
            <div className="card flex flex-col items-center py-12 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                <Wrench size={20} className="text-sky-500" />
              </div>
              <p className="text-sm font-semibold text-blue-900">No maintenance batches yet</p>
              <p className="text-xs text-sky-500 max-w-xs">
                Create a batch to assign maintenance dues to flats and auto-generate payment records.
              </p>
              <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-2">
                <Plus size={12} />Create First Batch
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map(b => (
                <BatchCard key={b.id} batch={b} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Config tab ───────────────────────────────────────────── */}
      {tab === 'config' && (
        <div className="space-y-3">
          {/* Info banner — Feature 1 */}
          <div className="flex gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5">
            <Calculator size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-sky-600 leading-relaxed">
              <strong>Rate Per Sq.Ft:</strong> When configured, the Create Batch modal offers a
              "Calculate by Sq.Ft" mode — each owner's charge is automatically calculated as
              <em> Rate × their registered Sq.Ft</em>. Fixed Amount works as before.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditConfig(null)
                setConfigForm({ maintenanceType: 'Monthly', ratePerSqFt: '', amount: '', dueDate: todayStr(), lateFee: '', lateFeeEnabled: false })
                setConfigModal(true)
              }}
              className="btn-primary text-xs flex items-center gap-2">
              <Plus size={12} />New Config
            </button>
          </div>

          {configs.length === 0 ? (
            <div className="card py-10 text-center text-sky-500 text-sm">No rate configs configured yet</div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="border-b border-cyan-200 bg-cyan-50">
                    <tr>
                      {['Property Type', 'Rate per Sq. Ft', 'Fixed Amount', 'Due Date', 'Late Fee', 'Actions'].map(h => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map(c => (
                      <tr key={c.id} className="table-row">
                        <td className="table-cell font-medium text-blue-950">{c.maintenanceType}</td>
                        <td className="table-cell font-mono">
                          {c.ratePerSqFt ? (
                            <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-lg text-xs">
                              <Calculator size={10} />₹{c.ratePerSqFt}/sq.ft
                            </span>
                          ) : '—'}
                        </td>
                        <td className="table-cell font-mono">{c.amount ? fmt(c.amount) : '—'}</td>
                        <td className="table-cell whitespace-nowrap">{c.dueDate || '—'}</td>
                        <td className="table-cell">{c.lateFeeEnabled ? fmt(c.lateFee) : 'Off'}</td>
                        <td className="table-cell">
                          <div className="flex gap-3">
                            <button onClick={() => {
                              setEditConfig(c)
                              setConfigForm({ maintenanceType: c.maintenanceType, ratePerSqFt: c.ratePerSqFt ?? '', amount: c.amount ?? '', dueDate: c.dueDate ?? todayStr(), lateFee: c.lateFee ?? '', lateFeeEnabled: c.lateFeeEnabled })
                              setConfigModal(true)
                            }} className="text-xs text-sky-600 hover:text-sky-800">Edit</button>
                            <button onClick={async () => {
                              if (!confirm('Delete?')) return
                              try { await adminAPI.deleteMaintenance(c.id); toast.success('Deleted'); loadConfigs() }
                              catch { toast.error('Delete failed') }
                            }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ CREATE BATCH MODAL ══════════════════════════════════════ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Maintenance Batch" size="lg">
        <div className="space-y-4">

          {/* Title + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Batch Title *</label>
              <input value={form.title} onChange={e => patch('title', e.target.value)}
                placeholder="e.g. May 2025 — Monthly Maintenance" className="input-field" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => patch('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* ── Feature 1: Amount OR Rate×Sq.Ft toggle ─────────── */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-950">Maintenance Amount</p>
                <p className="text-xs text-sky-500">
                  {sqFtMode
                    ? 'Each owner is charged: Rate × their registered Sq.Ft'
                    : 'Same fixed amount for every matched resident'}
                </p>
              </div>
              {/* Toggle between Fixed and Rate×Sq.Ft modes */}
              <button onClick={() => setSqFtMode(v => !v)} className="text-sky-500 hover:text-sky-700 transition-colors" title="Toggle calculation mode">
                {sqFtMode ? <ToggleRight size={24} className="text-sky-600" /> : <ToggleLeft size={24} />}
              </button>
            </div>

            {!sqFtMode ? (
              /* Fixed amount input */
              <div>
                <label className="label">Fixed Amount per Unit (₹) *</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 text-sm font-medium">₹</span>
                  <input type="number" value={form.amount} onChange={e => patch('amount', e.target.value)}
                    placeholder="e.g. 3500" className="input-field pl-7" />
                </div>
              </div>
            ) : (
              /* Rate × Sq.Ft input */
              <div className="space-y-2">
                <label className="label flex items-center gap-1.5">
                  <Calculator size={12} className="text-sky-500" />
                  Rate per Sq.Ft (₹) *
                </label>
                <div className="flex items-end gap-3">
                  <div className="relative max-w-[140px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 text-sm font-medium">₹</span>
                    <input type="number" value={previewRate} onChange={e => setPreviewRate(e.target.value)}
                      placeholder={activeRate?.ratePerSqFt ? String(activeRate.ratePerSqFt) : 'e.g. 2.50'}
                      className="input-field pl-7" step="0.01" />
                  </div>
                  <div className="text-xs text-sky-600">per sq.ft</div>
                </div>

                {/* Preview calculation */}
                {previewRate && Number(previewRate) > 0 && (
                  <div className="bg-white border border-sky-200 rounded-xl px-3 py-2.5 space-y-1">
                    <p className="text-[11px] text-sky-500 font-semibold uppercase tracking-wide">
                      Formula Preview
                    </p>
                    <p className="text-xs text-blue-900">
                      ₹{previewRate} × resident's Sq.Ft = individual amount
                    </p>
                    {representativeAmount && (
                      <p className="text-xs text-sky-600">
                        e.g. median ({residents.map(r=>r.squareFeet??0).filter(v=>v>0).sort((a,b)=>a-b)[Math.floor(residents.filter(r=>(r.squareFeet??0)>0).length/2)] ?? '?'} sq.ft) →{' '}
                        <strong className="text-blue-900">₹{representativeAmount}</strong>
                      </p>
                    )}
                    <p className="text-[10px] text-sky-400">
                      Residents without a Sq.Ft value will be skipped or receive the configured fixed amount.
                    </p>
                  </div>
                )}

                {/* Quick-fill from existing rate config */}
                {activeRate && (
                  <button
                    onClick={() => setPreviewRate(String(activeRate.ratePerSqFt))}
                    className="text-[11px] text-sky-600 hover:text-sky-800 underline underline-offset-2">
                    Use configured rate (₹{activeRate.ratePerSqFt}/sq.ft)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="label">Due Date *</label>
            <input type="date" value={form.dueDate} onChange={e => patch('dueDate', e.target.value)}
              className="input-field max-w-xs" />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <span className="normal-case font-normal text-sky-400">(optional)</span></label>
            <textarea value={form.description} onChange={e => patch('description', e.target.value)}
              placeholder="Additional notes for residents…" rows={2} className="input-field resize-none" />
          </div>

          {/* Penalty toggle */}
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-950">Late Penalty</p>
                <p className="text-xs text-sky-500">Charge a penalty for overdue payments</p>
              </div>
              <button onClick={() => patch('penaltyEnabled', !form.penaltyEnabled)} className="text-sky-500 hover:text-sky-700 transition-colors">
                {form.penaltyEnabled ? <ToggleRight size={24} className="text-sky-600" /> : <ToggleLeft size={24} />}
              </button>
            </div>
            {form.penaltyEnabled && (
              <div>
                <label className="label">Penalty Amount (₹)</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 text-sm">₹</span>
                  <input type="number" value={form.penaltyAmount} onChange={e => patch('penaltyAmount', e.target.value)}
                    placeholder="e.g. 500" className="input-field pl-7" />
                </div>
              </div>
            )}
          </div>

          {/* Assignment scope */}
          <div>
            <label className="label">Assignment Scope *</label>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNMENT_TYPES.map(({ value, label, desc }) => (
                <button key={value} onClick={() => patch('assignmentType', value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.assignmentType === value ? 'border-sky-400 bg-sky-50' : 'border-cyan-200 hover:border-sky-300 bg-white'
                  }`}>
                  <p className="text-xs font-semibold text-blue-950">{label}</p>
                  <p className="text-[10px] text-sky-500 mt-0.5 leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {form.assignmentType === 'BLOCK' && (
            <div>
              <label className="label">Block Prefix *</label>
              <input value={form.blockPrefix} onChange={e => patch('blockPrefix', e.target.value.toUpperCase())}
                placeholder="e.g. A" maxLength={5} className="input-field max-w-xs uppercase" />
              <p className="text-xs text-sky-400 mt-1">Matches flats starting with this letter</p>
            </div>
          )}

          {form.assignmentType === 'INDIVIDUAL' && (
            <div className="rounded-xl border border-cyan-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-950">
                  Select Flats
                  {form.selectedFlats.length > 0 && (
                    <span className="ml-2 text-sky-500 font-normal">({form.selectedFlats.length} selected)</span>
                  )}
                </p>
                {form.selectedFlats.length > 0 && (
                  <button onClick={() => patch('selectedFlats', [])} className="text-[10px] text-sky-400 hover:text-red-500">Clear all</button>
                )}
              </div>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-400" />
                <input type="text" placeholder="Search flat or name…" value={flatSearch}
                  onChange={e => setFlatSearch(e.target.value)} className="input-field pl-7 text-xs" />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredResidents.length === 0 ? (
                  <p className="text-xs text-sky-400 text-center py-4">
                    {residents.length === 0 ? 'No active residents' : 'No results'}
                  </p>
                ) : filteredResidents.map(r => {
                  const sel = form.selectedFlats.includes(r.flatNumber)
                  return (
                    <button key={r.id} onClick={() => toggleFlat(r.flatNumber)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all border ${
                        sel ? 'bg-sky-50 border-sky-300' : 'hover:bg-cyan-50 border-transparent'
                      }`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        sel ? 'bg-sky-600 border-sky-600' : 'border-cyan-300'
                      }`}>
                        {sel && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-950 truncate">{r.fullName}</p>
                        <p className="text-[10px] text-sky-500">
                          {r.flatNumber}
                          {r.squareFeet ? ` · ${r.squareFeet} sq.ft` : ''}
                          {sqFtMode && r.squareFeet && previewRate
                            ? ` → ₹${Math.ceil(Number(previewRate) * r.squareFeet)}`
                            : ''}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-sky-600 leading-relaxed">
              {sqFtMode
                ? 'Each matched resident will receive a PENDING payment equal to Rate × their Sq.Ft. Residents without Sq.Ft data will be skipped.'
                : 'A PENDING payment record will be created for each matched active resident. Residents with an existing payment for the same month are skipped.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 order-2 sm:order-1">Cancel</button>
            <button onClick={handleCreate} disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 order-1 sm:order-2">
              {saving && <div className="w-4 h-4 border-2 border-sky-200 border-t-white rounded-full animate-spin" />}
              {saving ? 'Creating…' : 'Create Batch'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Config modal */}
      <Modal isOpen={configModal} onClose={() => setConfigModal(false)}
        title={editConfig ? 'Edit Rate Config' : 'New Rate Config'}>
        <div className="space-y-4">
          <div>
            <label className="label">Maintenance Type</label>
            <select value={configForm.maintenanceType}
              onChange={e => setConfigForm({ ...configForm, maintenanceType: e.target.value })}
              className="input-field">
              {['Monthly', 'Quarterly', 'Yearly', 'Special'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1.5">
                <Calculator size={12} className="text-sky-500" />
                Rate per Sq.Ft (₹)
              </label>
              <input type="number" value={configForm.ratePerSqFt}
                onChange={e => setConfigForm({ ...configForm, ratePerSqFt: e.target.value })}
                placeholder="e.g. 2.5" className="input-field" step="0.01" />
              <p className="text-[10px] text-sky-400 mt-1">Amount = Rate × Owner's Sq.Ft</p>
            </div>
            <div>
              <label className="label">Fixed Amount (₹)</label>
              <input type="number" value={configForm.amount}
                onChange={e => setConfigForm({ ...configForm, amount: e.target.value })}
                placeholder="e.g. 3500" className="input-field" />
              <p className="text-[10px] text-sky-400 mt-1">Used if no Sq.Ft rate set</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={configForm.dueDate}
                onChange={e => setConfigForm({ ...configForm, dueDate: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Late Fee (₹)</label>
              <input type="number" value={configForm.lateFee}
                onChange={e => setConfigForm({ ...configForm, lateFee: e.target.value })}
                placeholder="e.g. 500" className="input-field" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-cyan-200 px-4 py-3 bg-cyan-50/50">
            <span className="text-sm font-medium text-blue-950">Enable Late Fee</span>
            <button onClick={() => setConfigForm({ ...configForm, lateFeeEnabled: !configForm.lateFeeEnabled })}>
              {configForm.lateFeeEnabled
                ? <ToggleRight size={22} className="text-sky-600" />
                : <ToggleLeft  size={22} className="text-sky-300" />}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button onClick={() => setConfigModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSaveConfig} className="btn-primary flex-1">Save Config</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}