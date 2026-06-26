import { useState, useEffect, useCallback } from 'react'
import { Download, Eye, Printer, FileText, RefreshCw, CheckCircle, Search } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// Re-use the same receipt layout defined in admin Receipts (copy inline here
// so UserReceipts has no cross-module import dependency)
import { ReceiptLayout } from '../admin/Receipts'

/* ── Helper ──────────────────────────────────────────────────────────── */
function monthDisplay(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return { value: y, label: String(y) }
})

export default function UserReceipts() {
  const { user } = useAuth()
  const [receipts,  setReceipts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [viewItem,  setViewItem]  = useState(null)
  const PER_PAGE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await userAPI.getReceipts({})
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setReceipts(data)
    } catch { toast.error('Could not load receipts') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDownload = async (id) => {
    try {
      const res  = await userAPI.downloadReceipt(id)
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a    = document.createElement('a')
      a.href     = url
      a.download = `receipt-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const handlePrint = () => {
    const content = document.getElementById('receipt-preview')
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body{font-family:monospace;background:#fff;display:flex;justify-content:center;padding:20px}
        *{box-sizing:border-box}
        @media print{body{padding:0}}
      </style>
      </head><body>${content.outerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const q        = search.toLowerCase()
  const filtered = receipts.filter(r =>
    (r.receiptNumber ?? '').toLowerCase().includes(q) ||
    (r.paymentMonth  ?? '').toLowerCase().includes(q)
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">My Receipts</h1>
          <p className="section-subtitle">Download or print your verified payment receipts</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center justify-center gap-2 self-start sm:self-auto">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card card-hover text-center py-4">
          <p className="text-2xl font-bold font-mono text-[#022b3a]">{receipts.length}</p>
          <p className="text-xs text-[#1f7a8c] mt-1">Total Receipts</p>
        </div>
        <div className="card card-hover text-center py-4">
          <p className="text-lg font-bold font-mono text-[#022b3a]">
            {formatCurrency(receipts.reduce((s, r) => s + Number(r.totalAmount ?? r.paidAmount ?? 0), 0))}
          </p>
          <p className="text-xs text-[#1f7a8c] mt-1">Total Paid</p>
        </div>
      </div>

      {/* Receipts list */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">My Payment Receipts</h2>
          <div className="relative w-full sm:w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search receipt no…"
              className="input-field pl-8 w-full text-xs" />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title="No receipts yet"
            description="Receipts are generated after your payment is verified by admin."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full rt-table-animate">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Receipt No.', 'Billing Month', 'Amount Paid', 'Late Fee', 'Payment Date', 'Payment Method', 'Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell font-mono text-xs text-[#022b3a]">{r.receiptNumber}</td>
                      <td className="table-cell text-sm font-medium text-[#022b3a]">
                        {monthDisplay(r.paymentMonth)}
                      </td>
                      <td className="table-cell font-mono text-[#022b3a]">
                        {formatCurrency(r.totalAmount ?? r.paidAmount)}
                      </td>
                      <td className="table-cell font-mono text-xs">
                        {r.lateFeeAmount > 0
                          ? <span className="text-[#022b3a]">{formatCurrency(r.lateFeeAmount)}</span>
                          : <span className="text-[#022b3a]/30">—</span>}
                      </td>
                      <td className="table-cell text-xs">{formatDate(r.paymentDate)}</td>
                      <td className="table-cell text-xs">{r.paymentMethod || '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewItem(r)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all" title="View">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => handleDownload(r.id)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all" title="Download">
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#bfdbf7]">
              {paginated.map(r => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#022b3a]">{r.receiptNumber}</p>
                      <p className="text-sm font-semibold text-[#022b3a] mt-1">{monthDisplay(r.paymentMonth)}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-950/30 border border-green-900/50 text-green-400">
                      Paid
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[#1f7a8c]">Amount</p>
                      <p className="font-mono font-semibold text-[#022b3a]">
                        {formatCurrency(r.totalAmount ?? r.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#1f7a8c]">Date</p>
                      <p className="text-[#022b3a]">{formatDate(r.paymentDate)}</p>
                    </div>
                    <div>
                      <p className="text-[#1f7a8c]">Method</p>
                      <p className="text-[#022b3a]">{r.paymentMethod || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewItem(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[#e1e5f2] text-[#022b3a] hover:bg-[#bfdbf7] transition-all">
                      <Eye size={12} /> View Receipt
                    </button>
                    <button onClick={() => handleDownload(r.id)}
                      className="flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-[#e1e5f2] text-[#1f7a8c] hover:bg-[#bfdbf7] transition-all">
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Receipt Preview Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Receipt Preview" size="lg">
        {viewItem && (
          <>
            <ReceiptLayout receipt={viewItem} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleDownload(viewItem.id)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Download size={13} /> Download PDF
              </button>
              <button onClick={handlePrint}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Printer size={13} /> Print Receipt
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}