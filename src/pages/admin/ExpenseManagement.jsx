import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Upload, Eye, Tag, X, Check, Pencil } from 'lucide-react'
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

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque']
const STATUS_OPTIONS  = [{ value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }]

const INIT = {
  expenseName: '', category: '', amount: '', expenseDate: '',
  paymentMethod: 'Cash', vendorStatus: 'PAID', description: '',
}

// ── Category Manager Modal ────────────────────────────────────────────────
function CategoryManagerModal({ open, onClose, onCategoriesChanged }) {
  const [categories, setCategories]   = useState([])
  const [loading,    setLoading]      = useState(true)
  const [newName,    setNewName]      = useState('')
  const [adding,     setAdding]       = useState(false)
  const [editId,     setEditId]       = useState(null)
  const [editName,   setEditName]     = useState('')
  const [saving,     setSaving]       = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getAllExpenseCategoryObjects()
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setCategories(list)
    } catch { toast.error('Could not load categories') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open) { loadCategories(); setNewName(''); setEditId(null) } }, [open])

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Enter a category name'); return }
    setAdding(true)
    try {
      await adminAPI.createExpenseCategory(newName.trim())
      toast.success('Category created')
      setNewName('')
      await loadCategories()
      onCategoriesChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create category')
    } finally { setAdding(false) }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) { toast.error('Enter a category name'); return }
    setSaving(true)
    try {
      await adminAPI.updateExpenseCategory(id, editName.trim())
      toast.success('Category updated')
      setEditId(null)
      await loadCategories()
      onCategoriesChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update category')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?\n\nExpenses already using it will keep their category label for history.`)) return
    try {
      await adminAPI.deleteExpenseCategory(id)
      toast.success('Category deleted')
      await loadCategories()
      onCategoriesChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete category')
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Manage Expense Categories" size="md">
      <div className="space-y-4">
        {/* Add new */}
        <div>
          <label className="label">Add New Category</label>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Generator Maintenance"
              className="input-field flex-1"
            />
            <button onClick={handleAdd} disabled={adding}
              className="btn-primary flex items-center gap-1.5 px-4 whitespace-nowrap">
              {adding
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Add
            </button>
          </div>
        </div>

        {/* Category list */}
        <div className="border border-[#bfdbf7] rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-[#1f7a8c]">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#1f7a8c]">No categories found</div>
          ) : (
            <div className="divide-y divide-[#bfdbf7]">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[#f0f8fb] transition-colors">
                  <Tag size={12} className="text-[#1f7a8c] flex-shrink-0" />

                  {editId === cat.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditId(null) }}
                        className="input-field flex-1 py-1 text-xs"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(cat.id)} disabled={saving}
                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-all">
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="p-1.5 rounded-lg text-[#1f7a8c] hover:bg-[#e1e5f2] transition-all">
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-[#022b3a]">{cat.name}</span>
                      {cat.builtIn && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e1e5f2] text-[#1f7a8c]">built-in</span>
                      )}
                      <button
                        onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                        className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-red-400 hover:bg-red-950/20 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* <p className="text-[11px] text-[#1f7a8c]">
          Deleting a category keeps existing expense records unchanged (historical data preserved).
          Renaming updates all existing expense records automatically.
        </p> */}

        <button onClick={onClose} className="btn-secondary w-full">Done</button>
      </div>
    </Modal>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function ExpenseManagement() {
  const [expenses,    setExpenses]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [catMgrOpen,  setCatMgrOpen]  = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState(INIT)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [page,        setPage]        = useState(1)

  // DB-driven category list — always fetched fresh from backend
  const [categories, setCategories] = useState([])

  const PER_PAGE = 10

  const fetchCategories = async () => {
    try {
      const res = await adminAPI.getExpenseCategories()
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      if (list.length) {
        setCategories(list)
        // Initialise form default category to first in list
        setForm(f => ({ ...f, category: f.category || list[0] || '' }))
      }
    } catch { /* retain current list */ }
  }

  const fetchExpenses = async () => {
    try {
      const res  = await adminAPI.getAllExpenses(catFilter ? { category: catFilter } : {})
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setExpenses(data)
    } catch {
      setExpenses([])
      toast.error('Could not load expenses.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchExpenses() }, [catFilter])

  const openAdd  = ()  => { setForm({ ...INIT, category: categories[0] || '' }); setEditTarget(null); setModalOpen(true) }
  const openEdit = (e) => { setForm({ ...e, amount: e.amount ?? '' }); setEditTarget(e); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.expenseName.trim()) { toast.error('Expense name is required'); return }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Enter a valid positive amount'); return
    }
    if (!form.expenseDate) { toast.error('Expense date is required'); return }
    if (!form.category)    { toast.error('Select a category'); return }
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
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) ?? 0), 0)
  const paidExpense  = expenses.filter(e => e.vendorStatus === 'PAID').reduce((s, e) => s + (Number(e.amount) ?? 0), 0)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title text-xl">Expense Management</h1>
          {/* <p className="section-subtitle">Track all apartment operational expenses</p> */}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCatMgrOpen(true)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Tag size={13} /> Manage Categories
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Expenses',  value: formatCurrency(totalExpense) },
          { label: 'Paid to Vendors', value: formatCurrency(paidExpense) },
          { label: 'Pending Payment', value: formatCurrency(totalExpense - paidExpense) },
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
            <FilterSelect value={catFilter} onChange={v => { setCatFilter(v); setPage(1) }}
              options={categories.map(c => ({ value: c, label: c }))} placeholder="All Categories" />
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search expenses..." />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description={expenses.length === 0
              ? 'Add expense records using the button above.'
              : 'No expenses match your filters.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full rt-table-animate">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Expense Name', 'Category', 'Date', 'Amount', 'Method', 'Vendor Status', 'Receipt', 'Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((e) => (
                    <tr key={e.id} className="table-row">
                      <td className="table-cell font-medium text-[#022b3a]">{e.expenseName}</td>
                      <td className="table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#e1e5f2] border border-[#bfdbf7] text-[#022b3a]/60">
                          {e.category}
                        </span>
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

      {/* Add / Edit Expense Modal */}
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
              <label className="label">Category *</label>
              <select value={form.category} className="input-field"
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
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

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={catMgrOpen}
        onClose={() => setCatMgrOpen(false)}
        onCategoriesChanged={fetchCategories}
      />
    </div>
  )
}