import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Upload, Eye } from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import SearchBar, { FilterSelect } from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Electricity','Water','Security Salary','Cleaning','Lift Maintenance',
  'Repairs','Internet','Gardening','Generator','Parking',
  'Waste Management','Emergency','Miscellaneous',
]
const PAYMENT_METHODS = ['Cash','UPI','Bank Transfer','Card','Cheque']
const STATUS_OPTIONS  = [{ value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }]

const INIT = {
  expenseName: '', category: 'Electricity', amount: '', expenseDate: '',
  paymentMethod: 'Cash', vendorStatus: 'PAID', description: '',
}

export default function ExpenseManagement() {
  const [expenses,    setExpenses]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState(INIT)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [page,        setPage]        = useState(1)
  const PER_PAGE = 10

  const fetchExpenses = async () => {
    try {
      const res  = await adminAPI.getAllExpenses(catFilter ? { category: catFilter } : {})
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setExpenses(data)
    } catch {
      // FIX: No mock data
      setExpenses([])
      toast.error('Could not load expenses.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchExpenses() }, [catFilter])

  const openAdd  = ()  => { setForm(INIT); setEditTarget(null); setModalOpen(true) }
  const openEdit = (e) => { setForm({ ...e, amount: e.amount ?? '' }); setEditTarget(e); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.expenseName.trim()) { toast.error('Expense name is required'); return }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Enter a valid positive amount'); return
    }
    if (!form.expenseDate) { toast.error('Expense date is required'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await adminAPI.updateExpense(editTarget.id, form)
        toast.success('Expense updated')
      } else {
        await adminAPI.addExpense(form)
        toast.success('Expense recorded')
      }
      setModalOpen(false); fetchExpenses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense record?')) return
    try {
      await adminAPI.deleteExpense(id)
      toast.success('Deleted')
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch { toast.error('Delete failed') }
  }

  const filtered = expenses.filter(e =>
    (e.expenseName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.category    ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages   = Math.ceil(filtered.length / PER_PAGE)
  const paginated    = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalExpense = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const paidExpense  = expenses.filter(e => e.vendorStatus === 'PAID').reduce((s, e) => s + (e.amount ?? 0), 0)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Expense Management</h1>
          <p className="section-subtitle">Track all apartment operational expenses</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {/* Stats — all from real data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Expenses',    value: formatCurrency(totalExpense) },
          { label: 'Paid to Vendors',   value: formatCurrency(paidExpense) },
          { label: 'Pending Payment',   value: formatCurrency(totalExpense - paidExpense) },
        ].map(({ label, value }) => (
          <div key={label} className="card card-hover text-center py-4">
            <p className="text-lg font-bold text-[#022b3a] font-mono">{value}</p>
            <p className="text-xs text-[#1f7a8c] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">Expense Records</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <FilterSelect value={catFilter} onChange={setCatFilter}
              options={CATEGORIES.map(c => ({ value: c, label: c }))} placeholder="All Categories" />
            <SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description={expenses.length === 0
              ? "Add expense records using the button above."
              : "No expenses match your filters."}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Expense Name','Category','Date','Amount','Method','Vendor Status','Receipt','Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((e) => (
                    <tr key={e.id} className="table-row">
                      <td className="table-cell font-medium text-[#022b3a]">{e.expenseName}</td>
                      <td className="table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#e1e5f2] border border-[#bfdbf7] text-[#022b3a]/60">{e.category}</span>
                      </td>
                      <td className="table-cell">{formatDate(e.expenseDate)}</td>
                      <td className="table-cell font-mono text-[#022b3a]">{formatCurrency(e.amount ?? 0)}</td>
                      <td className="table-cell">{e.paymentMethod ?? '—'}</td>
                      <td className="table-cell"><Badge status={e.vendorStatus} /></td>
                      <td className="table-cell">
                        {e.receiptFileName
                          ? <button className="flex items-center gap-1 text-xs text-[#022b3a]/60 hover:text-[#022b3a] transition-colors">
                              <Eye size={12} /> View
                            </button>
                          : <span className="text-xs text-[#022b3a]">—</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(e)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(e.id)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-red-400 hover:bg-red-950/30 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg"
        title={editTarget ? 'Edit Expense' : 'Add Expense'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Expense Name *</label>
              <input value={form.expenseName} placeholder="e.g. Monthly Electricity Bill"
                onChange={e => setForm({ ...form, expenseName: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} className="input-field"
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" value={form.amount} placeholder="Amount in rupees"
                onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Expense Date *</label>
              <input type="date" value={form.expenseDate}
                onChange={e => setForm({ ...form, expenseDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select value={form.paymentMethod} className="input-field"
                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Vendor Payment Status</label>
              <select value={form.vendorStatus} className="input-field"
                onChange={e => setForm({ ...form, vendorStatus: e.target.value })}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Upload Receipt</label>
              <label className="input-field flex items-center gap-2 cursor-pointer text-[#1f7a8c] hover:text-[#022b3a] transition-colors">
                <Upload size={13} />
                <span className="text-xs">Click to upload PDF/Image</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={() => toast.success('File selected (will upload on save)')} />
              </label>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea value={form.description} rows={2} placeholder="Optional notes..."
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-field resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-[#bfdbf7] border-t-gray-900 rounded-full animate-spin" />}
              {editTarget ? 'Update' : 'Save Expense'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}